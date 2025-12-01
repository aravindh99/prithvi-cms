import express from 'express';
import jwt from 'jsonwebtoken';
import { User, Unit } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({
      where: { username },
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['id', 'name', 'code', 'printer_ip', 'printer_port']
      }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, unit_id: user.unit_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        unit_id: user.unit_id,
        unit: user.unit
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  // Stateless JWT - frontend just discards token
  res.json({ success: true });
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['id', 'name', 'code', 'printer_ip', 'printer_port']
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        unit_id: user.unit_id,
        unit: user.unit
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

