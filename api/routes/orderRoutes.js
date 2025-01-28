import express from 'express';
import { syncOrders, getOrderById } from '../controllers/orderController.js';

const router = express.Router();

router.get('/sync', syncOrders);
router.get('/:orderId', getOrderById);

export default router; 