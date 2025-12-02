import express from 'express';
import { OrderDayBill, Order, Unit, OrderItem, Product, sequelize } from '../models/index.js';
import { requireAdmin } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get all logs with filters - one row per order item (per product per day)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date, unit_id, payment_mode, page = 1, limit = 50 } = req.query;

    const where = {};
    const orderWhere = {};

    if (start_date && end_date) {
      where.bill_date = {
        [Op.between]: [start_date, end_date]
      };
    } else if (start_date) {
      where.bill_date = {
        [Op.gte]: start_date
      };
    } else if (end_date) {
      where.bill_date = {
        [Op.lte]: end_date
      };
    }

    if (unit_id && unit_id.trim() !== '') {
      orderWhere.unit_id = parseInt(unit_id);
    }

    if (payment_mode && payment_mode.trim() !== '') {
      // Validate payment_mode enum - only the 4 real modes
      const validPaymentModes = ['UPI', 'CASH', 'FREE', 'GUEST'];
      if (!validPaymentModes.includes(payment_mode)) {
        return res.status(400).json({ error: `Invalid payment_mode filter. Must be one of: ${validPaymentModes.join(', ')}` });
      }
      orderWhere.payment_mode = payment_mode;
    }
    
    console.log('[Logs API] Filters:', { start_date, end_date, unit_id, payment_mode, page, limit });
    console.log('[Logs API] Query where:', where);
    console.log('[Logs API] Order where:', orderWhere);

    const pageNum = Math.max(1, parseInt(page) || 1); // Ensure page is at least 1
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50)); // Limit between 1-100, default 50
    const offset = (pageNum - 1) * limitNum;

    // First find matching bills with their orders and units
    const { count, rows: bills } = await OrderDayBill.findAndCountAll({
      where,
      include: [{
        model: Order,
        as: 'order',
        where: Object.keys(orderWhere).length > 0 ? orderWhere : undefined,
        required: true, // Always require order to exist (exclude orphaned bills)
        include: [{
          model: Unit,
          as: 'unit',
          attributes: ['id', 'name', 'code']
        }],
        // include unit_id so the generated subquery can join to units without SQL error
        attributes: ['id', 'unit_id', 'payment_mode', 'payment_status', 'total_amount']
      }, {
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name_en', 'name_ta', 'price']
        }]
      }],
      order: [['bill_date', 'DESC'], ['createdAt', 'DESC']],
      limit: limitNum,
      offset: offset
    });

    // Flatten to one log entry per item
    const logs = [];
    for (const bill of bills) {
      if (!bill.items || bill.items.length === 0) {
        // Still include a row for bills without items
        logs.push({
          id: bill.id,
          bill_date: bill.bill_date,
          amount: bill.amount,
          is_printed: bill.is_printed,
          printed_at: bill.printed_at,
          order_id: bill.order?.id,
          payment_mode: bill.order?.payment_mode,
          payment_status: bill.order?.payment_status,
          unit: bill.order?.unit,
          item_id: null,
          product_id: null,
          product_name_en: null,
          product_name_ta: null,
          quantity: null,
          line_total: null
        });
        continue;
      }

      for (const item of bill.items) {
        logs.push({
          id: bill.id,
          bill_date: bill.bill_date,
          amount: bill.amount,
          is_printed: bill.is_printed,
          printed_at: bill.printed_at,
          order_id: bill.order?.id,
          payment_mode: bill.order?.payment_mode,
          payment_status: bill.order?.payment_status,
          unit: bill.order?.unit,
          item_id: item.id,
          product_id: item.product_id,
          product_name_en: item.product?.name_en || null,
          product_name_ta: item.product?.name_ta || null,
          quantity: item.quantity,
          line_total: item.total_price
        });
      }
    }

    console.log('[Logs API] Results:', {
      count,
      billsCount: bills.length,
      itemRows: logs.length,
      page: pageNum,
      totalPages: Math.ceil(count / limitNum)
    });
    
    res.json({
      logs,
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum)
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single bill details
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const bill = await OrderDayBill.findByPk(req.params.id, {
      include: [{
        model: Order,
        as: 'order',
        include: [{
          model: Unit,
          as: 'unit',
          attributes: ['id', 'name', 'code']
        }],
        attributes: ['id', 'payment_mode', 'payment_status', 'total_amount', 'createdAt']
      }, {
        model: OrderItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name_en', 'name_ta', 'price']
        }]
      }]
    });

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.json(bill);
  } catch (error) {
    console.error('Get bill details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete all bills (admin only) - respects current filters
router.delete('/all', requireAdmin, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { start_date, end_date, unit_id, payment_mode } = req.query;

    const where = {};
    const orderWhere = {};

    if (start_date && end_date) {
      where.bill_date = {
        [Op.between]: [start_date, end_date]
      };
    } else if (start_date) {
      where.bill_date = {
        [Op.gte]: start_date
      };
    } else if (end_date) {
      where.bill_date = {
        [Op.lte]: end_date
      };
    }

    if (unit_id) {
      orderWhere.unit_id = unit_id;
    }

    if (payment_mode) {
      const validPaymentModes = ['UPI', 'CASH', 'FREE', 'GUEST'];
      if (!validPaymentModes.includes(payment_mode)) {
        await transaction.rollback();
        return res.status(400).json({ error: `Invalid payment_mode filter. Must be one of: ${validPaymentModes.join(', ')}` });
      }
      orderWhere.payment_mode = payment_mode;
    }

    // Get all bills matching filters
    const billsToDelete = await OrderDayBill.findAll({
      where,
      include: [{
        model: Order,
        as: 'order',
        where: orderWhere,
        attributes: ['id']
      }],
      transaction
    });

    const billIds = billsToDelete.map(bill => bill.id);
    const orderIds = [...new Set(billsToDelete.map(bill => bill.order_id))];

    if (billIds.length === 0) {
      await transaction.rollback();
      return res.json({ success: true, message: 'No bills found to delete', deletedCount: 0 });
    }

    // Delete all order items for these bills
    await OrderItem.destroy({
      where: { order_day_bill_id: { [Op.in]: billIds } },
      transaction
    });

    // Delete all bills
    await OrderDayBill.destroy({
      where: { id: { [Op.in]: billIds } },
      transaction
    });

    // Check which orders have no remaining bills and delete them
    for (const orderId of orderIds) {
      const remainingBills = await OrderDayBill.count({
        where: { order_id: orderId },
        transaction
      });

      if (remainingBills === 0) {
        await Order.destroy({
          where: { id: orderId },
          transaction
        });
      }
    }

    await transaction.commit();

    res.json({ 
      success: true, 
      message: `Successfully deleted ${billIds.length} bill(s)`,
      deletedCount: billIds.length
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Delete all bills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete bill (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const bill = await OrderDayBill.findByPk(req.params.id, { transaction });

    if (!bill) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Delete all order items for this bill
    await OrderItem.destroy({
      where: { order_day_bill_id: bill.id },
      transaction
    });

    // Delete the bill
    await bill.destroy({ transaction });

    // Check if order has any remaining bills
    const remainingBills = await OrderDayBill.count({
      where: { order_id: bill.order_id },
      transaction
    });

    // If no bills remain, delete the order as well
    if (remainingBills === 0) {
      await Order.destroy({
        where: { id: bill.order_id },
        transaction
      });
    }

    await transaction.commit();

    res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Delete bill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

