import express from 'express';
import { getStorage } from '../storage';

const router = express.Router();

// GET /api/product-reviews - Get all reviews (optionally filter by product)
router.get('/', async (req, res) => {
    try {
        const storage = await getStorage();
        const { productId } = req.query;

        if (productId && typeof productId === 'string') {
            const reviews = await storage.getProductReviews(productId);
            res.json({ success: true, data: reviews });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (error: any) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/product-reviews - Create new review
router.post('/', async (req, res) => {
    try {
        const storage = await getStorage();
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

        const createdReview = await storage.createProductReview({
            productId,
            userId: userId || null,
            userName,
            rating,
            comment,
            images: images || null,
            isVerified: false
        });

        res.status(201).json({ success: true, data: createdReview });
    } catch (error: any) {
        console.error('Error creating product review:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
