import express from 'express';
import { User, Unit } from '../models/index.js';

const router = express.Router();

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

    // No session storage - trust localStorage only
    res.json({
      success: true,
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
  // No session to destroy - just return success
  // Frontend will clear localStorage
  res.json({ success: true });
});

router.get('/me', async (req, res) => {
  // Trust user info from headers (from localStorage)
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await User.findByPk(parseInt(userId), {
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

