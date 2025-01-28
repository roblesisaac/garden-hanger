import { ref } from 'vue';
import useApi from './useApi';
import useShipping from './useShipping';

const { get, post, put } = useApi();
const { createShipment } = useShipping();

const orderItems = ref([]);
const loading = ref(false);

export default function useOrders() {

    async function captureOrder(order) {
        try {
            const capturedOrder = await post('orders/capture/' + order._id);
            return capturedOrder;
        } catch (err) {
            throw err;
        }
    }

    async function cancelOrder(orderId, cancellationReason) {
        try {
            const cancelledOrder = await post('orders/cancel-order', {
                orderId,
                cancellationReason
            });

            return cancelledOrder;
        } catch (err) {
            throw err;
        }
    }

    async function createLabel(order) {
        try {
            const { orderItems, shippingAddress } = order;

            const shipment = await createShipment(shippingAddress, orderItems);
            const labelResponse = await post('orders/create-label', { orderItems, shippingAddress });
            return {
                labelResponse,
                shipment
            };
        } catch (err) {
            throw err;
        }
    }

    async function getOrders(apiEndpoint='orders') {
        loading.value = true;
        try {
            const orders = await get(apiEndpoint);
            console.log('Retrieved orders:', orders);
            orderItems.value = orders.map(order => {
                // Add empty stripeSession for Etsy orders to prevent null reference errors
                if (order.orderSource === 'etsy') {
                    return {
                        ...order,
                        stripeSession: {
                            line_items: {
                                data: order.orderItems.map(item => ({
                                    id: item._id,
                                    description: item.title,
                                    quantity: item.qty,
                                    amount_total: 0 // Etsy orders handle pricing differently
                                }))
                            }
                        }
                    };
                }
                return order;
            }).sort((a, b) => {
                const dateA = a.orderSource === 'etsy' ? 
                    new Date(a.createdTimestamp * 1000) : 
                    new Date(a._id.split('_')[0]);
                const dateB = b.orderSource === 'etsy' ? 
                    new Date(b.createdTimestamp * 1000) : 
                    new Date(b._id.split('_')[0]);
                return dateB - dateA;
            });
            console.log('Sorted orders:', orderItems.value);
            return orders;
        } catch (err) {
            console.error('Error fetching orders:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    }

    async function refundOrder(orderData, refundAmount = null) {
        if(refundAmount === 0 && !confirm('Are you sure you want to refund this order?')) {
            return;
        }

        const { _id, totalPrice, refunds } = orderData;
        const totalRefunded = refunds.reduce((sum, refund) => sum + ( refund || 0 ), 0);

        if(refundAmount+totalRefunded > totalPrice) {
          throw new Error('Refund amount will exceed total price of order.');
        }

        if(refundAmount === 0) {
            const refundRemainder = Math.round((totalPrice - totalRefunded) * 100) / 100;

            refundAmount = refundRemainder;
        }

        const refundResult = await post('orders/refund', {
            orderId: _id,
            refundAmount
        });

        return refundResult;
    }

    async function updateOrder(orderId, updates) {
        const updatedOrder = await put(`orders/${orderId}`, updates);

        orderItems.value = orderItems.value.map(orderItem => 
            orderItem._id === orderId 
                ? { ...orderItem, ...updatedOrder } 
                : orderItem
        );
    }


    return  {
        loading,
        captureOrder,
        cancelOrder,
        createLabel,
        getOrders,
        orderItems,
        refundOrder,
        updateOrder
    }
}