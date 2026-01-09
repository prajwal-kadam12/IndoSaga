import express from 'express';
import { getStorage } from '../storage';

const router = express.Router();

// GET /api/payments - Get all payments (optionally filter by user or order)
router.get('/', async (req, res) => {
    try {
        const storage = await getStorage();
        const { userId, orderId, status } = req.query;

        const payments = await storage.getPayments({
            userId: typeof userId === 'string' ? userId : undefined,
            orderId: typeof orderId === 'string' ? orderId : undefined,
            status: typeof status === 'string' ? status : undefined
        });

        res.json({ success: true, data: payments });
    } catch (error: any) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/payments/:id - Get specific payment
router.get('/:id', async (req, res) => {
    try {
        const storage = await getStorage();
        const { id } = req.params;

        const payment = await storage.getPayment(id);

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        res.json({ success: true, data: payment });
    } catch (error: any) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/payments - Create new payment record
router.post('/', async (req, res) => {
    try {
        const storage = await getStorage();
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

        const createdPayment = await storage.createPayment({
            orderId,
            userId,
            amount,
            currency: currency || 'INR',
            method: method || null,
            razorpayOrderId: razorpayOrderId || null,
            razorpayPaymentId: razorpayPaymentId || null,
            razorpaySignature: razorpaySignature || null,
            gatewayResponse: gatewayResponse || null,
            status: 'pending'
        });

        res.status(201).json({ success: true, data: createdPayment });
    } catch (error: any) {
        console.error('Error creating payment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/payments/:id - Update payment status
router.put('/:id', async (req, res) => {
    try {
        const storage = await getStorage();
        const { id } = req.params;
        const {
            status, razorpayPaymentId, razorpaySignature, gatewayResponse
        } = req.body;

        const updatedPayment = await storage.updatePayment(id, {
            status,
            razorpayPaymentId,
            razorpaySignature,
            gatewayResponse
        });

        if (!updatedPayment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        res.json({ success: true, data: updatedPayment });
    } catch (error: any) {
        console.error('Error updating payment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/payments/verify - Verify Razorpay payment signature
router.post('/verify', async (req, res) => {
    try {
        const storage = await getStorage();
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({
                success: false,
                message: 'Razorpay order ID, payment ID, and signature are required'
            });
        }

        // Update the payment record
        const existingPayment = await storage.getPaymentByRazorpayOrderId(razorpayOrderId);
        if (!existingPayment) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }

        await storage.updatePayment(existingPayment.id, {
            status: 'completed',
            razorpayPaymentId,
            razorpaySignature
        });

        // Also update the related order
        await storage.updateOrderStatus(existingPayment.orderId, 'completed');

        res.json({
            success: true,
            message: 'Payment verified successfully'
        });
    } catch (error: any) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
