import fetch from 'node-fetch';
import crypto from 'crypto';
import config from '../config/environment';

const ETSY_AUTH_BASE_CONNECT = 'https://www.etsy.com/oauth';
const ETSY_AUTH_BASE_TOKEN = 'https://api.etsy.com/v3/public/oauth';
const ETSY_API_BASE = 'https://openapi.etsy.com/v3';

export class EtsyAuthService {
  constructor() {
    const { clientId, clientSecret } = this.normalizeCredentials(config.ETSY.API_KEY, config.ETSY.SHARED_SECRET);
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.apiKey = this.buildApiKeyHeader();
    this.redirectUri = `${config.baseUrl}/api/etsy/auth/callback`;
    this.scopes = [
      'email_r',
      'shops_r', 
      'transactions_r',
      'listings_r'
    ];
  }

  normalizeCredentials(apiKey, sharedSecret) {
    const key = (apiKey || '').trim();
    const secret = (sharedSecret || '').trim();

    if (key.includes(':') && !secret) {
      const [parsedKey, parsedSecret] = key.split(':', 2);
      return {
        clientId: (parsedKey || '').trim(),
        clientSecret: (parsedSecret || '').trim()
      };
    }

    return {
      clientId: key,
      clientSecret: secret
    };
  }

  buildApiKeyHeader() {
    const key = (this.clientId || '').trim();
    const secret = (this.clientSecret || '').trim();

    if (!key || !secret) {
      return '';
    }

    return `${key}:${secret}`;
  }

  validateCredentials() {
    if (!this.clientId) {
      throw new Error('Etsy API key is missing. Set API_KEY or ETSY_API_KEY.');
    }

    if (!this.apiKey) {
      throw new Error('Etsy shared secret is missing. Set SHARED_SECRET or ETSY_SHARED_SECRET.');
    }
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
    this.validateCredentials();

    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Store code verifier in session to use it later
    return {
      url: `${ETSY_AUTH_BASE_CONNECT}/connect?${new URLSearchParams({
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
      this.validateCredentials();

      const response = await fetch(`${ETSY_AUTH_BASE_TOKEN}/token`, {
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
      this.validateCredentials();

      const response = await fetch(`${ETSY_AUTH_BASE_TOKEN}/token`, {
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

  async getUserInfo(accessToken) {
    try {
      this.validateCredentials();

      // Get the user ID
      const userResponse = await fetch(`${ETSY_API_BASE}/application/users/me`, {
        headers: {
          'x-api-key': this.apiKey,
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(`Failed to get user info: ${errorData.error || userResponse.statusText}`);
      }

      const userData = await userResponse.json();
      const userId = userData.user_id;

      // Try to get shop info, but don't fail if there's no shop
      try {
        const shopsResponse = await fetch(`${ETSY_API_BASE}/application/users/${userId}/shops`, {
          headers: {
            'x-api-key': this.apiKey,
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
        });

        if (shopsResponse.ok) {
          const shopsData = await shopsResponse.json();
          if (!!shopsData) {
            return {
              userId: userId.toString(),
              shopId: shopsData.shop_id.toString()
            };
          }
        }
      } catch (shopError) {
        console.warn('Failed to get shop info:', shopError);
      }

      // Return just the user ID if no shop is found
      return {
        userId: userId.toString()
      };
    } catch (error) {
      console.error('Get user info error:', error);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }
}

export default new EtsyAuthService(); 
