import AmptModel from '../utils/amptModel';
import { generateRandomNumber } from '../utils/tools';
import { encrypt, decrypt } from '../utils/encryption';

const orderSchema = {
    orderId: {
        set: () => generateRandomNumber()
    },
    userid: String,
    stripeSessionId: {
        set: encrypt,
        get: decrypt
    },
    orderEmail: String,
    shippingAddress: {
        customerName: String,
        email: String,
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    totalPrice: {
        set: num => (Number(num) / 100).toFixed(2)
    },
    notes: String,
    purchasedLabelUrl: String,
    trackingUrl: String,
    status: {
        type: String,
        enum: [ 'pending', 'on_hold', 'cancelled', 'shipped', 'delivered', 'returned' ]
    },
    cancellationReason: String,
    paymentStatus: {
        type: String,
        enum: ['failed', 'paid', 'voided', 'refunded', 'partially_refunded']
    },
    deliveredAt: String,
    shippingCost: Number,
    label1: 'userid',
    label2: 'stripeSessionId',
    label3: 'orderEmail',
    label4: 'status'
}

const orderModel = AmptModel('orders', orderSchema);

orderModel.saveStripeOrder = async (stripeSession, user) => {
    const { address } = stripeSession.shipping_details;
    const savedOrder = await orderModel.save({
        userid: user ? user._id : 'guest',
        stripeSessionId: stripeSession.id,
        totalPrice: stripeSession.amount_total,
        status: 'pending',
        paymentStatus: stripeSession.payment_status,
        shippingAddress: {
            customerName: stripeSession.shipping_details.name,
            email: stripeSession.customer_email,
            street: address.line1,
            city: address.city,
            state: address.state,
            zipCode: address.postal_code
        }
    });

    return savedOrder;
}

export default orderModel;