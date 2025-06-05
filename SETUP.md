# ZapVAT Setup Guide

## Prerequisites

- Node.js 16+ and npm
- HMRC Developer Account
- VAT Registration Number for testing

## 1. HMRC Developer Setup

1. Go to [HMRC Developer Hub](https://developer.service.hmrc.gov.uk/)
2. Create an account and sign in
3. Create a new application:
   - **Application name**: ZapVAT
   - **Environment**: Sandbox (for testing)
   - **API subscriptions**: VAT (MTD)
4. Note your `Client ID` and `Client Secret`

## 2. Environment Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` with your HMRC credentials:
```bash
# HMRC API Configuration
HMRC_CLIENT_ID=your_client_id_from_hmrc
HMRC_CLIENT_SECRET=your_client_secret_from_hmrc

# JWT Configuration (generate a secure random string)
JWT_SECRET=your_secure_jwt_secret_at_least_32_characters_long

# Server Configuration
PORT=3000
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Start the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## 5. Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 6. Testing with HMRC Sandbox

1. Use test VRN: `123456789` (or any 9-digit number)
2. The sandbox doesn't require real OAuth - it simulates the flow
3. Check the [HMRC API documentation](https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-api) for test scenarios

## API Endpoints

### Authentication
- `GET /api/auth/login?vrn={vrn}` - Initiate OAuth flow
- `GET /api/auth/callback` - OAuth callback handler
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info

### VAT Operations
- `GET /api/vat/obligations` - Get VAT obligations
- `POST /api/vat/returns` - Submit VAT return
- `GET /api/vat/returns/{periodKey}` - View VAT return
- `GET /api/vat/liabilities` - Get VAT liabilities
- `GET /api/vat/payments` - Get VAT payments
- `GET /api/vat/penalties` - Get VAT penalties
- `GET /api/vat/financial-details/{chargeRef}` - Get financial details

## Frontend Integration

The frontend uses the `ZapVATClient` class:

```javascript
// Initialize (done automatically)
const api = window.zapVAT;

// Login
const { authUrl } = await api.initiateLogin('123456789');
window.location.href = authUrl;

// Get obligations
const obligations = await api.getObligations({
  from: '2023-01-01',
  to: '2023-12-31'
});

// Submit return
const result = await api.submitReturn({
  periodKey: 'A001',
  vatDueSales: 100.00,
  // ... other fields
  finalised: true
});
```

## Troubleshooting

### Common Issues

1. **"Client ID not found"**
   - Check your `.env` file has correct HMRC credentials
   - Ensure you've subscribed to VAT (MTD) API in HMRC Developer Hub

2. **"Invalid redirect URI"**
   - In HMRC Developer Hub, set redirect URI to: `http://localhost:3000/api/auth/callback`

3. **CORS errors**
   - The backend handles CORS - don't call HMRC API directly from frontend

4. **Token expired**
   - The client automatically refreshes tokens
   - If refresh fails, user will be redirected to login

### Development Tips

1. Use browser dev tools to check network requests
2. Check server logs for detailed error messages
3. Use HMRC sandbox test scenarios (see `vat-api-spec.yaml`)
4. Test with different Gov-Test-Scenario headers

## Production Deployment

1. Change environment variables:
   ```bash
   NODE_ENV=production
   HMRC_BASE_URL_PRODUCTION=https://api.service.hmrc.gov.uk
   ```

2. Update redirect URI in HMRC Developer Hub to your production domain

3. Use environment variables for secrets (don't commit `.env`)

4. Consider using Redis for OAuth state storage instead of in-memory Map

## Security Notes

- Never expose HMRC client secret in frontend
- Use HTTPS in production
- Implement proper session management
- Validate all user inputs
- Consider rate limiting per user
- Log security events