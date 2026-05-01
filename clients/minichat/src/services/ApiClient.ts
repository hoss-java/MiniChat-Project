/**
 * ApiClient.ts
 * 
 * HTTP client for making requests to backend through proxy
 * Handles JWT token injection, 401 refresh retry logic, and error handling
 * All API calls in the app should use this client
 */
import { API_CONFIG } from '../config/apiConfig';

/**
 * ApiClientConfig interface
 * Configuration options for ApiClient initialization
 */
interface ApiClientConfig {
  proxyURL?: string;
  timeout?: number;
}

/**
 * ApiClient class
 * Manages all HTTP requests through proxy.php
 * Automatically injects JWT token, handles token refresh on 401
 */
export class ApiClient {
  private proxyURL: string;
  private timeout: number;
  private maxRetries: number = 3;
  private authService: any = null;

  /**
   * Constructor
   * @param config - Configuration with proxyURL and timeout
   */
  constructor(config: ApiClientConfig = {}) {
    this.proxyURL = config.proxyURL || API_CONFIG.proxyURL;
    this.timeout = config.timeout || API_CONFIG.timeout;
  }

  /**
   * setAuthService(authService)
   * Inject auth service so we can get token and refresh on 401
   * @param authService - Auth context/service with token and refresh logic
   */
  setAuthService(authService: any): void {
    this.authService = authService;
  }

  /**
   * request(method, endpoint, data, retryAttempt)
   * Core method for all HTTP requests through proxy
   * Handles JWT injection, 401 retry with refresh, and errors
   * 
   * @param method - HTTP method (GET, POST, PUT, DELETE, PATCH)
   * @param endpoint - Backend endpoint path (e.g., '/auth/login')
   * @param data - Request body data (for POST, PUT, PATCH)
   * @param retryAttempt - Current retry count (internal use)
   * @returns Response data from backend
   */
  async request(
    method: string,
    endpoint: string,
    data: any = null,
    retryAttempt: number = 0
  ): Promise<any> {
    const proxyUrl = `${this.proxyURL}?path=${encodeURIComponent(endpoint)}`;

    // Get token from authService OR localStorage as fallback
    const token = this.authService?.state?.token || 
    JSON.parse(localStorage.getItem('authState') || '{}').token;

    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data && ['POST', 'PUT', 'PATCH'].includes(method) 
        ? JSON.stringify(data) 
        : null,
    };

    // Inject JWT token if available
    if (this.authService?.state?.token) {
      (options.headers as any)['Authorization'] = `Bearer ${this.authService.state.token}`;
    }

    try {
      const response = await fetch(proxyUrl, options);

      // 204 No Content response
      if (response.status === 204) {
        return { success: true };
      }

      const responseData = await response.json();

      // Handle 401 Unauthorized (token expired)
      if (response.status === 401 && this.authService) {
        // No token at all, force logout
        if (!this.authService.state?.token) {
          await this.authService.logout();
          throw new Error('Session expired. Please login again.');
        }

        // Max retries exceeded
        if (retryAttempt >= this.maxRetries) {
          await this.authService.logout();
          throw new Error(`Session expired after ${this.maxRetries} retries. Please login again.`);
        }

        // Try to refresh token and retry request
        try {
          await this.authService.refreshToken();
          return this.request(method, endpoint, data, retryAttempt + 1);
        } catch (refreshError) {
          await this.authService.logout();
          throw new Error(`Session expired. Please login again.`);
        }
      }

      // Handle other HTTP errors
      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `HTTP ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error(`[ApiClient] ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * get(endpoint)
   * Shortcut for GET request
   */
  async get(endpoint: string): Promise<any> {
    return this.request('GET', endpoint);
  }

  /**
   * post(endpoint, data)
   * Shortcut for POST request
   */
  async post(endpoint: string, data: any): Promise<any> {
    return this.request('POST', endpoint, data);
  }

  /**
   * put(endpoint, data)
   * Shortcut for PUT request
   */
  async put(endpoint: string, data: any): Promise<any> {
    return this.request('PUT', endpoint, data);
  }

  /**
   * delete(endpoint)
   * Shortcut for DELETE request
   */
  async delete(endpoint: string): Promise<any> {
    return this.request('DELETE', endpoint);
  }

  /**
   * patch(endpoint, data)
   * Shortcut for PATCH request
   */
  async patch(endpoint: string, data: any): Promise<any> {
    return this.request('PATCH', endpoint, data);
  }
}

/**
 * Create singleton instance of ApiClient
 * Import this in your app to use
 */
export const apiClient = new ApiClient({ timeout: 5000 });
