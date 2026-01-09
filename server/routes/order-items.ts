import express from 'express';
import { getStorage } from '../storage';

const router = express.Router();

// GET /api/order-items - Get all order items (optionally filter by order)
router.get('/', async (req, res) => {
    try {
        const storage = await getStorage();
        const { orderId } = req.query;

        // IStorage getOrder(id) returns order with items.
        // If we specifically need just items, we might need a getOrderItems method.
        // However, usually we fetch the whole order.
        // For compatibility with the legacy API, let's see if we can find them.

        if (orderId && typeof orderId === 'string') {
            const order = await storage.getOrder(orderId);
            res.json({ success: true, data: order ? order.orderItems : [] });
        } else {
            res.json({ success: true, data: [] });
        }
    } catch (error: any) {
        console.error('Error fetching order items:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/order-items/:id - Get specific order item
// IStorage doesn't have getOrderItem(id). We might need to add it if the frontend uses it.

// POST /api/order-items - Create new order item
router.post('/', async (req, res) => {
    try {
        const storage = await getStorage();
        const { orderId, productId, quantity, price } = req.body;

        if (!orderId || !productId || !quantity || !price) {
            return res.status(400).json({
                success: false,
                message: 'Order ID, product ID, quantity, and price are required'
            });
        }

        const createdItems = await storage.addOrderItems([{
            orderId,
            productId,
            quantity,
            price
        }]);

        res.status(201).json({ success: true, data: createdItems[0] });
    } catch (error: any) {
        console.error('Error creating order item:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
