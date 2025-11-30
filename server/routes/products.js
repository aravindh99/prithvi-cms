import express from 'express';
import { Product, Unit } from '../models/index.js';
import { requireAdmin } from '../middleware/auth.js';
import { upload, deleteImage } from '../middleware/upload.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get all products (filtered by unit_id if provided)
router.get('/', async (req, res) => {
  try {
    const { unit_id, is_active } = req.query;
    const where = {};

    if (unit_id) {
      where.unit_id = unit_id;
    }

    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    const products = await Product.findAll({
      where,
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['id', 'name', 'code']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['id', 'name', 'code']
      }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create product (admin only)
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name_en, name_ta, price, unit_id, is_active } = req.body;

    if (!name_en || !name_ta || !price || !unit_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;

    const product = await Product.create({
      name_en,
      name_ta,
      price: parseFloat(price),
      unit_id: parseInt(unit_id),
      is_active: is_active === 'true' || is_active === true,
      image_path: imagePath
    });

    const productWithUnit = await Product.findByPk(product.id, {
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['id', 'name', 'code']
      }]
    });

    res.status(201).json(productWithUnit);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product (admin only)
router.put('/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name_en, name_ta, price, unit_id, is_active } = req.body;

    // Delete old image if new one is uploaded
    if (req.file && product.image_path) {
      deleteImage(product.image_path);
    }

    const imagePath = req.file ? `/uploads/products/${req.file.filename}` : product.image_path;

    await product.update({
      name_en: name_en || product.name_en,
      name_ta: name_ta || product.name_ta,
      price: price ? parseFloat(price) : product.price,
      unit_id: unit_id ? parseInt(unit_id) : product.unit_id,
      is_active: is_active !== undefined ? (is_active === 'true' || is_active === true) : product.is_active,
      image_path: imagePath
    });

    const updatedProduct = await Product.findByPk(product.id, {
      include: [{
        model: Unit,
        as: 'unit',
        attributes: ['id', 'name', 'code']
      }]
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete image file
    if (product.image_path) {
      deleteImage(product.image_path);
    }

    await product.destroy();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

