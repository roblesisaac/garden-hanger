import fetch from 'node-fetch';
import etsyAuthService from './etsyAuthService.js';
import config from '../config/environment.js';
import { decode } from 'html-entities';

const ETSY_API_BASE = 'https://openapi.etsy.com/v3';

export class EtsyService {
  constructor() {
    this.apiKey = config.ETSY.API_KEY;
  }

  // Authentication and Headers
  async getHeaders(req) {
    const accessToken = req.session.etsyToken?.accessToken;
    
    if (!accessToken) {
      throw new Error('No Etsy access token found. Please authenticate first.');
    }

    if (this.isTokenExpired(req.session.etsyToken)) {
      const refreshedToken = await this.refreshToken(req);
      req.session.etsyToken = refreshedToken;
      await req.session.save();
    }

    return {
      'x-api-key': this.apiKey,
      'Authorization': `Bearer ${req.session.etsyToken.accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  }

  isTokenExpired(token) {
    if (!token?.expiresAt) return true;
    // Add 5 minute buffer before expiration
    return new Date(token.expiresAt).getTime() - 300000 < Date.now();
  }

  async refreshToken(req) {
    const refreshToken = req.session.etsyToken?.refreshToken;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const tokenData = await etsyAuthService.refreshAccessToken(refreshToken);
    return {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: new Date(Date.now() + (tokenData.expiresIn * 1000)),
    };
  }

  // API Requests
  async makeRequest(req, endpoint, options = {}) {
    const headers = await this.getHeaders(req);
    const response = await fetch(`${ETSY_API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Etsy API error: ${response.status} ${response.statusText} - ${errorData.error}`);
    }

    return response.json();
  }

  // Order Fetching
  async fetchOrders(req, params = {}) {
    try {
      const shopId = req.session.etsyToken?.shopId;
      if (!shopId) {
        return { count: 0, results: [] };
      }

      const queryParams = this.buildQueryParams(params);
      const orders = await this.fetchOrdersData(req, shopId, queryParams);
      
      const transformedOrders = orders.results.map(order => {
        // Create ISO date string from Etsy timestamp
        console.log('order.created_timestamp', order.created_timestamp);
        console.log('order.createdTimestamp', order.createdTimestamp);
        const orderDate = new Date(order.created_timestamp * 1000).toISOString();
        const dateForId = orderDate.replace(/[:]/g, '-');
        console.log('orderDate', orderDate);
        console.log('dateForId', dateForId);
        return {
          ...order,
          _id: dateForId, // Add formatted date as _id for consistency
          shipping_address: {
            name: decode(order.name || ''),
            first_line: decode(order.first_line || ''),
            second_line: decode(order.second_line || ''),
            city: decode(order.city || ''),
            state: decode(order.state || ''),
            zip: order.zip || '',
            formatted_address: decode(order.formatted_address || ''),
            country_iso: order.country_iso || '',
            email: order.buyer_email || ''
          },
          orderItems: order.transactions.map(item => ({
            _id: `etsy_${item.transaction_id}`,
            title: decode(item.title || ''),
            productsInListing: [{
              sku: item.sku || '',
              qty: item.quantity || 1
            }],
            qty: item.quantity || 1
          }))
        };
      });

      return {
        ...orders,
        results: transformedOrders
      };
    } catch (error) {
      throw new Error(`Failed to fetch Etsy orders: ${error.message}`);
    }
  }

  buildQueryParams(params) {
    return new URLSearchParams(
      Object.entries({
        limit: '50',
        offset: '0',
        // Add any additional fields we want to include in the future
        ...params
      }).filter(([_, value]) => value !== undefined)
    );
  }

  async fetchOrdersData(req, shopId, queryParams) {
    return this.makeRequest(req, `/application/shops/${shopId}/receipts?${queryParams}`);
  }

  // Reserved for future Etsy preferred partnership implementation
  async fetchOrderDetails(req, shopId, orderId) {
    return this.makeRequest(req, `/application/shops/${shopId}/receipts/${orderId}`);
  }
}

export default new EtsyService(); 