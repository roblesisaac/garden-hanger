import { syncEtsyOrders } from '../services/orderServices.js';
import { requireEtsyAuth } from './etsyAuthController.js';

export const syncOrders = [requireEtsyAuth, async (req, res) => {
  try {
    const result = await syncEtsyOrders(req);
    res.status(200).json(result);
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