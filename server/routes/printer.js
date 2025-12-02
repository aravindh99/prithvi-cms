import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { Unit } from '../models/index.js';
import { pingPrinter } from '../services/printer.js';

const router = express.Router();

// Simple printer ping to warm up the connection and measure latency
router.get('/ping', requireAuth, async (req, res) => {
  try {
    const { unit_id } = req.query;

    // Regular users use their assigned unit; admins can specify unit_id
    let targetUnitId = req.userUnitId;
    if (req.userRole === 'admin' && unit_id) {
      targetUnitId = parseInt(unit_id);
    }

    if (!targetUnitId) {
      return res
        .status(400)
        .json({ error: 'Unit not specified or user not assigned to a unit' });
    }

    const unit = await Unit.findByPk(targetUnitId);
    if (!unit || !unit.printer_ip || !unit.printer_port) {
      return res
        .status(400)
        .json({ error: 'Printer configuration not found for this unit' });
    }

    const start = Date.now();
    await pingPrinter(unit);
    const durationMs = Date.now() - start;

    console.log(
      `[Printer Ping] Unit ${unit.id} at ${unit.printer_ip}:${unit.printer_port} responded in ${durationMs}ms`
    );

    return res.json({ success: true, durationMs });
  } catch (error) {
    console.error('[Printer Ping] Error:', error);
    return res
      .status(500)
      .json({ success: false, error: error.message || 'Printer ping failed' });
  }
});

export default router;


