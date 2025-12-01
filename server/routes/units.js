import express from 'express';
import { Unit, Order } from '../models/index.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { printBill } from '../services/printer.js';
import { OrderDayBill, OrderItem, Product } from '../models/index.js';

const router = express.Router();

// Get all units (admin sees all, user sees only active)
router.get('/', requireAuth, async (req, res) => {
  try {
    const where = {};
    
    // Users only see active units
    if (req.userRole !== 'admin') {
      where.is_active = true;
    }

    const units = await Unit.findAll({
      where,
      order: [['name', 'ASC']]
    });

    res.json(units);
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single unit
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id);

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Non-admin users can only see active units
    if (req.userRole !== 'admin' && !unit.is_active) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(unit);
  } catch (error) {
    console.error('Get unit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create unit (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, code, printer_ip, printer_port, is_active } = req.body;

    if (!name || !code || !printer_ip) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const unit = await Unit.create({
      name,
      code,
      printer_ip,
      printer_port: printer_port || 9100,
      is_active: is_active !== undefined ? is_active : true
    });

    res.status(201).json(unit);
  } catch (error) {
    console.error('Create unit error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Unit code already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update unit (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id);

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    const { name, code, printer_ip, printer_port, is_active } = req.body;

    await unit.update({
      name: name || unit.name,
      code: code || unit.code,
      printer_ip: printer_ip || unit.printer_ip,
      printer_port: printer_port !== undefined ? printer_port : unit.printer_port,
      is_active: is_active !== undefined ? is_active : unit.is_active
    });

    res.json(unit);
  } catch (error) {
    console.error('Update unit error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Unit code already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete unit (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id);

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Check if unit has orders
    const orderCount = await Order.count({ where: { unit_id: unit.id } });
    if (orderCount > 0) {
      return res.status(400).json({ error: 'Cannot delete unit with existing orders' });
    }

    await unit.destroy();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test print (admin only)
router.post('/:id/test-print', requireAdmin, async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id);

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Create a dummy order for test print
    const testOrder = {
      id: 'TEST',
      payment_mode: 'CASH'
    };

    const testBill = {
      id: 'TEST',
      bill_date: new Date().toISOString().split('T')[0],
      amount: 0
    };

    const testProducts = [{
      product: {
        name_en: 'Test Item',
        name_ta: 'சோதனை பொருள்'
      },
      unit_price: 0,
      quantity: 1,
      total_price: 0
    }];

    try {
      await printBill(testBill, unit, testOrder, testProducts);
      res.json({ success: true, message: 'Test print successful' });
    } catch (printError) {
      console.error('Test print error:', printError);
      res.status(500).json({ error: 'Print failed: ' + printError.message });
    }
  } catch (error) {
    console.error('Test print route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

