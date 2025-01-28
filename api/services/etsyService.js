import fetch from 'node-fetch';
import etsyAuthService from './etsyAuthService.js';
import config from '../config/environment.js';

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
      const ordersWithAddresses = await this.fetchOrderAddresses(req, orders.results);

      return {
        ...orders,
        results: ordersWithAddresses
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
        ...params
      }).filter(([_, value]) => value !== undefined)
    );
  }

  async fetchOrdersData(req, shopId, queryParams) {
    return this.makeRequest(req, `/application/shops/${shopId}/receipts?${queryParams}`);
  }

  async fetchOrderAddresses(req, orders) {
    const addressPromises = orders.map(order => this.fetchOrderAddress(req, order));
    const results = await Promise.allSettled(addressPromises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          ...orders[index],
          shipping_address: result.value.shipping_address || {}
        };
      }
      console.error(`Failed to fetch address for order ${orders[index].receipt_id}:`, result.reason);
      return orders[index];
    });
  }

  async fetchOrderAddress(req, order) {
    try {
      return await this.makeRequest(
        req,
        `/application/receipts/${order.receipt_id}?includes=shipping_address`
      );
    } catch (error) {
      throw new Error(`Failed to fetch address for order ${order.receipt_id}: ${error.message}`);
    }
  }
}

export default new EtsyService(); 