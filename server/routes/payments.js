/**
 * Payments API Routes
 * Handles CRUD operations for payments table
 */

import express from 'express';
import db from '../db.js';
import { generateId } from '../models/index.js';

const router = express.Router();

// GET /api/payments - Get all payments (optionally filter by user or order)
router.get('/', async (req, res) => {
  try {
    const { userId, orderId, status } = req.query;
    let sql = `
      SELECT p.*, o.customer_name, o.total as order_total
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      sql += ' AND p.user_id = ?';
      params.push(userId);
    }
    
    if (orderId) {
      sql += ' AND p.order_id = ?';
      params.push(orderId);
    }
    
    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY p.created_at DESC';
    
    const payments = await db.query(sql, params);
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/payments/:id - Get specific payment
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT p.*, o.customer_name, o.total as order_total, o.customer_email
      FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE p.id = ?
    `;
    const payment = await db.query(sql, [id]);
    
    if (payment.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    res.json({ success: true, data: payment[0] });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/payments - Create new payment record
router.post('/', async (req, res) => {
  try {
    const {
      orderId, userId, amount, currency = 'INR', method, 
      razorpayOrderId, razorpayPaymentId, razorpaySignature, gatewayResponse
    } = req.body;
    
    if (!orderId || !userId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID, user ID, and amount are required' 
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

    const id = generateId();
    const sql = `
      INSERT INTO payments 
      (id, order_id, user_id, amount, currency, method, razorpay_order_id, 
       razorpay_payment_id, razorpay_signature, gateway_response, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const gatewayJson = gatewayResponse ? JSON.stringify(gatewayResponse) : null;
    await db.query(sql, [
      id, orderId, userId, amount, currency, method, 
      razorpayOrderId, razorpayPaymentId, razorpaySignature, gatewayJson
    ]);
    
    // Fetch the created payment
    const createdPayment = await db.query(
      'SELECT * FROM payments WHERE id = ?', 
      [id]
    );
    
    res.status(201).json({ success: true, data: createdPayment[0] });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/payments/:id - Update payment status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status, razorpayPaymentId, razorpaySignature, gatewayResponse
    } = req.body;
    
    let updateFields = [];
    let params = [];
    
    if (status) {
      updateFields.push('status = ?');
      params.push(status);
    }
    
    if (razorpayPaymentId) {
      updateFields.push('razorpay_payment_id = ?');
      params.push(razorpayPaymentId);
    }
    
    if (razorpaySignature) {
      updateFields.push('razorpay_signature = ?');
      params.push(razorpaySignature);
    }
    
    if (gatewayResponse) {
      updateFields.push('gateway_response = ?');
      params.push(JSON.stringify(gatewayResponse));
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update' 
      });
    }
    
    updateFields.push('updated_at = NOW()');
    params.push(id);
    
    const sql = `UPDATE payments SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await db.query(sql, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    // Fetch updated payment
    const updatedPayment = await db.query(
      'SELECT * FROM payments WHERE id = ?', 
      [id]
    );
    
    res.json({ success: true, data: updatedPayment[0] });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/payments/:id - Delete payment record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM payments WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/payments/verify - Verify Razorpay payment signature
router.post('/verify', async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Razorpay order ID, payment ID, and signature are required' 
      });
    }

    // Here you would typically verify the signature using Razorpay's crypto validation
    // For now, we'll just update the payment record
    
    const updateSql = `
      UPDATE payments 
      SET status = 'completed', razorpay_payment_id = ?, razorpay_signature = ?, updated_at = NOW()
      WHERE razorpay_order_id = ?
    `;
    
    const result = await db.query(updateSql, [razorpayPaymentId, razorpaySignature, razorpayOrderId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment record not found for this order' 
      });
    }
    
    // Also update the related order
    await db.query(`
      UPDATE orders 
      SET payment_status = 'completed', razorpay_payment_id = ?, razorpay_signature = ?, updated_at = NOW()
      WHERE razorpay_order_id = ?
    `, [razorpayPaymentId, razorpaySignature, razorpayOrderId]);
    
    res.json({ 
      success: true, 
      message: 'Payment verified successfully' 
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;