import express from 'express';
import { User, Unit } from '../models/index.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'role', 'unit_id', 'createdAt'],
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['id', 'name', 'code'],
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user (admin only)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'role', 'unit_id', 'createdAt'],
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['id', 'name', 'code'],
        required: false
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { username, password, role, unit_id } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (role && !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or user' });
    }

    const finalRole = role || 'user';

    // Validation: user role must have unit_id
    if (finalRole === 'user' && !unit_id) {
      return res.status(400).json({ error: 'Unit assignment is required for user role' });
    }

    // Verify unit exists if provided
    if (unit_id) {
      const unit = await Unit.findByPk(unit_id);
      if (!unit) {
        return res.status(400).json({ error: 'Invalid unit selected' });
      }
    }

    const user = await User.create({
      username,
      password_hash: password, // Will be hashed by hook
      role: finalRole,
      unit_id: finalRole === 'admin' ? null : unit_id
    });

    const userWithUnit = await User.findByPk(user.id, {
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['id', 'name', 'code']
      }]
    });

    res.status(201).json({
      id: userWithUnit.id,
      username: userWithUnit.username,
      role: userWithUnit.role,
      unit_id: userWithUnit.unit_id,
      unit: userWithUnit.unit,
      createdAt: userWithUnit.createdAt
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { username, password, role, unit_id } = req.body;

    const updateData = {};
    if (username) updateData.username = username;
    if (password) updateData.password_hash = password; // Will be hashed by hook
    
    if (role && ['admin', 'user'].includes(role)) {
      updateData.role = role;
      // If changing to user role, require unit_id
      if (role === 'user' && !unit_id && !user.unit_id) {
        return res.status(400).json({ error: 'Unit assignment is required for user role' });
      }
      // If changing to admin, remove unit_id
      if (role === 'admin') {
        updateData.unit_id = null;
      }
    }

    // Handle unit_id update
    if (unit_id !== undefined) {
      if (user.role === 'user' && !unit_id) {
        return res.status(400).json({ error: 'Unit assignment is required for user role' });
      }
      if (unit_id) {
        const unit = await Unit.findByPk(unit_id);
        if (!unit) {
          return res.status(400).json({ error: 'Invalid unit selected' });
        }
        updateData.unit_id = unit_id;
      } else if (user.role === 'admin') {
        updateData.unit_id = null;
      }
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(user.id, {
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['id', 'name', 'code']
      }]
    });

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      unit_id: updatedUser.unit_id,
      unit: updatedUser.unit,
      createdAt: updatedUser.createdAt
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (user.id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await user.destroy();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

