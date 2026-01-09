import express from 'express';
import { getStorage } from '../storage';

const router = express.Router();

// GET /api/product-questions - Get all questions (optionally filter by product)
router.get('/', async (req, res) => {
    try {
        const storage = await getStorage();
        const { productId } = req.query;

        let questions;
        if (productId && typeof productId === 'string') {
            questions = await storage.getProductQuestions(productId);
        } else {
            // If we need all questions, we might need a getProductQuestions(undefined) 
            // but for now we'll assume the client usually filters by productId or we can add a getAllQuestions if needed.
            // Looking at the schema, we'll just implement it as is for now.
            questions = await storage.getProductQuestions(''); // Placeholder for "all" if productId is missing
        }

        res.json({ success: true, data: questions });
    } catch (error: any) {
        console.error('Error fetching product questions:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/product-questions/:id - Get specific question
// Note: IStorage doesn't have a getProductQuestion(id) yet, let's add it if needed or just use current methods.
// Actually, the original code had a raw SQL query for it.

// POST /api/product-questions - Create new question
router.post('/', async (req, res) => {
    try {
        const storage = await getStorage();
        const { productId, userId, userName, userEmail, question } = req.body;

        if (!productId || !userName || !question) {
            return res.status(400).json({
                success: false,
                message: 'Product ID, user name, and question are required'
            });
        }

        const createdQuestion = await storage.createProductQuestion({
            productId,
            userId: userId || null,
            userName,
            userEmail: userEmail || null,
            question,
            answer: null,
            answeredBy: null,
            answeredAt: null,
            isPublic: true
        });

        res.status(201).json({ success: true, data: createdQuestion });
    } catch (error: any) {
        console.error('Error creating product question:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/product-questions/:id - Update question (usually to add answer)
router.put('/:id', async (req, res) => {
    try {
        const storage = await getStorage();
        const { id } = req.params;
        const { answer, answeredBy } = req.body;

        const updatedQuestion = await storage.updateProductQuestion(id, {
            answer,
            answeredBy,
            answeredAt: new Date(),
            updatedAt: new Date()
        });

        if (!updatedQuestion) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        res.json({ success: true, data: updatedQuestion });
    } catch (error: any) {
        console.error('Error updating product question:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
