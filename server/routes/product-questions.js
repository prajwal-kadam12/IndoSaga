/**
 * Product Questions API Routes
 * Handles CRUD operations for product_questions table
 */

import express from 'express';
import db from '../db.js';
import { generateId } from '../models/index.js';

const router = express.Router();

// GET /api/product-questions - Get all questions (optionally filter by product)
router.get('/', async (req, res) => {
  try {
    const { productId } = req.query;
    let sql = `
      SELECT pq.*, p.name as product_name 
      FROM product_questions pq
      LEFT JOIN products p ON pq.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (productId) {
      sql += ' AND pq.product_id = ?';
      params.push(productId);
    }

    sql += ' ORDER BY pq.created_at DESC';
    
    const questions = await db.query(sql, params);
    res.json({ success: true, data: questions });
  } catch (error) {
    console.error('Error fetching product questions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/product-questions/:id - Get specific question
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT pq.*, p.name as product_name 
      FROM product_questions pq
      LEFT JOIN products p ON pq.product_id = p.id
      WHERE pq.id = ?
    `;
    const question = await db.query(sql, [id]);
    
    if (question.length === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    
    res.json({ success: true, data: question[0] });
  } catch (error) {
    console.error('Error fetching product question:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/product-questions - Create new question
router.post('/', async (req, res) => {
  try {
    const { productId, userId, userName, userEmail, question } = req.body;
    
    if (!productId || !userName || !question) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID, user name, and question are required' 
      });
    }

    const id = generateId();
    const sql = `
      INSERT INTO product_questions 
      (id, product_id, user_id, user_name, user_email, question, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    await db.query(sql, [id, productId, userId, userName, userEmail, question]);
    
    // Fetch the created question
    const createdQuestion = await db.query(
      'SELECT * FROM product_questions WHERE id = ?', 
      [id]
    );
    
    res.status(201).json({ success: true, data: createdQuestion[0] });
  } catch (error) {
    console.error('Error creating product question:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/product-questions/:id - Update question (usually to add answer)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { answer, answeredBy } = req.body;
    
    const sql = `
      UPDATE product_questions 
      SET answer = ?, answered_by = ?, answered_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `;
    
    const result = await db.query(sql, [answer, answeredBy, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    
    // Fetch updated question
    const updatedQuestion = await db.query(
      'SELECT * FROM product_questions WHERE id = ?', 
      [id]
    );
    
    res.json({ success: true, data: updatedQuestion[0] });
  } catch (error) {
    console.error('Error updating product question:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/product-questions/:id - Delete question
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM product_questions WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting product question:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;