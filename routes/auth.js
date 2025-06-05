const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const hmrcConfig = require('../config/hmrc');

const router = express.Router();

// Store for OAuth state (in production, use Redis/database)
const oauthStates = new Map();

// Initiate HMRC OAuth flow
router.get('/login', (req, res) => {
  const state = uuidv4();
  const { vrn } = req.query; // VAT Registration Number
  
  // Store state with VRN for validation
  oauthStates.set(state, { vrn, timestamp: Date.now() });
  
  const authUrl = `${hmrcConfig.authUrl}?` +
    `response_type=code&` +
    `client_id=${hmrcConfig.clientId}&` +
    `scope=${encodeURIComponent(hmrcConfig.scope)}&` +
    `state=${state}&` +
    `redirect_uri=${encodeURIComponent(hmrcConfig.redirectUri)}`;
  
  res.json({ authUrl, state });
});

// Handle OAuth callback
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    return res.status(400).json({ 
      error: 'OAuth error', 
      description: error 
    });
  }
  
  // Validate state
  const storedState = oauthStates.get(state);
  if (!storedState) {
    return res.status(400).json({ 
      error: 'Invalid state parameter' 
    });
  }
  
  // Clean up state (prevent replay attacks)
  oauthStates.delete(state);
  
  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post(hmrcConfig.tokenUrl, {
      grant_type: 'authorization_code',
      code,
      client_id: hmrcConfig.clientId,
      client_secret: hmrcConfig.clientSecret,
      redirect_uri: hmrcConfig.redirectUri
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Create JWT token for our application
    const appToken = jwt.sign({
      vrn: storedState.vrn,
      hmrcAccessToken: access_token,
      hmrcRefreshToken: refresh_token,
      expiresAt: Date.now() + (expires_in * 1000)
    }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
    
    // Redirect to frontend with token
    res.redirect(`/?token=${appToken}&status=success`);
    
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.redirect(`/?status=error&message=${encodeURIComponent('Authentication failed')}`);
  }
});

// Refresh HMRC access token
router.post('/refresh', async (req, res) => {
  const { token } = req.body;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const refreshResponse = await axios.post(hmrcConfig.tokenUrl, {
      grant_type: 'refresh_token',
      refresh_token: decoded.hmrcRefreshToken,
      client_id: hmrcConfig.clientId,
      client_secret: hmrcConfig.clientSecret
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, refresh_token, expires_in } = refreshResponse.data;
    
    const newToken = jwt.sign({
      vrn: decoded.vrn,
      hmrcAccessToken: access_token,
      hmrcRefreshToken: refresh_token || decoded.hmrcRefreshToken,
      expiresAt: Date.now() + (expires_in * 1000)
    }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
    
    res.json({ token: newToken });
    
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if HMRC token is expired
    if (decoded.expiresAt < Date.now()) {
      return res.status(401).json({ error: 'HMRC token expired', needsRefresh: true });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Get current user info
router.get('/me', verifyToken, (req, res) => {
  res.json({
    vrn: req.user.vrn,
    expiresAt: req.user.expiresAt,
    authenticated: true
  });
});

module.exports = router;
module.exports.verifyToken = verifyToken;