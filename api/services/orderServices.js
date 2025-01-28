import Orders from '../models/orders';
import { throwError } from '../utils/errors';
import { extractDateFromId } from '../utils/tools';
import { sendEmail } from './contactServices';
import config from '../config/environment';
import orderCreatedTemplate from '../emails/order-created-template';
import orderShippedTemplate from '../emails/order-shipped-template';
import * as StripeService from './stripeServices';
import etsyService from './etsyService.js';

export async function captureOrder(orderId) {
    const orderToCapture = await Orders.findOne(orderId);
    const canCapture = orderToCapture.paymentStatus === 'unpaid';

    if(!canCapture) {
        return {
            success: false,
            message: `You can only capture unpaid orders.`
        }
    }

    const capturedPayment = await StripeService.capturePayment(orderToCapture.stripeSessionId);

    if(capturedPayment.status !== 'succeeded') {
        return {
            success: false,
            message: 'Something went wrong. Please try again later.'
        }
    }

    const capturedOrder = await Orders.update(orderId, {
        status: 'processing',
        paymentStatus: 'captured'
    });

    return capturedOrder;
}

export async function cancelOrder(orderId, cancellationReason) {
    const orderToCancel = await Orders.findOne(orderId);
    const canCancel = orderToCancel.paymentStatus === 'unpaid';

    if(!canCancel) {
        return {
            success: false,
            message: `You can only cancel unpaid orders.`
        }
    }

    const voidedPayment = await StripeService.voidPayment(orderToCancel.stripeSessionId);

    if(voidedPayment.status !== 'canceled') {
        return {
            success: false,
            message: 'Something went wrong. Please try again later.'
        }
    }

    const cancelledOrder = await Orders.update(orderId, {
        status: 'cancelled',
        paymentStatus: 'voided',
        cancellationReason
    });

    // send email

    return cancelledOrder;
}

export async function createStripeOrder(stripeSessionId, orderItems, user) {
    const stripeSession = await StripeService.retreiveStripeSession(stripeSessionId);
    const { id, amount_total, payment_status, shipping_details, customer_email } = stripeSession;

    const { address, name } = shipping_details;
    const savedOrder = await Orders.save({
        userid: user ? user._id : 'guest',
        stripeSessionId: id,
        orderSource: 'website',
        totalPrice: amount_total,
        orderItems,
        status: 'created',
        paymentStatus: payment_status,
        shippingAddress: {
            customerName: name,
            email: customer_email,
            street: address.line1,
            city: address.city,
            state: address.state,
            zipCode: address.postal_code
        }
    });
  
    return {
      ...savedOrder,
      stripeSession: stripeSession
    };
}

export async function getStripeOrderSession(order) {
    const { stripeSessionId, ...restOrder } = order;

    if(!stripeSessionId) {
        return {
            ...order,
            stripeSession: stripeSessionId
        }
    }

    return {
        ...restOrder,
        stripeSession: await StripeService.retreiveStripeSession(stripeSessionId)
    }
}

export async function getAllOrders() {
    try {
        const userOrders = await Orders.findAll({ userid: '*' });
        const userOrdersWithStripeSessions = [];

        for (const userOrder of userOrders) {
            const stripedOrder = await getStripeOrderSession(userOrder); 

            userOrdersWithStripeSessions.push(stripedOrder);
        }
        
        return sortByMostRecent(userOrdersWithStripeSessions);
    } catch (err) {
        throwError(err);
    }
}

export async function getUserOrders(userid) {
    try {
        const userOrders = await Orders.findAll({ userid });
        const sanitizedOrders = [];

        for (const userOrder of userOrders) {
            const { purchasedLabelUrl, ...sanitizedOrder } = await getStripeOrderSession(userOrder); 

            sanitizedOrders.push(sanitizedOrder);
        }
        
        return sortByMostRecent(sanitizedOrders);
    } catch (err) {
        throwError(err);
    }
}

export async function refundOrder(orderId, refundAmount, refundReason) {
    try {
        const savedOrder = await Orders.findOne(orderId);
        const stripeRefund = await StripeService.refundPayment(savedOrder.stripeSessionId, refundAmount, refundReason);
    
        if(stripeRefund.status !== 'succeeded') {
            throw new Error('Something went wrong with StripeService.refundPayment. Please try again later.');
        }

        const refundedOrder = await Orders.update(orderId, {
            paymentStatus: 'refunded',
            refunds: [
                ...savedOrder.refunds,
                stripeRefund.amount / 100
            ]
        });
    
        return refundedOrder;
    } catch (err) {
        throw err;
    }
}

export async function sendOrderStatusEmail(order) {
    const emailTemplates = {
        'created': {
            subject: 'Your Order Confirmation',
            template: orderCreatedTemplate
        },
        'on_hold': 'order-on-hold-template',
        'shipped': {
            subject: '',
            template: orderShippedTemplate
        },
        'delivered': 'order-delivered-template',
        'cancelled': 'order-cancelled-template'
    };

    const from = `${config.CONTACT.SITENAME} <orders${config.CONTACT.SES_EMAIL}>`;
    const replyTo = `orders${config.CONTACT.SES_EMAIL}`;
    const toCustomer = order.shippingAddress.email;
    const toAdmin = config.CONTACT.EMAIL;
    const { subject, template } = emailTemplates[order.status];

    if(!template) {
        return;
    }

    const html = template(order);

    try {
        await Promise.all([
            sendEmail({ from, to: toCustomer, replyTo, subject, html }),
            sendEmail({ from, to: toAdmin, subject, html })
        ]);
    } catch (error) {
        throw error;
    }
    
}

function sortByMostRecent(orders) {
    if(!Array.isArray(orders)) {
        return [];
    }

    return orders.sort((a, b) => {
        // For Etsy orders, use createdTimestamp
        if (a.orderSource === 'etsy' && b.orderSource === 'etsy') {
            return b.createdTimestamp - a.createdTimestamp;
        }
        // For website orders, use the existing date extraction
        const dateA = a.orderSource === 'etsy' ? new Date(a.createdTimestamp * 1000) : extractDateFromId(a._id);
        const dateB = b.orderSource === 'etsy' ? new Date(b.createdTimestamp * 1000) : extractDateFromId(b._id);
        
        return dateB.getTime() - dateA.getTime();
    });
}

export async function updateOrder(orderId, updates) {
    const updatedOrder = await Orders.update(orderId, updates);

    return updatedOrder;
}

export async function syncEtsyOrders(req) {
  try {
    const etsyOrders = await etsyService.fetchOrders(req);
    const savedOrders = [];
    const errors = [];

    // Get all existing Etsy orders first
    const existingOrders = await Orders.findAll({ orderSource: 'etsy' });
    const existingOrderIds = new Set(existingOrders.map(order => order.etsyReceiptId));


    for (const etsyOrder of etsyOrders.results) {
      try {
        if (existingOrderIds.has(String(etsyOrder.receipt_id))) {
          continue;
        }

        const orderData = {
          _id: `orders:${etsyOrder._id}`,
          orderId: etsyOrder.receipt_id.toString(),
          userid: req.session.etsyToken.userId,
          orderSource: 'etsy',
          etsyReceiptId: etsyOrder.receipt_id,
          shippingAddress: {
            customerName: etsyOrder.name || '',
            email: etsyOrder.buyer_email || '',
            street: etsyOrder.first_line || '',
            city: etsyOrder.city || '',
            state: etsyOrder.state || '',
            zipCode: etsyOrder.zip || '',
            country: etsyOrder.country_iso || ''
          },
          orderItems: etsyOrder.transactions.map(transaction => ({
            productsInListing: [{
              sku: transaction.sku || '',
              qty: transaction.quantity
            }],
            qty: transaction.quantity,
            title: transaction.title,
            _id: `etsy_${transaction.transaction_id}`
          })),
          totalPrice: etsyOrder.total_price.amount,
          status: mapEtsyStatus(etsyOrder.status),
          paymentStatus: etsyOrder.is_paid ? 'paid' : 'unpaid',
          createdTimestamp: etsyOrder.created_timestamp,
          updatedTimestamp: etsyOrder.updated_timestamp,
          isShipped: etsyOrder.is_shipped,
          notes: etsyOrder.message_from_buyer || '',
          trackingUrl: etsyOrder.shipments?.[0]?.tracking_url || '',
          shippingCost: etsyOrder.total_shipping_cost?.amount || 0,
          deliveredAt: etsyOrder.status === 'Completed' ? new Date(etsyOrder.updated_timestamp * 1000).toISOString() : '',
          label1: 'userid',
          label2: 'etsyReceiptId',
          label3: 'orderEmail',
          label4: 'status',
          refunds: []
        };

        const savedOrder = await Orders.save(orderData);
        savedOrders.push(savedOrder);
      } catch (error) {
        console.error('Error saving order:', error);
        errors.push({
          orderId: etsyOrder.receipt_id,
          error: error.message
        });
      }
    }

    // Update last sync time
    req.session.lastEtsySync = new Date().toISOString();
    await req.session.save();

    return {
      success: true,
      syncedOrders: savedOrders.length,
      totalOrders: etsyOrders.count,
      errors: errors.length > 0 ? errors : undefined,
      savedOrders
    };
  } catch (error) {
    console.error('Sync error:', error);
    throw new Error(`Failed to sync Etsy orders: ${error.message}`);
  }
}

// Helper function to map Etsy status to our status
function mapEtsyStatus(etsyStatus) {
  const statusMap = {
    'Paid': 'processing',
    'Completed': 'delivered',
    'Canceled': 'cancelled',
    'Shipped': 'shipped'
  };
  return statusMap[etsyStatus] || 'created';
}