import etsyService from '../services/etsyService.js';
import { requireEtsyAuth } from '../controllers/etsyAuthController.js';

export const syncOrders = [requireEtsyAuth, async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const orders = await etsyService.fetchOrders(req, { limit, offset });
    
    // Store last sync time
    req.session.lastEtsySync = new Date().toISOString();
    await req.session.save();
    
    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}];

export const getOrderById = [requireEtsyAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await etsyService.fetchOrders(req, { receipt_id: orderId });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}]; 