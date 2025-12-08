import express from 'express';
import { Op } from 'sequelize';
import { Order, OrderDayBill, OrderItem, Product, Unit } from '../models/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get aggregated dashboard summary: counts/totals by mode + product summary
router.get('/summary', requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date, unit_id } = req.query;

    const billWhere = {};
    if (start_date && end_date) {
      billWhere.bill_date = { [Op.between]: [start_date, end_date] };
    } else if (start_date) {
      billWhere.bill_date = { [Op.gte]: start_date };
    } else if (end_date) {
      billWhere.bill_date = { [Op.lte]: end_date };
    }

    const orderWhere = {};
    if (unit_id) {
      orderWhere.unit_id = unit_id;
    }

    const bills = await OrderDayBill.findAll({
      where: billWhere,
      include: [
        {
          model: Order,
          as: 'order',
          where: Object.keys(orderWhere).length ? orderWhere : undefined,
          include: [{
            model: Unit,
            as: 'unit',
            attributes: ['id', 'name']
          }]
        },
        {
          model: OrderItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name_en', 'name_ta', 'price']
          }]
        }
      ]
    });

    const modes = {
      CASH: { count: 0, total: 0 },
      UPI: { count: 0, total: 0 },
      FREE: { count: 0, total: 0 },
      GUEST: { count: 0, total: 0 }
    };

    const productMap = new Map(); // key: product_id, value: { name_en, name_ta, totalQty, totalAmount }
    const dailyMap = new Map(); // key: bill_date, value: { count, amount }

    bills.forEach((bill) => {
      const mode = bill.order?.payment_mode;
      const status = bill.order?.payment_status;
      const isPrinted = bill.is_printed;
      const amount = parseFloat(bill.amount || 0);

      // Only count \"valid\" bills:
      // - CASH / FREE / UPI: must be PAID and printed
      // - GUEST: PAID, printing not applicable
      let includeForTotals = false;
      if (mode === 'GUEST') {
        includeForTotals = status === 'PAID';
      } else if (mode === 'CASH' || mode === 'FREE' || mode === 'UPI') {
        includeForTotals =  isPrinted;
      }

      if (modes[mode] && includeForTotals) {
        modes[mode].count += 1;
        modes[mode].total += amount;

        const current = dailyMap.get(bill.bill_date) || { count: 0, amount: 0 };
        current.count += 1;
        current.amount += amount;
        dailyMap.set(bill.bill_date, current);

        // Aggregate products for this bill only when included
        (bill.items || []).forEach((item) => {
          const product = item.product;
          if (!product) return;

          const key = product.id;
          const existing = productMap.get(key) || {
            product_id: product.id,
            name_en: product.name_en,
            name_ta: product.name_ta,
            totalQty: 0,
            totalAmount: 0
          };

          const qty = parseFloat(item.quantity || 0);
          const total = parseFloat(item.total_price || 0);

          existing.totalQty += qty;
          existing.totalAmount += total;

          productMap.set(key, existing);
        });
      }
    });

    const overall = Object.values(modes).reduce(
      (acc, m) => ({
        count: acc.count + m.count,
        total: acc.total + m.total
      }),
      { count: 0, total: 0 }
    );

    const products = Array.from(productMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    const dailySeries = Array.from(dailyMap.entries())
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      modes,
      overall,
      products,
      dailySeries,
      billsCount: overall.count
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


