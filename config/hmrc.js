const config = {
  // HMRC API Configuration
  baseUrl: process.env.NODE_ENV === 'production' 
    ? process.env.HMRC_BASE_URL_PRODUCTION 
    : process.env.HMRC_BASE_URL_SANDBOX,
  
  clientId: process.env.HMRC_CLIENT_ID,
  clientSecret: process.env.HMRC_CLIENT_SECRET,
  redirectUri: process.env.HMRC_REDIRECT_URI,
  scope: process.env.HMRC_SCOPE || 'read:vat write:vat',
  
  // OAuth URLs
  authUrl: process.env.NODE_ENV === 'production'
    ? 'https://api.service.hmrc.gov.uk/oauth/authorize'
    : 'https://test-api.service.hmrc.gov.uk/oauth/authorize',
    
  tokenUrl: process.env.NODE_ENV === 'production'
    ? 'https://api.service.hmrc.gov.uk/oauth/token'
    : 'https://test-api.service.hmrc.gov.uk/oauth/token',
  
  // API Endpoints
  endpoints: {
    obligations: '/organisations/vat/{vrn}/obligations',
    submitReturn: '/organisations/vat/{vrn}/returns',
    viewReturn: '/organisations/vat/{vrn}/returns/{periodKey}',
    liabilities: '/organisations/vat/{vrn}/liabilities',
    payments: '/organisations/vat/{vrn}/payments',
    penalties: '/organisations/vat/{vrn}/penalties',
    financialDetails: '/organisations/vat/{vrn}/financial-details/{penaltyChargeReference}'
  },
  
  // Rate limiting (HMRC allows certain rates)
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 60 // 60 requests per minute
  }
};

module.exports = config;