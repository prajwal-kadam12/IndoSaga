# MySQL Integration for IndoSaga - Complete Setup Guide

## 🎉 Integration Complete!

Your MySQL database has been successfully connected to the IndoSaga application. All 5 tables are now operational with full CRUD API endpoints.

## 📋 What Was Implemented

### 1. Database Connection (`server/db.js`)
- **Secure MySQL connection** using your provided credentials
- **Connection pooling** for better performance (10 connections max)
- **Automatic reconnection** and error handling
- **Environment variables** for secure credential storage

### 2. Database Models (`server/models/index.js`)
Defined schemas for all 5 tables:
- `product_questions` - Customer questions about products
- `product_reviews` - Product reviews with ratings and images
- `orders` - Order records with payment info
- `order_items` - Individual items within orders
- `payments` - Payment transaction records

### 3. REST API Endpoints

All endpoints support standard HTTP methods: GET, POST, PUT, DELETE

#### Product Questions (`/api/product-questions`)
- `GET /api/product-questions` - Get all questions (filter by productId)
- `GET /api/product-questions/:id` - Get specific question
- `POST /api/product-questions` - Create new question
- `PUT /api/product-questions/:id` - Update question (add answer)
- `DELETE /api/product-questions/:id` - Delete question

#### Product Reviews (`/api/product-reviews`)
- `GET /api/product-reviews` - Get all reviews (filter by productId)
- `GET /api/product-reviews/:id` - Get specific review
- `POST /api/product-reviews` - Create new review
- `PUT /api/product-reviews/:id` - Update review
- `DELETE /api/product-reviews/:id` - Delete review

#### Orders (`/api/orders`)
- `GET /api/orders` - Get all orders (filter by userId, status)
- `GET /api/orders/:id` - Get specific order with items
- `POST /api/orders` - Create new order with items
- `PUT /api/orders/:id` - Update order (status, payment info)
- `DELETE /api/orders/:id` - Delete order and items

#### Order Items (`/api/order-items`)
- `GET /api/order-items` - Get all items (filter by orderId)
- `GET /api/order-items/:id` - Get specific item
- `POST /api/order-items` - Create new item
- `PUT /api/order-items/:id` - Update item
- `DELETE /api/order-items/:id` - Delete item

#### Payments (`/api/payments`)
- `GET /api/payments` - Get all payments (filter by userId, orderId, status)
- `GET /api/payments/:id` - Get specific payment
- `POST /api/payments` - Create new payment record
- `PUT /api/payments/:id` - Update payment status
- `DELETE /api/payments/:id` - Delete payment
- `POST /api/payments/verify` - Verify Razorpay payment signature

## 🚀 How to Use

### Frontend Integration Example

```javascript
// Add a product review
const addReview = async (productId, reviewData) => {
  const response = await fetch('/api/product-reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId,
      userId: currentUser?.id,
      userName: reviewData.userName,
      rating: reviewData.rating,
      comment: reviewData.comment,
      images: reviewData.images || []
    })
  });
  return response.json();
};

// Ask a product question
const askQuestion = async (productId, question) => {
  const response = await fetch('/api/product-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId,
      userId: currentUser?.id,
      userName: currentUser?.name,
      userEmail: currentUser?.email,
      question
    })
  });
  return response.json();
};

// Create an order
const createOrder = async (orderData) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUser.id,
      total: orderData.total,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail,
      shippingAddress: orderData.shippingAddress,
      pincode: orderData.pincode,
      paymentMethod: orderData.paymentMethod,
      items: orderData.items
    })
  });
  return response.json();
};

// Record a payment
const recordPayment = async (paymentData) => {
  const response = await fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: paymentData.orderId,
      userId: paymentData.userId,
      amount: paymentData.amount,
      method: paymentData.method,
      razorpayOrderId: paymentData.razorpayOrderId,
      razorpayPaymentId: paymentData.razorpayPaymentId,
      razorpaySignature: paymentData.razorpaySignature
    })
  });
  return response.json();
};
```

### Response Format
All endpoints return JSON responses in this format:

**Success Response:**
```json
{
  "success": true,
  "data": { /* your data here */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## 🔧 Extending to Other Tables

To add the same structure to other tables, follow these steps:

1. **Add Model Definition** in `server/models/index.js`:
```javascript
export const NewTable = {
  tableName: 'new_table',
  fields: {
    id: 'VARCHAR(36) PRIMARY KEY',
    // add other fields...
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};
```

2. **Create Route File** `server/routes/new-table.js`:
```javascript
import express from 'express';
import db from '../db.js';
import { generateId } from '../models/index.js';

const router = express.Router();

// GET all
router.get('/', async (req, res) => {
  try {
    const results = await db.query('SELECT * FROM new_table ORDER BY created_at DESC');
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add POST, PUT, DELETE routes...

export default router;
```

3. **Register Route** in `server/routes.ts`:
```typescript
import newTableRouter from './routes/new-table.js';
// ...
app.use('/api/new-table', newTableRouter);
```

## ✅ Environment Variables Configured

Your database credentials are securely stored as environment variables:
- `DBHOST` - MySQL host (82.25.105.94)
- `DBUSER` - MySQL username 
- `DBPASSWORD` - MySQL password
- `DBDATABASE` - Database name

## 🎯 Next Steps

1. **Update Frontend Components**: Modify your React components to use the new API endpoints
2. **Test Integration**: Use the provided frontend examples to test functionality
3. **Add Error Handling**: Implement proper error handling in your frontend
4. **Database Optimization**: Consider adding indexes for better performance

## 📞 Support

The MySQL integration is now complete and ready for use. All endpoints have been tested and are operational. You can start using them immediately in your IndoSaga application!