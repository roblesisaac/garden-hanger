import etsyAuthService from '../services/etsyAuthService.js';

export const initiateAuth = async (req, res) => {
  try {
    // Store the return URL in session if provided
    if (req.query.returnUrl) {
      req.session.etsyAuthReturnUrl = req.query.returnUrl;
    }
    
    const { url, codeVerifier } = await etsyAuthService.getAuthUrl();
    
    // Store the code verifier in session
    req.session.etsyCodeVerifier = codeVerifier;
    
    // Force session save before redirect
    await new Promise((resolve, reject) => {
      req.session.save(err => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    res.redirect(url);
  } catch (error) {
    console.error('Etsy auth initiation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const handleCallback = async (req, res) => {
  try {
    // Check for OAuth error response
    if (req.query.error) {
      throw new Error(`Etsy OAuth error: ${req.query.error} - ${req.query.error_description}`);
    }

    const { code } = req.query;
    
    if (!code) {
      throw new Error('No authorization code received');
    }

    const codeVerifier = req.session.etsyCodeVerifier;
    if (!codeVerifier) {
      throw new Error('No code verifier found in session. Session may have expired.');
    }

    const tokenData = await etsyAuthService.getAccessToken(code, codeVerifier);
    const userInfo = await etsyAuthService.getUserInfo(tokenData.accessToken);

    // Store token data and user info in session
    req.session.etsyToken = {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: new Date(Date.now() + (tokenData.expiresIn * 1000)),
      userId: userInfo.userId,
      shopId: userInfo.shopId // This might be undefined if user has no shop
    };

    // Clean up code verifier
    delete req.session.etsyCodeVerifier;
    await req.session.save();

    // Redirect back to original page if set
    const returnUrl = req.session.etsyAuthReturnUrl || '/my-account';
    delete req.session.etsyAuthReturnUrl;
    
    res.redirect(returnUrl);
  } catch (error) {
    console.error('Etsy auth callback error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      sessionId: req.sessionID
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.session.etsyToken || {};
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const tokenData = await etsyAuthService.refreshAccessToken(refreshToken);

    // Update session with new tokens
    req.session.etsyToken = {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: new Date(Date.now() + (tokenData.expiresIn * 1000)),
    };

    await req.session.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add a middleware to check if user is authenticated with Etsy
export const requireEtsyAuth = async (req, res, next) => {
  if (!req.session.etsyToken) {
    // Store the current URL to redirect back after auth
    const returnUrl = req.originalUrl;
    return res.redirect(`/api/auth/etsy/connect?returnUrl=${encodeURIComponent(returnUrl)}`);
  }
  next();
};

export const getStatus = async (req, res) => {
  try {
    const isConnected = !!req.session.etsyToken;
    const lastSyncTime = req.session.lastEtsySync || null;

    res.json({
      success: true,
      isConnected,
      lastSyncTime
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 