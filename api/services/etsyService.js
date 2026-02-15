import fetch from 'node-fetch';
import etsyAuthService from './etsyAuthService.js';
import config from '../config/environment.js';
import listingsModel from '../models/listings.js';

const ETSY_API_BASE = 'https://openapi.etsy.com/v3';

export class EtsyService {
  constructor() {
    const { apiKey, sharedSecret } = this.normalizeCredentials(config.ETSY.API_KEY, config.ETSY.SHARED_SECRET);
    this.apiKey = this.buildApiKeyHeader(apiKey, sharedSecret);
  }

  normalizeCredentials(apiKey, sharedSecret) {
    const key = (apiKey || '').trim();
    const secret = (sharedSecret || '').trim();

    if (key.includes(':') && !secret) {
      const [parsedKey, parsedSecret] = key.split(':', 2);
      return {
        apiKey: (parsedKey || '').trim(),
        sharedSecret: (parsedSecret || '').trim()
      };
    }

    return {
      apiKey: key,
      sharedSecret: secret
    };
  }

  buildApiKeyHeader(apiKey, sharedSecret) {
    const key = (apiKey || '').trim();
    const secret = (sharedSecret || '').trim();

    if (!key || !secret) {
      return '';
    }

    return `${key}:${secret}`;
  }

  validateCredentials() {
    if (!this.apiKey) {
      throw new Error('Etsy credentials are not configured. Set API_KEY+SHARED_SECRET or ETSY_API_KEY+ETSY_SHARED_SECRET.');
    }
  }

  // Authentication and Headers
  async getHeaders(req) {
    this.validateCredentials();

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
      const listings = await listingsModel.findAll({});

      const transformedOrders = orders.results.map(order => {
        // Create ISO date string from Etsy timestamp
        const orderDate = new Date(order.created_timestamp * 1000);
        const year = orderDate.getUTCFullYear();
        const month = String(orderDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(orderDate.getUTCDate()).padStart(2, '0');
        const hours = String(orderDate.getUTCHours()).padStart(2, '0');
        const minutes = String(orderDate.getUTCMinutes()).padStart(2, '0');
        const seconds = String(orderDate.getUTCSeconds()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
        const random = Math.random().toString(16).slice(2, 14);

        return {
          ...order,
          _id: `orders:${formattedDate.replace(/:/g, '-')}_${random}`,
          shipping_address: {
            name: order.name || '',
            first_line: order.first_line || '',
            second_line: order.second_line || '',
            city: order.city || '',
            state: order.state || '',
            zip: order.zip || '',
            formatted_address: order.formatted_address || '',
            country_iso: order.country_iso || '',
            email: order.buyer_email || ''
          },
          orderItems: order.transactions.map(item => {
            const existingListing = listings.find(listing => listing.etsyLookup.toLowerCase() === item.sku.toLowerCase());
            return {
              _id: `etsy_${item.transaction_id}`,
              title: existingListing?.title || item.sku,
              productsInListing: existingListing ?
                existingListing.productsInListing
                : [{
                  sku: item.sku || '',
                  qty: item.quantity || 1
                }],
              qty: item.quantity || 1
            }
          })
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
