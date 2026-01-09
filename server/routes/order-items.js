/**
 * Order Items API Routes
 * Handles CRUD operations for order_items table
 */

import express from 'express';
import db from '../db.js';
import { generateId } from '../models/index.js';

const router = express.Router();

// GET /api/order-items - Get all order items (optionally filter by order)
router.get('/', async (req, res) => {
  try {
    const { orderId } = req.query;
    let sql = `
      SELECT oi.*, p.name as product_name, p.image_url, o.status as order_status
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (orderId) {
      sql += ' AND oi.order_id = ?';
      params.push(orderId);
    }

    sql += ' ORDER BY oi.created_at DESC';
    
    const items = await db.query(sql, params);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching order items:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/order-items/:id - Get specific order item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT oi.*, p.name as product_name, p.image_url, o.status as order_status
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE oi.id = ?
    `;
    const item = await db.query(sql, [id]);
    
    if (item.length === 0) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }
    
    res.json({ success: true, data: item[0] });
  } catch (error) {
    console.error('Error fetching order item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/order-items - Create new order item
router.post('/', async (req, res) => {
  try {
    const { orderId, productId, quantity, price } = req.body;
    
    if (!orderId || !productId || !quantity || !price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID, product ID, quantity, and price are required' 
      });
    }

    // Verify order exists
    const orderExists = await db.query('SELECT id FROM orders WHERE id = ?', [orderId]);
    if (orderExists.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    // Verify product exists
    const productExists = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (productExists.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    const id = generateId();
    const sql = `
      INSERT INTO order_items 
      (id, order_id, product_id, quantity, price, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    await db.query(sql, [id, orderId, productId, quantity, price]);
    
    // Fetch the created order item
    const createdItem = await db.query(`
      SELECT oi.*, p.name as product_name, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.id = ?
    `, [id]);
    
    res.status(201).json({ success: true, data: createdItem[0] });
  } catch (error) {
    console.error('Error creating order item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/order-items/:id - Update order item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, price } = req.body;
    
    let updateFields = [];
    let params = [];
    
    if (quantity) {
      updateFields.push('quantity = ?');
      params.push(quantity);
    }
    
    if (price) {
      updateFields.push('price = ?');
      params.push(price);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update' 
      });
    }
    
    params.push(id);
    
    const sql = `UPDATE order_items SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await db.query(sql, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }
    
    // Fetch updated order item
    const updatedItem = await db.query(`
      SELECT oi.*, p.name as product_name, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.id = ?
    `, [id]);
    
    res.json({ success: true, data: updatedItem[0] });
  } catch (error) {
    console.error('Error updating order item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/order-items/:id - Delete order item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM order_items WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order item not found' });
    }
    
    res.json({ success: true, message: 'Order item deleted successfully' });
  } catch (error) {
    console.error('Error deleting order item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;