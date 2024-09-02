import config from '../config/environment';
import { formatDateFromId } from '../utils/formats';
import base64Logo from './logoBase64';

export default function(order) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
      <style>
          body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
          }
          .container {
              max-width: 600px;
              margin: 20px auto;
              background: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
          }
          .logo {
            width: 100%;
            height: auto;
            margin-bottom: 20px;
        }
          .content {
              padding: 20px;
          }
          h1, h2 {
              color: #2C3E50;
              margin-top: 0;
          }
          .order-details, .order-items {
              background: #f9f9f9;
              border-radius: 4px;
              padding: 15px;
              margin-bottom: 20px;
          }
          .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
          }
          .detail-label {
              font-weight: bold;
              color: #7f8c8d;
              margin-right: 8px;
          }
          .site-domain {
              text-transform: capitalize;
              color: #3498db;
              font-weight: bold;
              cursor: pointer;
              text-decoration: underline;
              font-size: 16px;
          }
          table {
              width: 100%;
              border-collapse: collapse;
          }
          th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
          }
          th {
              background-color: #ecf0f1;
              color: #2C3E50;
          }
          .footer {
              background-color: #34495e;
              color: white;
              text-align: center;
              padding: 20px;
              font-size: 0.9em;
          }
          @media only screen and (max-width: 600px) {
              .container {
                  width: 100%;
                  margin: 0;
              }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <a href="${config.URL}"><img src="${base64Logo()}" alt="Company Logo" class="logo"></a>
          <div class="header">
              <h1>Order Confirmation</h1>
              <p>Thank you for your purchase!</p>
          </div>
          
          <div class="content">
              <div class="order-details">
                  <h2>Order Details</h2>
                  <div class="detail-row">
                      <span class="detail-label">Order Number:</span> <span>${order.orderId}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">Order Date:</span> <span>${formatDateFromId(order._id)}</span>
                  </div>
                  <div class="detail-row">
                      <span class="detail-label">Total Amount:</span> <span>$${order.totalPrice}</span>
                  </div>
                  <br>
                  <br>
                  <h2>Shipping Address</h2>
                  <div class="detail-row">
                      <span>
                        <b>${order.shippingAddress.customerName}</b>
                        <br>
                        ${order.shippingAddress.street}
                        <br>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
                      </span>
                  </div>
              </div>
              
              <div class="order-items">
                  <h2>Order Items</h2>
                  <table>
                      <thead>
                          <tr>
                              <th>Item</th>
                              <th>Quantity</th>
                              <th>Price</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${order.stripeSession.line_items.data.map(item => `
                              <tr>
                                  <td><a href="${config.URL}/products/${item.description.toLowerCase()}">${item.description}</a></td>
                                  <td>${item.quantity}</td>
                                  <td>$${(item.amount_total / 100).toFixed(2)}</td>
                              </tr>
                          `).join('')}
                      </tbody>
                  </table>
              </div>
          </div>
          
          <div class="footer">
              <p>If you have any questions about your order, please contact our customer support.</p>
              <p>Thank you for shopping with us!</p>
              <p><a href="${config.URL}" class="site-domain">${config.CUSTOM_DOMAIN} »</a></p>
          </div>
      </div>
  </body>
  </html>
  `;
}