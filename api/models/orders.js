import AmptModel from '../utils/amptModel';
import { generateRandomNumber } from '../utils/tools';
import { encrypt, decrypt } from '../utils/encryption';

const orderSchema = {
    orderId: {
        set: (val) => val || generateRandomNumber()
    },
    userid: String,
    stripeSessionId: {
        set: (val) => val ? encrypt(val) : null,
        get: (val) => val ? decrypt(val) : null
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
        enum: ['created', 'on_hold', 'processing', 'cancelled', 'shipped', 'delivered', 'returned']
    },
    cancellationReason: String,
    paymentStatus: {
        type: String,
        // enum: ['unpaid', 'failed', 'paid', 'captured', 'voided', 'refunded', 'partially_refunded']
    },
    refunds: [Number],
    deliveredAt: String,
    shippingCost: Number,
    orderSource: {
        type: String,
        enum: ['website', 'etsy']
    },
    etsyReceiptId: String,
    createdTimestamp: Number,
    updatedTimestamp: Number,
    isShipped: Boolean,
    label1: 'userid',
    label2: 'stripeSessionId',
    label3: 'orderEmail',
    label4: 'status'
}

const orderModel = AmptModel('orders', orderSchema);

export default orderModel;