import fetch from 'node-fetch';
import crypto from 'crypto';
import config from '../config/environment';

const ETSY_AUTH_BASE = 'https://api.etsy.com/v3/public/oauth';
const ETSY_API_BASE = 'https://openapi.etsy.com/v3';

export class EtsyAuthService {
  constructor() {
    this.clientId = config.ETSY.API_KEY;
    this.clientSecret = config.ETSY.SHARED_SECRET;
    this.redirectUri = `${config.AMPT_URL}/api/etsy/auth/callback`;
    this.scopes = ['transactions_r', 'listings_r', 'orders_r'];
  }

  // Generate code verifier for PKCE
  generateCodeVerifier() {
    return crypto.randomBytes(32)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Generate code challenge from verifier
  async generateCodeChallenge(verifier) {
    const hash = crypto.createHash('sha256')
      .update(verifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return hash;
  }

  async getAuthUrl() {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Store code verifier in session to use it later
    return {
      url: `${ETSY_AUTH_BASE}/connect?${new URLSearchParams({
        response_type: 'code',
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
        scope: this.scopes.join(' '),
        state: Math.random().toString(36).substring(7),
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      })}`,
      codeVerifier
    };
  }

  async getAccessToken(code, codeVerifier) {
    try {
      const response = await fetch(`${ETSY_AUTH_BASE}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          redirect_uri: this.redirectUri,
          code: code,
          code_verifier: codeVerifier
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get access token: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      const response = await fetch(`${ETSY_AUTH_BASE}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  async getUserShops(accessToken) {
    try {
      const response = await fetch(`${ETSY_API_BASE}/application/users/me/shops`, {
        headers: {
          'x-api-key': this.clientId,
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get user shops: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.shops || data.shops.length === 0) {
        throw new Error('No shops found for this user');
      }

      // Return the first shop's ID
      return data.shops[0].shop_id;
    } catch (error) {
      throw new Error(`Failed to get shop ID: ${error.message}`);
    }
  }
}

export default new EtsyAuthService(); 