/**
 * ZapVAT API Client
 * Frontend JavaScript client for communicating with ZapVAT backend API
 */

class ZapVATClient {
  constructor() {
    this.baseURL = window.location.origin;
    this.token = this.getStoredToken();
    this.apiBase = `${this.baseURL}/api`;
  }

  // Token management
  getStoredToken() {
    return localStorage.getItem('zapvat_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('zapvat_token', token);
    } else {
      localStorage.removeItem('zapvat_token');
    }
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.apiBase}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle token refresh if needed
        if (response.status === 401 && data.needsRefresh) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the original request
            headers['Authorization'] = `Bearer ${this.token}`;
            const retryResponse = await fetch(url, { ...config, headers });
            return await retryResponse.json();
          } else {
            this.handleAuthError();
            throw new Error('Authentication failed');
          }
        }
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication methods
  async initiateLogin(vrn) {
    try {
      const response = await this.request(`/auth/login?vrn=${encodeURIComponent(vrn)}`);
      return response;
    } catch (error) {
      throw new Error(`Login initiation failed: ${error.message}`);
    }
  }

  async refreshToken() {
    if (!this.token) return false;

    try {
      const response = await this.request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ token: this.token })
      });
      
      this.setToken(response.token);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.setToken(null);
      return false;
    }
  }

  async getCurrentUser() {
    try {
      return await this.request('/auth/me');
    } catch (error) {
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  handleAuthError() {
    this.setToken(null);
    // Redirect to login or show login modal
    window.location.reload();
  }

  // VAT API methods
  async getObligations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/vat/obligations${queryString ? `?${queryString}` : ''}`;
    
    try {
      return await this.request(endpoint);
    } catch (error) {
      throw new Error(`Failed to fetch obligations: ${error.message}`);
    }
  }

  async submitReturn(vatReturn) {
    try {
      return await this.request('/vat/returns', {
        method: 'POST',
        body: JSON.stringify(vatReturn)
      });
    } catch (error) {
      throw new Error(`Failed to submit VAT return: ${error.message}`);
    }
  }

  async getReturn(periodKey) {
    try {
      return await this.request(`/vat/returns/${encodeURIComponent(periodKey)}`);
    } catch (error) {
      throw new Error(`Failed to fetch VAT return: ${error.message}`);
    }
  }

  async getLiabilities(from, to) {
    const params = new URLSearchParams({ from, to });
    
    try {
      return await this.request(`/vat/liabilities?${params.toString()}`);
    } catch (error) {
      throw new Error(`Failed to fetch liabilities: ${error.message}`);
    }
  }

  async getPayments(from, to) {
    const params = new URLSearchParams({ from, to });
    
    try {
      return await this.request(`/vat/payments?${params.toString()}`);
    } catch (error) {
      throw new Error(`Failed to fetch payments: ${error.message}`);
    }
  }

  async getPenalties() {
    try {
      return await this.request('/vat/penalties');
    } catch (error) {
      throw new Error(`Failed to fetch penalties: ${error.message}`);
    }
  }

  async getFinancialDetails(chargeReference) {
    try {
      return await this.request(`/vat/financial-details/${encodeURIComponent(chargeReference)}`);
    } catch (error) {
      throw new Error(`Failed to fetch financial details: ${error.message}`);
    }
  }

  // Utility methods
  isAuthenticated() {
    return !!this.token;
  }

  logout() {
    this.setToken(null);
    window.location.reload();
  }

  // Handle URL parameters (for OAuth callback)
  handleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const status = urlParams.get('status');
    const message = urlParams.get('message');

    if (token && status === 'success') {
      this.setToken(token);
      // Clean up URL
      window.history.replaceState({}, document.title, '/');
      return { success: true };
    } else if (status === 'error') {
      return { success: false, error: message || 'Authentication failed' };
    }

    return null;
  }
}

// Global instance
window.zapVAT = new ZapVATClient();

// Handle auth callback on page load
document.addEventListener('DOMContentLoaded', () => {
  const authResult = window.zapVAT.handleAuthCallback();
  
  if (authResult) {
    if (authResult.success) {
      console.log('Authentication successful');
      // You can trigger UI updates here
      window.dispatchEvent(new CustomEvent('zapvat:authenticated'));
    } else {
      console.error('Authentication failed:', authResult.error);
      alert(`Authentication failed: ${authResult.error}`);
    }
  }
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZapVATClient;
}