/**
 * Orders API Routes
 * Handles CRUD operations for orders table
 */

import express from 'express';
import db from '../db.js';
import { generateId } from '../models/index.js';

const router = express.Router();

// GET /api/orders - Get all orders (optionally filter by user)
router.get('/', async (req, res) => {
  try {
    const { userId, status } = req.query;
    let sql = `
      SELECT o.*, 
        COUNT(oi.id) as item_count,
        GROUP_CONCAT(CONCAT(p.name, ' (', oi.quantity, ')') SEPARATOR ', ') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      sql += ' AND o.user_id = ?';
      params.push(userId);
    }
    
    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' GROUP BY o.id ORDER BY o.created_at DESC';
    
    const orders = await db.query(sql, params);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:id - Get specific order with items
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get order details
    const orderSql = 'SELECT * FROM orders WHERE id = ?';
    const orders = await db.query(orderSql, [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Get order items
    const itemsSql = `
      SELECT oi.*, p.name, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;
    const items = await db.query(itemsSql, [id]);
    
    const order = {
      ...orders[0],
      items: items
    };
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
  try {
    const {
      userId, total, customerName, customerPhone, customerEmail, 
      shippingAddress, pincode, paymentMethod, items
    } = req.body;
    
    if (!userId || !total || !customerName || !customerPhone || !shippingAddress || !pincode || !items) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields: userId, total, customerName, customerPhone, shippingAddress, pincode, items' 
      });
    }

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Create order
      const orderId = generateId();
      const orderSql = `
        INSERT INTO orders 
        (id, user_id, total, customer_name, customer_phone, customer_email, 
         shipping_address, pincode, payment_method, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      await connection.execute(orderSql, [
        orderId, userId, total, customerName, customerPhone, customerEmail, 
        shippingAddress, pincode, paymentMethod
      ]);
      
      // Create order items
      for (const item of items) {
        const itemId = generateId();
        const itemSql = `
          INSERT INTO order_items 
          (id, order_id, product_id, quantity, price, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
        `;
        await connection.execute(itemSql, [itemId, orderId, item.productId, item.quantity, item.price]);
      }
      
      await connection.commit();
      
      // Fetch the created order with items
      const createdOrder = await db.query(`
        SELECT o.*, 
          GROUP_CONCAT(CONCAT(p.name, ' (', oi.quantity, ')') SEPARATOR ', ') as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.id = ?
        GROUP BY o.id
      `, [orderId]);
      
      res.status(201).json({ success: true, data: createdOrder[0] });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id - Update order
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status, paymentId, paymentStatus, paymentMethod, 
      razorpayOrderId, razorpayPaymentId, razorpaySignature, trackingId
    } = req.body;
    
    let updateFields = [];
    let params = [];
    
    if (status) {
      updateFields.push('status = ?');
      params.push(status);
    }
    
    if (paymentId) {
      updateFields.push('payment_id = ?');
      params.push(paymentId);
    }
    
    if (paymentStatus) {
      updateFields.push('payment_status = ?');
      params.push(paymentStatus);
    }
    
    if (paymentMethod) {
      updateFields.push('payment_method = ?');
      params.push(paymentMethod);
    }
    
    if (razorpayOrderId) {
      updateFields.push('razorpay_order_id = ?');
      params.push(razorpayOrderId);
    }
    
    if (razorpayPaymentId) {
      updateFields.push('razorpay_payment_id = ?');
      params.push(razorpayPaymentId);
    }
    
    if (razorpaySignature) {
      updateFields.push('razorpay_signature = ?');
      params.push(razorpaySignature);
    }
    
    if (trackingId) {
      updateFields.push('tracking_id = ?');
      params.push(trackingId);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update' 
      });
    }
    
    updateFields.push('updated_at = NOW()');
    params.push(id);
    
    const sql = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await db.query(sql, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Fetch updated order
    const updatedOrder = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    
    res.json({ success: true, data: updatedOrder[0] });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/orders/:id - Delete order (also deletes related order_items)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Delete order items first (foreign key constraint)
      await connection.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
      
      // Delete order
      const result = await connection.execute('DELETE FROM orders WHERE id = ?', [id]);
      
      if (result[0].affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      
      await connection.commit();
      res.json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;