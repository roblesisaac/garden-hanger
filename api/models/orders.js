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
    shippingAddress: {
        customerName: String,
        email: String,
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    orderItems: [
        {
            productsInListing: [{
                sku: String,
                qty: Number
            }],
            qty: Number,
            title: String,
            _id: String
        }
    ],
    totalPrice: {
        set: num => (Number(num) / 100).toFixed(2)
    },
    notes: String,
    purchasedLabelUrl: String,
    trackingUrl: String,
    status: {
        type: String,
        enum: [ 'created', 'on_hold', 'cancelled', 'shipped', 'delivered', 'returned' ]
    },
    cancellationReason: String,
    paymentStatus: {
        type: String,
        // enum: ['unpaid', 'failed', 'paid', 'voided', 'refunded', 'partially_refunded']
    },
    deliveredAt: String,
    shippingCost: Number,
    label1: 'userid',
    label2: 'stripeSessionId',
    label3: 'orderEmail',
    label4: 'status'
}

const orderModel = AmptModel('orders', orderSchema);

export default orderModel;