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
      
      // Instead of fetching addresses separately, include them in the initial request
      const ordersWithDetails = await this.fetchOrdersWithDetails(req, orders.results);

      return {
        ...orders,
        results: ordersWithDetails
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
        includes: 'Shipping',  // Add this to get shipping info in initial request
        ...params
      }).filter(([_, value]) => value !== undefined)
    );
  }

  async fetchOrdersData(req, shopId, queryParams) {
    return this.makeRequest(req, `/application/shops/${shopId}/receipts?${queryParams}`);
  }

  async fetchOrdersWithDetails(req, orders) {
    return orders.map(order => {
      // Extract shipping address from the order data directly
      const shippingAddress = {
        name: order.name || '',
        first_line: order.first_line || '',
        second_line: order.second_line || '',
        city: order.city || '',
        state: order.state || '',
        zip: order.zip || '',
        formatted_address: order.formatted_address || '',
        country_iso: order.country_iso || '',
      };

      return {
        ...order,
        shipping_address: shippingAddress
      };
    });
  }
}

export default new EtsyService(); 