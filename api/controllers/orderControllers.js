import * as orderServices from '../services/orderServices';
import { sendError } from '../utils/errors';

export default {
    captureOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
            const capturedOrder = await orderServices.captureOrder(orderId);

            res.json(capturedOrder);
        } catch (err) {
            sendError(res, err);
        }
    },
    cancelOrder: async (req, res) => {
        try {
            const { orderId, cancellationReason } = req.body;
            const cancelledOrder = await orderServices.cancelOrder(orderId, cancellationReason);

            res.json(cancelledOrder);
        } catch (err) {
            sendError(res, err);
        }
    },
    checkoutStripeOrder: async (req, res) => {
        try {
            const tempSessionStore = req.isAuthenticated() ? req.session.passport : req.session;
            const { stripe_session_id } = tempSessionStore;

            if(!stripe_session_id) {
                return res.json(tempSessionStore.savedStripeOrder || null);
            }


            const { orderItems } = req.body;
            const savedStripeOrder = await orderServices.createStripeOrder(stripe_session_id, orderItems, req.user);

            await orderServices.sendOrderStatusEmail(savedStripeOrder);

            tempSessionStore.savedStripeOrder = savedStripeOrder;
            delete tempSessionStore.stripe_session_id;

            res.json(savedStripeOrder);
        } catch (err) {
            sendError(res, err);
        }
    },
    getAllOrders: async (_, res) => {
        try {
            const orders = await orderServices.getAllOrders();

            res.json(orders);
        } catch (err) {
            sendError(res, err);
        }
    },
    getUserOrders: async (req, res) => {
        try {
            const orders = await orderServices.getUserOrders(req.user?._id);

            res.json(orders);
        } catch (err) {
            sendError(res, err);
        }
    },
    refundOrder: async (req, res) => {
        try {
            const { orderId, refundAmount, refundReason } = req.body;
            const refundedOrder = await orderServices.refundOrder(orderId, refundAmount, refundReason);

            res.json(refundedOrder);
        } catch (err) {
            sendError(res, err);
        }
    },
    updateOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
            const updatedOrder = await orderServices.updateOrder(orderId, req.body);

            res.json(updatedOrder);
        } catch (err) {
            sendError(res, err);
        }
    }
}