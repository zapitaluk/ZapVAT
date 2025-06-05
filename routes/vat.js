const express = require('express');
const axios = require('axios');
const hmrcConfig = require('../config/hmrc');
const { verifyToken } = require('./auth');

const router = express.Router();

// Apply authentication to all VAT routes
router.use(verifyToken);

// Helper function to make HMRC API calls
const callHMRCAPI = async (endpoint, method = 'GET', data = null, headers = {}, user) => {
  const url = `${hmrcConfig.baseUrl}${endpoint.replace('{vrn}', user.vrn)}`;
  
  const config = {
    method,
    url,
    headers: {
      'Authorization': `Bearer ${user.hmrcAccessToken}`,
      'Accept': 'application/vnd.hmrc.1.0+json',
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Get VAT obligations
router.get('/obligations', async (req, res) => {
  try {
    const { from, to, status } = req.query;
    
    let endpoint = hmrcConfig.endpoints.obligations;
    const params = new URLSearchParams();
    
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (status) params.append('status', status);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    const response = await callHMRCAPI(endpoint, 'GET', null, {}, req.user);
    res.json(response.data);
    
  } catch (error) {
    console.error('Obligations API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch VAT obligations',
      details: error.response?.data || error.message
    });
  }
});

// Submit VAT return
router.post('/returns', async (req, res) => {
  try {
    const vatReturn = req.body;
    
    // Validate required fields
    const requiredFields = [
      'periodKey', 'vatDueSales', 'vatDueAcquisitions', 'totalVatDue',
      'vatReclaimedCurrPeriod', 'netVatDue', 'totalValueSalesExVAT',
      'totalValuePurchasesExVAT', 'totalValueGoodsSuppliedExVAT',
      'totalAcquisitionsExVAT', 'finalised'
    ];
    
    for (const field of requiredFields) {
      if (vatReturn[field] === undefined || vatReturn[field] === null) {
        return res.status(400).json({
          error: `Missing required field: ${field}`
        });
      }
    }
    
    const response = await callHMRCAPI(
      hmrcConfig.endpoints.submitReturn, 
      'POST', 
      vatReturn,
      {},
      req.user
    );
    
    res.status(201).json(response.data);
    
  } catch (error) {
    console.error('Submit return API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to submit VAT return',
      details: error.response?.data || error.message
    });
  }
});

// View VAT return
router.get('/returns/:periodKey', async (req, res) => {
  try {
    const { periodKey } = req.params;
    
    const endpoint = hmrcConfig.endpoints.viewReturn
      .replace('{periodKey}', encodeURIComponent(periodKey));
    
    const response = await callHMRCAPI(endpoint, 'GET', null, {}, req.user);
    res.json(response.data);
    
  } catch (error) {
    console.error('View return API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch VAT return',
      details: error.response?.data || error.message
    });
  }
});

// Get VAT liabilities
router.get('/liabilities', async (req, res) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({
        error: 'Both from and to date parameters are required'
      });
    }
    
    let endpoint = `${hmrcConfig.endpoints.liabilities}?from=${from}&to=${to}`;
    
    const response = await callHMRCAPI(endpoint, 'GET', null, {}, req.user);
    res.json(response.data);
    
  } catch (error) {
    console.error('Liabilities API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch VAT liabilities',
      details: error.response?.data || error.message
    });
  }
});

// Get VAT payments
router.get('/payments', async (req, res) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({
        error: 'Both from and to date parameters are required'
      });
    }
    
    let endpoint = `${hmrcConfig.endpoints.payments}?from=${from}&to=${to}`;
    
    const response = await callHMRCAPI(endpoint, 'GET', null, {}, req.user);
    res.json(response.data);
    
  } catch (error) {
    console.error('Payments API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch VAT payments',
      details: error.response?.data || error.message
    });
  }
});

// Get VAT penalties
router.get('/penalties', async (req, res) => {
  try {
    const response = await callHMRCAPI(hmrcConfig.endpoints.penalties, 'GET', null, {}, req.user);
    res.json(response.data);
    
  } catch (error) {
    console.error('Penalties API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch VAT penalties',
      details: error.response?.data || error.message
    });
  }
});

// Get financial details
router.get('/financial-details/:chargeReference', async (req, res) => {
  try {
    const { chargeReference } = req.params;
    
    const endpoint = hmrcConfig.endpoints.financialDetails
      .replace('{penaltyChargeReference}', encodeURIComponent(chargeReference));
    
    const response = await callHMRCAPI(endpoint, 'GET', null, {}, req.user);
    res.json(response.data);
    
  } catch (error) {
    console.error('Financial details API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch financial details',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;