import express from 'express';
import { User, Order, OrderDayBill, OrderItem, Product, Unit, sequelize } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { createOrder, verifyPayment } from '../services/razorpay.js';
import { printBill } from '../services/printer.js';

const router = express.Router();

// Helper function to print with retry logic
async function printWithRetry(dayBill, unit, order, product, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await printBill(dayBill, unit, order, product);
      return { success: true, attempt };
    } catch (error) {
      console.error(`Print attempt ${attempt}/${maxRetries} failed:`, error.message);
      if (attempt < maxRetries) {
        // Wait longer between retries
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  return { success: false, error: 'Max retries exceeded' };
}

// Helper function to print all bills for an order
async function printOrderBills(order, transaction = null) {
  const printResults = [];
  let allPrintsSucceeded = true;
  let totalTicketsPrinted = 0;

  for (const dayBill of order.dayBills) {
    try {
      // Print each product the number of times specified by quantity
      for (let itemIndex = 0; itemIndex < dayBill.items.length; itemIndex++) {
        const item = dayBill.items[itemIndex];
        const singleProduct = [{
          product: item.product,
          unit_price: item.unit_price,
          quantity: 1,  // Always 1 per ticket
          total_price: item.unit_price  // Price for 1 item
        }];

        // Print 'quantity' times for this product
        for (let i = 0; i < item.quantity; i++) {
          const printResult = await printWithRetry(dayBill, order.unit, order, singleProduct);

          printResults.push({
            billId: dayBill.id,
            billDate: dayBill.bill_date,
            productId: item.product_id,
            productName: item.product.name_en,
            ticketNumber: i + 1,
            totalTickets: item.quantity,
            success: printResult.success,
            attempt: printResult.attempt,
            error: printResult.error
          });

          if (printResult.success) {
            totalTicketsPrinted++;
          } else {
            allPrintsSucceeded = false;
          }

          // Add delay between prints to prevent printer buffer overflow
          if (i < item.quantity - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        // Slightly longer delay between different products (skip for last product)
        if (itemIndex < dayBill.items.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Mark bill as printed if all tickets succeeded
      const billPrintResults = printResults.filter(r => r.billId === dayBill.id);
      const billAllSuccess = billPrintResults.every(r => r.success);

      if (billAllSuccess) {
        const updateData = {
          is_printed: true,
          printed_at: new Date()
        };

        if (transaction) {
          await dayBill.update(updateData, { transaction });
        } else {
          await dayBill.update(updateData);
        }
      }

    } catch (printError) {
      console.error(`Print error for bill ${dayBill.id}:`, printError);
      printResults.push({
        billId: dayBill.id,
        billDate: dayBill.bill_date,
        success: false,
        error: printError.message
      });
      allPrintsSucceeded = false;
    }
  }

  return { printResults, allPrintsSucceeded, totalTicketsPrinted };
}

// Create order
router.post('/', requireAuth, async (req, res) => {
  try {
    const { product_ids, selected_dates, payment_mode, unit_id } = req.body;

    if (!product_ids || !selected_dates || !payment_mode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate payment_mode enum - only these 4 modes are allowed
    const validPaymentModes = ['UPI', 'CASH', 'FREE', 'GUEST'];
    if (!validPaymentModes.includes(payment_mode)) {
      return res.status(400).json({ error: `Invalid payment_mode. Must be one of: ${validPaymentModes.join(', ')}` });
    }

    // Get user with unit
    const user = await User.findByPk(req.userId, {
      include: [{
        model: Unit,
        as: 'unit'
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'user' && !user.unit_id) {
      return res.status(400).json({ error: 'User is not assigned to a unit. Please contact administrator.' });
    }

    // Determine target unit: admins can specify unit_id, regular users use their assigned unit
    let targetUnitId = user.unit_id;
    if (user.role === 'admin' && unit_id) {
      // Verify the unit exists
      const targetUnit = await Unit.findByPk(unit_id);
      if (!targetUnit) {
        return res.status(400).json({ error: 'Invalid unit_id' });
      }
      targetUnitId = unit_id;
    }

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({ error: 'At least one product must be selected' });
    }

    if (!Array.isArray(selected_dates) || selected_dates.length === 0) {
      return res.status(400).json({ error: 'At least one date must be selected' });
    }

    // Get products and calculate per-day total
    // First, get identifying unique IDs to query the database efficiently
    const uniqueProductIds = [...new Set(product_ids)];

    const foundProducts = await Product.findAll({
      where: {
        id: uniqueProductIds
      }
    });

    // Check if all unique product IDs exist
    if (foundProducts.length !== uniqueProductIds.length) {
      const foundIds = foundProducts.map(p => p.id);
      const missingIds = uniqueProductIds.filter(id => !foundIds.includes(id));
      console.error(`[Order Creation] Missing product IDs: ${missingIds.join(', ')}`);
      return res.status(400).json({
        error: `Products not found: ${missingIds.join(', ')}`
      });
    }

    // Validate active status and unit on the unique products found
    // Check for inactive products
    const inactiveProducts = foundProducts.filter(p => !p.is_active);
    if (inactiveProducts.length > 0) {
      const inactiveNames = inactiveProducts.map(p => `${p.name_en} (ID: ${p.id})`).join(', ');
      console.error(`[Order Creation] Inactive products: ${inactiveNames}`);
      return res.status(400).json({
        error: `These products are inactive: ${inactiveNames}`
      });
    }

    // Check for products from wrong unit
    const wrongUnitProducts = foundProducts.filter(p => p.unit_id !== targetUnitId);
    if (wrongUnitProducts.length > 0) {
      const wrongUnitNames = wrongUnitProducts.map(p => `${p.name_en} (ID: ${p.id}, belongs to unit ${p.unit_id})`).join(', ');
      console.error(`[Order Creation] Products from wrong unit: ${wrongUnitNames}. Target unit: ${targetUnitId}`);
      return res.status(400).json({
        error: `These products don't belong to the selected unit: ${wrongUnitNames.split(', ').map(n => n.split(' (')[0]).join(', ')}`
      });
    }

    // All validations passed. Now reconstruct the full list of products (including duplicates)
    // based on the incoming product_ids array order and count.
    const products = product_ids.map(id => foundProducts.find(p => p.id === id));

    const perDayTotal = products.reduce((sum, product) => sum + parseFloat(product.price), 0);
    const grandTotal = perDayTotal * selected_dates.length;

    // Get unit for printer config
    const unit = await Unit.findByPk(targetUnitId);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Create order
    const order = await Order.create({
      user_id: req.userId,
      unit_id: targetUnitId,
      payment_mode: payment_mode,
      payment_status: payment_mode === 'GUEST' ? 'PAID' : 'PENDING',
      total_amount: grandTotal
    });

    // Create day bills and items
    const dayBills = [];
    for (const date of selected_dates) {
      const dayBill = await OrderDayBill.create({
        order_id: order.id,
        bill_date: date,
        amount: perDayTotal,
        printer_ip_snapshot: unit.printer_ip,
        printer_port_snapshot: unit.printer_port
      });

      // Create items for this day bill
      for (const product of products) {
        await OrderItem.create({
          order_day_bill_id: dayBill.id,
          product_id: product.id,
          quantity: 1,
          unit_price: parseFloat(product.price),
          total_price: parseFloat(product.price)
        });
      }

      dayBills.push(dayBill);
    }

    res.status(201).json({
      order,
      dayBills,
      perDayTotal,
      grandTotal
    });
  } catch (error) {
    console.error('Create order error:', error);
    // Return more specific error messages
    if (error.name === 'SequelizeDatabaseError' || error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message || 'Database validation error' });
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Pay with cash
router.post('/:id/pay-cash', requireAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{
        model: OrderDayBill,
        as: 'dayBills',
        include: [{
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product'
          }]
        }]
      }, {
        model: Unit,
        as: 'unit'
      }],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user_id !== req.userId && req.userRole !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark CASH payment as successful first
    await order.update({
      payment_mode: 'CASH',
      payment_status: 'PAID'
    }, { transaction });

    await transaction.commit();

    // Print all day bills AFTER transaction committed (CASH mode - print immediately)
    const { printResults, allPrintsSucceeded, totalTicketsPrinted } = await printOrderBills(order);

    console.log(`[CASH] Order ${order.id}: Printed ${totalTicketsPrinted} tickets, all_success=${allPrintsSucceeded}`);

    if (allPrintsSucceeded) {
      res.json({
        success: true,
        order,
        printResults,
        totalTicketsPrinted
      });
    } else {
      res.status(500).json({
        error: 'Payment successful, but printing failed for some bills. You can retry printing from the admin logs page.',
        order,
        printResults,
        totalTicketsPrinted
      });
    }
  } catch (error) {
    await transaction.rollback();
    console.error('Pay cash error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pay with free meals
router.post('/:id/pay-free', requireAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{
        model: OrderDayBill,
        as: 'dayBills',
        include: [{
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product'
          }]
        }]
      }, {
        model: Unit,
        as: 'unit'
      }],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user_id !== req.userId && req.userRole !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({ error: 'Access denied' });
    }

    // Mark FREE payment as successful first
    await order.update({
      payment_mode: 'FREE',
      payment_status: 'PAID'
    }, { transaction });

    await transaction.commit();

    // Print all day bills AFTER transaction committed (FREE mode - print immediately)
    const { printResults, allPrintsSucceeded, totalTicketsPrinted } = await printOrderBills(order);

    console.log(`[FREE] Order ${order.id}: Printed ${totalTicketsPrinted} tickets, all_success=${allPrintsSucceeded}`);

    if (allPrintsSucceeded) {
      res.json({
        success: true,
        order,
        printResults,
        totalTicketsPrinted
      });
    } else {
      res.status(500).json({
        error: 'Payment successful, but printing failed for some bills. You can retry printing from the admin logs page.',
        order,
        printResults,
        totalTicketsPrinted
      });
    }
  } catch (error) {
    await transaction.rollback();
    console.error('Pay free error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pay as guest (no printing)
router.post('/:id/pay-guest', requireAuth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await order.update({
      payment_mode: 'GUEST',
      payment_status: 'PAID'
    });

    // No printing for guest mode

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Pay guest error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create Razorpay order
router.post('/:id/create-razorpay-order', requireAuth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const razorpayOrder = await createOrder(
      parseFloat(order.total_amount),
      'INR',
      `order_${order.id}`
    );

    await order.update({
      razorpay_order_id: razorpayOrder.id
    });

    res.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify Razorpay payment
router.post('/:id/verify-razorpay', requireAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_signature) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Missing payment details' });
    }

    // Load order + associations inside transaction for verification
    const order = await Order.findByPk(req.params.id, {
      include: [{
        model: OrderDayBill,
        as: 'dayBills',
        include: [{
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product'
          }]
        }]
      }, {
        model: Unit,
        as: 'unit'
      }],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user_id !== req.userId && req.userRole !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!order.razorpay_order_id) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Razorpay order not found' });
    }

    const isValid = verifyPayment(
      order.razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      // Mark as FAILED but keep the order and bills for logs
      await order.update(
        {
          payment_mode: 'UPI',
          payment_status: 'FAILED'
        },
        { transaction }
      );

      await transaction.commit();

      return res.status(400).json({
        error: 'Payment verification failed.',
        order
      });
    }

    // Verification succeeded – mark order as PAID inside transaction
    await order.update({
      payment_mode: 'UPI',
      payment_status: 'PAID'
    }, { transaction });

    await transaction.commit();

    // Reload order without transaction to return fresh data
    const freshOrder = await Order.findByPk(order.id, {
      include: [{
        model: OrderDayBill,
        as: 'dayBills',
        include: [{
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product'
          }]
        }]
      }, {
        model: Unit,
        as: 'unit'
      }]
    });

    // Respond immediately so kiosk can redirect to success page
    res.json({
      success: true,
      order: freshOrder,
      printResults: [] // printing is handled asynchronously
    });

    // Kick off background printing AFTER response so UI isn't blocked
    (async () => {
      try {
        const { printResults, allPrintsSucceeded, totalTicketsPrinted } = await printOrderBills(freshOrder);

        console.log(`[UPI] Order ${freshOrder.id}: payment=PAID, printed=${totalTicketsPrinted} tickets, all_success=${allPrintsSucceeded}, bills_count=${freshOrder.dayBills?.length || 0}`);
      } catch (bgError) {
        console.error('Background print error:', bgError);
      }
    })();
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error('Rollback error in verify-razorpay:', rollbackError);
    }
    console.error('Verify Razorpay error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark pending order as cancelled/failed (e.g. user closed Razorpay)
router.post('/:id/cancel', requireAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user_id !== req.userId && req.userRole !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.payment_status !== 'PENDING') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    }

    await order.update(
      {
        payment_mode: 'UPI',
        payment_status: 'FAILED'
      },
      { transaction }
    );

    await transaction.commit();
    return res.json({ success: true, order });
  } catch (error) {
    await transaction.rollback();
    console.error('Cancel order error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete pending order - disabled to preserve all logs
router.delete('/:id', requireAuth, async (req, res) => {
  return res
    .status(403)
    .json({ error: 'Deleting orders is disabled. All orders are kept for logs.' });
});

// Retry print single bill
router.post('/:orderId/bills/:billId/print', requireAuth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: [{
        model: Unit,
        as: 'unit'
      }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const dayBill = await OrderDayBill.findByPk(req.params.billId, {
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product'
        }]
      }]
    });

    if (!dayBill || dayBill.order_id !== order.id) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    if (order.payment_mode === 'GUEST') {
      return res.status(400).json({ error: 'Cannot print guest orders' });
    }

    const printResults = [];
    let allPrintsSucceeded = true;
    let totalTicketsPrinted = 0;

    try {
      // Print each product the number of times specified by quantity
      for (const item of dayBill.items) {
        const singleProduct = [{
          product: item.product,
          unit_price: item.unit_price,
          quantity: 1,  // Always 1 per ticket
          total_price: item.unit_price  // Price for 1 item
        }];

        // Print 'quantity' times for this product
        for (let i = 0; i < item.quantity; i++) {
          const printResult = await printWithRetry(dayBill, order.unit, order, singleProduct);

          printResults.push({
            billId: dayBill.id,
            productId: item.product_id,
            productName: item.product.name_en,
            ticketNumber: i + 1,
            totalTickets: item.quantity,
            success: printResult.success,
            attempt: printResult.attempt,
            error: printResult.error
          });

          if (printResult.success) {
            totalTicketsPrinted++;
          } else {
            allPrintsSucceeded = false;
          }

          // Add delay between prints
          if (i < item.quantity - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        // Delay between different products
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (allPrintsSucceeded) {
        await dayBill.update({
          is_printed: true,
          printed_at: new Date()
        });

        res.json({
          success: true,
          printResults,
          totalTicketsPrinted
        });
      } else {
        res.status(500).json({
          error: 'Some prints failed',
          printResults,
          totalTicketsPrinted
        });
      }
    } catch (printError) {
      console.error('Print error:', printError);
      res.status(500).json({
        error: 'Print failed: ' + printError.message,
        printResults,
        totalTicketsPrinted
      });
    }
  } catch (error) {
    console.error('Retry print error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;