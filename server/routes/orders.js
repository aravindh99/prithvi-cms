import express from 'express';
import { User, Order, OrderDayBill, OrderItem, Product, Unit, sequelize } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { createOrder, verifyPayment } from '../services/razorpay.js';
import { printBill } from '../services/printer.js';

const router = express.Router();

// Create order
router.post('/', requireAuth, async (req, res) => {
  try {
    const { product_ids, selected_dates, payment_mode } = req.body;

    if (!product_ids || !selected_dates || !payment_mode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate payment_mode enum
    const validPaymentModes = ['PENDING', 'UPI', 'CASH', 'FREE', 'GUEST'];
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

    const unit_id = user.unit_id;

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({ error: 'At least one product must be selected' });
    }

    if (!Array.isArray(selected_dates) || selected_dates.length === 0) {
      return res.status(400).json({ error: 'At least one date must be selected' });
    }

    // Get products and calculate per-day total
    const products = await Product.findAll({
      where: {
        id: product_ids,
        unit_id: unit_id,
        is_active: true
      }
    });

    if (products.length !== product_ids.length) {
      return res.status(400).json({ error: 'Some products are invalid or inactive' });
    }

    const perDayTotal = products.reduce((sum, product) => sum + parseFloat(product.price), 0);
    const grandTotal = perDayTotal * selected_dates.length;

    // Get unit for printer config
    const unit = await Unit.findByPk(unit_id);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Create order
    const order = await Order.create({
      user_id: req.userId,
      unit_id: unit_id,
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

    // Print all day bills FIRST (CASH mode - print immediately)
    const printResults = [];
    const orderId = order.id; // Store order ID before transaction operations
    
    for (const dayBill of order.dayBills) {
      try {
        const products = dayBill.items.map(item => ({
          product: item.product,
          unit_price: item.unit_price,
          quantity: item.quantity,
          total_price: item.total_price
        }));

        await printBill(dayBill, order.unit, order, products);
        
        await dayBill.update({
          is_printed: true,
          printed_at: new Date()
        }, { transaction });

        printResults.push({ billId: dayBill.id, success: true });
      } catch (printError) {
        console.error(`Print error for bill ${dayBill.id}:`, printError);
        printResults.push({ billId: dayBill.id, success: false, error: printError.message });
        
        // If ANY print fails, rollback transaction
        await transaction.rollback();
        
        // Delete the order and related records in a new transaction
        const deleteTransaction = await sequelize.transaction();
        try {
          const orderToDelete = await Order.findByPk(orderId, { transaction: deleteTransaction });
          if (orderToDelete) {
            const dayBillsToDelete = await OrderDayBill.findAll({
              where: { order_id: orderId },
              transaction: deleteTransaction
            });

            for (const db of dayBillsToDelete) {
              await OrderItem.destroy({
                where: { order_day_bill_id: db.id },
                transaction: deleteTransaction
              });
            }

            await OrderDayBill.destroy({
              where: { order_id: orderId },
              transaction: deleteTransaction
            });

            await orderToDelete.destroy({ transaction: deleteTransaction });
          }
          await deleteTransaction.commit();
        } catch (deleteError) {
          await deleteTransaction.rollback();
          console.error('Error deleting failed order:', deleteError);
        }

        return res.status(500).json({ 
          error: 'Printing failed. Order has been cancelled. Please try again.',
          printResults
        });
      }
    }

    // Only update DB if ALL prints succeeded
    await order.update({
      payment_mode: 'CASH',
      payment_status: 'PAID'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      order,
      printResults
    });
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

    // Print all day bills FIRST (FREE mode - print immediately)
    const printResults = [];
    const orderId = order.id; // Store order ID before transaction operations
    
    for (const dayBill of order.dayBills) {
      try {
        const products = dayBill.items.map(item => ({
          product: item.product,
          unit_price: item.unit_price,
          quantity: item.quantity,
          total_price: item.total_price
        }));

        await printBill(dayBill, order.unit, order, products);
        
        await dayBill.update({
          is_printed: true,
          printed_at: new Date()
        }, { transaction });

        printResults.push({ billId: dayBill.id, success: true });
      } catch (printError) {
        console.error(`Print error for bill ${dayBill.id}:`, printError);
        printResults.push({ billId: dayBill.id, success: false, error: printError.message });
        
        // If ANY print fails, rollback transaction
        await transaction.rollback();
        
        // Delete the order and related records in a new transaction
        const deleteTransaction = await sequelize.transaction();
        try {
          const orderToDelete = await Order.findByPk(orderId, { transaction: deleteTransaction });
          if (orderToDelete) {
            const dayBillsToDelete = await OrderDayBill.findAll({
              where: { order_id: orderId },
              transaction: deleteTransaction
            });

            for (const db of dayBillsToDelete) {
              await OrderItem.destroy({
                where: { order_day_bill_id: db.id },
                transaction: deleteTransaction
              });
            }

            await OrderDayBill.destroy({
              where: { order_id: orderId },
              transaction: deleteTransaction
            });

            await orderToDelete.destroy({ transaction: deleteTransaction });
          }
          await deleteTransaction.commit();
        } catch (deleteError) {
          await deleteTransaction.rollback();
          console.error('Error deleting failed order:', deleteError);
        }

        return res.status(500).json({ 
          error: 'Printing failed. Order has been cancelled. Please try again.',
          printResults
        });
      }
    }

    // Only update DB if ALL prints succeeded
    await order.update({
      payment_mode: 'FREE',
      payment_status: 'PAID'
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      order,
      printResults
    });
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
      await transaction.rollback();
      // Delete the order on payment verification failure
      const orderId = order.id;
      const deleteTransaction = await sequelize.transaction();
      try {
        const orderToDelete = await Order.findByPk(orderId, { transaction: deleteTransaction });
        if (orderToDelete) {
          const dayBillsToDelete = await OrderDayBill.findAll({
            where: { order_id: orderId },
            transaction: deleteTransaction
          });

          for (const db of dayBillsToDelete) {
            await OrderItem.destroy({
              where: { order_day_bill_id: db.id },
              transaction: deleteTransaction
            });
          }

          await OrderDayBill.destroy({
            where: { order_id: orderId },
            transaction: deleteTransaction
          });

          await orderToDelete.destroy({ transaction: deleteTransaction });
        }
        await deleteTransaction.commit();
      } catch (deleteError) {
        await deleteTransaction.rollback();
        console.error('Error deleting failed order:', deleteError);
      }
      return res.status(400).json({ error: 'Payment verification failed. Order has been cancelled.' });
    }

    // Print all day bills (UPI mode - print only after payment verification)
    // For UPI: If payment succeeded but printing fails, save order anyway (admin can retry print)
    const printResults = [];
    let allPrintsSucceeded = true;
    
    for (const dayBill of order.dayBills) {
      try {
        const products = dayBill.items.map(item => ({
          product: item.product,
          unit_price: item.unit_price,
          quantity: item.quantity,
          total_price: item.total_price
        }));

        await printBill(dayBill, order.unit, order, products);
        
        await dayBill.update({
          is_printed: true,
          printed_at: new Date()
        }, { transaction });

        printResults.push({ billId: dayBill.id, success: true });
      } catch (printError) {
        console.error(`Print error for bill ${dayBill.id}:`, printError);
        printResults.push({ billId: dayBill.id, success: false, error: printError.message });
        allPrintsSucceeded = false;
        // Don't update is_printed - keep it as false so admin can retry later
        // Continue processing other bills
      }
    }

    // Update order to PAID status (payment succeeded)
    // Save even if printing failed - admin can retry printing from logs page
    await order.update({
      payment_mode: 'UPI',
      payment_status: 'PAID'
    }, { transaction });

    await transaction.commit();
    
    // Reload order with all associations to ensure we have the latest data
    await order.reload({
      include: [{
        model: OrderDayBill,
        as: 'dayBills'
      }, {
        model: Unit,
        as: 'unit'
      }]
    });
    
    console.log(`[Razorpay] Order ${order.id} saved: payment=PAID, mode=UPI, prints_succeeded=${allPrintsSucceeded}, bills_count=${order.dayBills?.length || 0}`);

    // If all prints succeeded, return success
    if (allPrintsSucceeded) {
      res.json({
        success: true,
        order,
        printResults
      });
    } else {
      // Payment succeeded but some prints failed - return error but order is saved
      res.status(500).json({ 
        error: 'Payment successful, but printing failed for some bills. Order has been saved. You can retry printing from the admin logs page.',
        order,
        printResults
      });
    }
  } catch (error) {
    await transaction.rollback();
    console.error('Verify Razorpay error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete pending order
router.delete('/:id', requireAuth, async (req, res) => {
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

    // Only allow deletion of PENDING orders
    if (order.payment_status !== 'PENDING') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Can only delete pending orders' });
    }

    // Delete associated records
    const dayBills = await OrderDayBill.findAll({
      where: { order_id: order.id },
      transaction
    });

    for (const dayBill of dayBills) {
      await OrderItem.destroy({
        where: { order_day_bill_id: dayBill.id },
        transaction
      });
    }

    await OrderDayBill.destroy({
      where: { order_id: order.id },
      transaction
    });

    await order.destroy({ transaction });
    await transaction.commit();

    res.json({ success: true });
  } catch (error) {
    await transaction.rollback();
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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

    try {
      const products = dayBill.items.map(item => ({
        product: item.product,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total_price: item.total_price
      }));

      await printBill(dayBill, order.unit, order, products);
      
      await dayBill.update({
        is_printed: true,
        printed_at: new Date()
      });

      res.json({ success: true });
    } catch (printError) {
      console.error('Print error:', printError);
      res.status(500).json({ error: 'Print failed: ' + printError.message });
    }
  } catch (error) {
    console.error('Retry print error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

