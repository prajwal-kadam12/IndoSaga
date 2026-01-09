import express from 'express';
import { getStorage } from '../storage';

const router = express.Router();

// GET /api/orders - Get all orders (optionally filter by user)
router.get('/', async (req, res) => {
    try {
        const storage = await getStorage();
        const { userId, status } = req.query;

        // Note: getOrders in IStorage takes a userId.
        let orders: any[] = [];
        if (userId && typeof userId === 'string') {
            orders = await storage.getOrders(userId);
        } else {
            // For admin or global view, we might need a getAllOrders method in IStorage.
            // For now we'll return empty or add a method.
            orders = [];
        }

        // Filter by status if provided
        if (status && typeof status === 'string') {
            orders = orders.filter(o => o.status === status);
        }

        res.json({ success: true, data: orders });
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/orders/:id - Get specific order with items
router.get('/:id', async (req, res) => {
    try {
        const storage = await getStorage();
        const { id } = req.params;

        const order = await storage.getOrder(id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, data: order });
    } catch (error: any) {
        console.error('Error fetching order:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
    try {
        const storage = await getStorage();
        const {
            userId, total, customerName, customerPhone, customerEmail,
            shippingAddress, pincode, paymentMethod, items
        } = req.body;

        if (!userId || !total || !customerName || !customerPhone || !shippingAddress || !pincode || !items) {
            return res.status(400).json({
                success: false,
                message: 'Required fields missing'
            });
        }

        // Create order
        const order = await storage.createOrder({
            userId,
            total,
            customerName,
            customerPhone,
            customerEmail: customerEmail || null,
            shippingAddress,
            pincode,
            paymentMethod: paymentMethod || null,
            status: "pending",
            paymentStatus: "pending"
        });

        // Create order items
        const orderItems = items.map((item: any) => ({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
        }));

        await storage.addOrderItems(orderItems);

        // Fetch final order with items
        const finalOrder = await storage.getOrder(order.id);

        res.status(201).json({ success: true, data: finalOrder });
    } catch (error: any) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/orders/:id - Update order
router.put('/:id', async (req, res) => {
    try {
        const storage = await getStorage();
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        const updatedOrder = await storage.updateOrderStatus(id, status);

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({ success: true, data: updatedOrder });
    } catch (error: any) {
        console.error('Error updating order:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
