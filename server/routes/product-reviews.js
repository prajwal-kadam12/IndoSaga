/**
 * Product Reviews API Routes
 * Handles CRUD operations for product_reviews table
 */

import express from 'express';
import db from '../db.js';
import { generateId } from '../models/index.js';

const router = express.Router();

// GET /api/product-reviews - Get all reviews (optionally filter by product)
router.get('/', async (req, res) => {
  try {
    const { productId } = req.query;
    let sql = `
      SELECT pr.*, p.name as product_name 
      FROM product_reviews pr
      LEFT JOIN products p ON pr.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (productId) {
      sql += ' AND pr.product_id = ?';
      params.push(productId);
    }

    sql += ' ORDER BY pr.created_at DESC';
    
    const reviews = await db.query(sql, params);
    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/product-reviews/:id - Get specific review
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT pr.*, p.name as product_name 
      FROM product_reviews pr
      LEFT JOIN products p ON pr.product_id = p.id
      WHERE pr.id = ?
    `;
    const review = await db.query(sql, [id]);
    
    if (review.length === 0) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    res.json({ success: true, data: review[0] });
  } catch (error) {
    console.error('Error fetching product review:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/product-reviews - Create new review
router.post('/', async (req, res) => {
  try {
    const { productId, userId, userName, rating, comment, images } = req.body;
    
    if (!productId || !userName || !rating || !comment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID, user name, rating, and comment are required' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be between 1 and 5' 
      });
    }

    const id = generateId();
    const sql = `
      INSERT INTO product_reviews 
      (id, product_id, user_id, user_name, rating, comment, images, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const imagesJson = images ? JSON.stringify(images) : null;
    await db.query(sql, [id, productId, userId, userName, rating, comment, imagesJson]);
    
    // Fetch the created review
    const createdReview = await db.query(
      'SELECT * FROM product_reviews WHERE id = ?', 
      [id]
    );
    
    res.status(201).json({ success: true, data: createdReview[0] });
  } catch (error) {
    console.error('Error creating product review:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/product-reviews/:id - Update review
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, images, isVerified } = req.body;
    
    let updateFields = [];
    let params = [];
    
    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'Rating must be between 1 and 5' 
        });
      }
      updateFields.push('rating = ?');
      params.push(rating);
    }
    
    if (comment) {
      updateFields.push('comment = ?');
      params.push(comment);
    }
    
    if (images) {
      updateFields.push('images = ?');
      params.push(JSON.stringify(images));
    }
    
    if (isVerified !== undefined) {
      updateFields.push('is_verified = ?');
      params.push(isVerified);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update' 
      });
    }
    
    updateFields.push('updated_at = NOW()');
    params.push(id);
    
    const sql = `UPDATE product_reviews SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await db.query(sql, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Fetch updated review
    const updatedReview = await db.query(
      'SELECT * FROM product_reviews WHERE id = ?', 
      [id]
    );
    
    res.json({ success: true, data: updatedReview[0] });
  } catch (error) {
    console.error('Error updating product review:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/product-reviews/:id - Delete review
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM product_reviews WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting product review:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;