import fetch from 'node-fetch';
import etsyAuthService from './etsyAuthService.js';
import config from '../config/environment.js';

const ETSY_API_BASE = 'https://openapi.etsy.com/v3';

export class EtsyService {
  constructor() {
    this.apiKey = config.ETSY.API_KEY;
  }

  async getHeaders(req) {
    // Get token from session
    const accessToken = req.session.etsyToken?.accessToken;
    
    if (!accessToken) {
      throw new Error('No Etsy access token found. Please authenticate first.');
    }

    // Check if token is expired and needs refresh
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

  async fetchOrders(req, params = {}) {
    try {
      const shopId = req.session.etsyToken?.shopId;
      if (!shopId) {
        return { count: 0, results: [] };
      }

      const queryParams = new URLSearchParams(
        Object.entries({
          limit: '50',
          offset: '0',
          ...params
        }).filter(([_, value]) => value !== undefined)
      );

      const response = await fetch(
        `${ETSY_API_BASE}/application/shops/${shopId}/receipts?${queryParams}`,
        {
          method: 'GET',
          headers: await this.getHeaders(req),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Etsy API error: ${response.status} ${response.statusText} - ${errorData.error}`);
      }

      const data = await response.json();
      
      console.log(data.results.length);
      
      // Fetch shipping addresses for each order
      const ordersWithAddresses = await Promise.all(
        data.results.map(async (order) => {
          try {
            const addressResponse = await fetch(
              `${ETSY_API_BASE}/application/receipts/${order.receipt_id}?includes=shipping_address`,
              {
                method: 'GET',
                headers: await this.getHeaders(req),
              }
            );

            if (!addressResponse.ok) {
              console.error(`Failed to fetch address for order ${order.receipt_id}`);
              return order;
            }

            const addressData = await addressResponse.json();
            return {
              ...order,
              shipping_address: addressData.shipping_address || {}
            };
          } catch (error) {
            console.error(`Error fetching address for order ${order.receipt_id}:`, error);
            return order;
          }
        })
      );

      console.log(ordersWithAddresses);

      return {
        ...data,
        results: ordersWithAddresses
      };
    } catch (error) {
      throw new Error(`Failed to fetch Etsy orders: ${error.message}`);
    }
  }
}

export default new EtsyService(); 