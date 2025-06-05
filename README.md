# ZapVAT

A project for VAT (Value Added Tax) management and processing, integrating with HMRC's Making Tax Digital (MTD) for VAT API.

## Overview

ZapVAT is designed to streamline VAT calculations and compliance processes by providing a modern interface to HMRC's VAT (MTD) API. The system handles VAT obligations, returns submission, payments tracking, and penalties management.

## API Integration

This project integrates with the HMRC VAT (MTD) API v1.0, providing access to:

### Core Endpoints
- **Retrieve VAT obligations** - Get quarterly/monthly VAT obligations and their status
- **Submit VAT return for period** - Submit 9-box VAT returns for compliance
- **View VAT Return** - Retrieve previously submitted VAT returns
- **Retrieve VAT liabilities** - Get outstanding VAT charges
- **Retrieve VAT payments** - View payment history
- **Retrieve VAT penalties** - Access late submission and payment penalty information
- **Retrieve financial details** - Get detailed financial information for penalty charges

### API Environments
- **Sandbox**: `https://test-api.service.hmrc.gov.uk`
- **Production**: `https://api.service.hmrc.gov.uk`

### Authentication
The API uses OAuth 2.0 with user-restricted endpoints requiring:
- `read:vat` scope for retrieving data
- `write:vat` scope for submitting returns

### Key Features
- **Obligations Management**: Track open and fulfilled VAT obligations
- **Returns Submission**: Submit VAT returns with comprehensive validation
- **Compliance Monitoring**: Monitor penalty points and late submission/payment penalties
- **Financial Tracking**: View liabilities, payments, and outstanding amounts
- **Test Scenarios**: Comprehensive sandbox testing capabilities

## Getting Started

Instructions for setup and usage will be added as the project develops.

## Contributing

Contributions are welcome. Please follow the project's coding standards and submit pull requests for review.

## License

License information will be added as the project matures.