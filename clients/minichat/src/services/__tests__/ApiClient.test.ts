/**
 * ApiClient.test.ts
 * 
 * Unit tests for ApiClient HTTP client
 * Tests: JWT injection, 401 refresh retry, error handling, all HTTP methods
 */

import { ApiClient } from '../ApiClient';
import { API_CONFIG } from '../../config/apiConfig';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiClient', () => {
  let apiClient: ApiClient;
  let mockAuthService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    apiClient = new ApiClient({ timeout: 5000 });

    // Mock auth service with token and refresh logic
    mockAuthService = {
      state: {
        token: 'valid-jwt-token',
      },
      logout: jest.fn().mockResolvedValue(undefined),
      refreshToken: jest.fn().mockResolvedValue(undefined),
    };

    apiClient.setAuthService(mockAuthService);
  });

  // ==================== Constructor & Setup Tests ====================

  describe('Initialization', () => {
    /**
     * Scenario: ApiClient should use default config if none provided
     */
    test('should initialize with default config', () => {
      const client = new ApiClient();
      expect(client['proxyURL']).toBe(API_CONFIG.proxyURL);
      expect(client['timeout']).toBe(API_CONFIG.timeout);
    });

    /**
     * Scenario: ApiClient should accept custom config
     */
    test('should initialize with custom config', () => {
      const customConfig = { proxyURL: 'http://custom-proxy.com', timeout: 10000 };
      const client = new ApiClient(customConfig);
      expect(client['proxyURL']).toBe('http://custom-proxy.com');
      expect(client['timeout']).toBe(10000);
    });

    /**
     * Scenario: setAuthService should store auth service reference
     */
    test('should set auth service', () => {
      apiClient.setAuthService(mockAuthService);
      expect(apiClient['authService']).toBe(mockAuthService);
    });
  });

  // ==================== GET Request Tests ====================

  describe('GET Requests', () => {
    /**
     * Scenario: GET request should fetch data and return response
     */
    test('should make GET request and return data', async () => {
      const mockData = { id: 1, username: 'testuser' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => mockData,
      });

      const result = await apiClient.get('/auth/me');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('path=%2Fauth%2Fme'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockData);
    });

    /**
     * Scenario: GET request should inject JWT token in Authorization header
     */
    test('should inject JWT token in GET request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({}),
      });

      await apiClient.get('/auth/me');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers['Authorization']).toBe('Bearer valid-jwt-token');
    });

    /**
     * Scenario: GET request should work without token if auth service not set
     */
    test('should work without token if auth service not set', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const clientNoAuth = new ApiClient();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      await clientNoAuth.get('/public-endpoint');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  // ==================== POST Request Tests ====================

  describe('POST Requests', () => {
    /**
     * Scenario: POST request should send data in request body
     */
    test('should make POST request with data', async () => {
      const postData = { email: 'test@example.com', password: 'pass123' };
      const mockResponse = { token: 'new-jwt-token', userId: 1 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.post('/auth/login', postData);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].body).toBe(JSON.stringify(postData));
      expect(result).toEqual(mockResponse);
    });

    /**
     * Scenario: POST request should set Content-Type header
     */
    test('should set Content-Type header for POST', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({}),
      });

      await apiClient.post('/auth/login', {});

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].headers['Content-Type']).toBe('application/json');
    });
  });

  // ==================== PUT Request Tests ====================

  describe('PUT Requests', () => {
    /**
     * Scenario: PUT request should update resource and return response
     */
    test('should make PUT request with data', async () => {
      const updateData = { username: 'newname' };
      const mockResponse = { success: true, username: 'newname' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.put('/auth/profile', updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // ==================== DELETE Request Tests ====================

  describe('DELETE Requests', () => {
    /**
     * Scenario: DELETE request should remove resource
     */
    test('should make DELETE request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await apiClient.delete('/rooms/123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('path=%2Frooms%2F123'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual({ success: true });
    });
  });

  // ==================== PATCH Request Tests ====================

  describe('PATCH Requests', () => {
    /**
     * Scenario: PATCH request should partially update resource
     */
    test('should make PATCH request with data', async () => {
      const patchData = { status: 'online' };
      const mockResponse = { success: true, status: 'online' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.patch('/users/status', patchData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // ==================== 204 No Content Tests ====================

  describe('204 No Content Response', () => {
    /**
     * Scenario: 204 response should return success object without parsing body
     */
    test('should handle 204 No Content response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 204,
        ok: true,
        json: async () => ({}),
      });

      const result = await apiClient.delete('/rooms/123');

      expect(result).toEqual({ success: true });
    });
  });

  // ==================== 401 Unauthorized & Token Refresh Tests ====================

  describe('401 Unauthorized & Token Refresh', () => {
    /**
     * Scenario: 401 with valid token should attempt refresh and retry request
     */
    test('should refresh token on 401 and retry request', async () => {
      mockAuthService.refreshToken.mockResolvedValueOnce(undefined);

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          status: 401,
          ok: false,
          json: async () => ({ message: 'Token expired' }),
        })
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: async () => ({ id: 1, username: 'testuser' }),
        });

      const result = await apiClient.get('/auth/me');

      expect(mockAuthService.refreshToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ id: 1, username: 'testuser' });
    });

    /**
     * Scenario: 401 without token should force logout immediately
     */
    test('should logout if no token on 401', async () => {
      mockAuthService.state.token = null;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 401,
        ok: false,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(apiClient.get('/auth/me')).rejects.toThrow('Session expired. Please login again.');
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    /**
     * Scenario: 401 after max retries should logout and throw error
     */
    test('should logout after max retries on 401', async () => {
      // Set up so refresh always fails
      mockAuthService.refreshToken.mockRejectedValue(new Error('Refresh failed'));

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({ message: 'Token expired' }),
      });

      await expect(apiClient.get('/auth/me')).rejects.toThrow('Session expired. Please login again.');
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    /**
     * Scenario: Token refresh failure should logout and throw error
     */
    test('should logout if token refresh fails', async () => {
      mockAuthService.refreshToken.mockRejectedValueOnce(new Error('Refresh failed'));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 401,
        ok: false,
        json: async () => ({ message: 'Token expired' }),
      });

      await expect(apiClient.get('/auth/me')).rejects.toThrow('Session expired. Please login again.');
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  // ==================== Error Handling Tests ====================

  describe('Error Handling', () => {
    /**
     * Scenario: Non-200 response should throw error with backend message
     */
    test('should throw error on non-200 response with message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 400,
        ok: false,
        json: async () => ({ message: 'Invalid input' }),
      });

      await expect(apiClient.post('/auth/login', {})).rejects.toThrow('Invalid input');
    });

    /**
     * Scenario: Non-200 response without message should throw with error field
     */
    test('should throw error with error field if no message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 400,
        ok: false,
        json: async () => ({ error: 'Bad request' }),
      });

      await expect(apiClient.get('/invalid')).rejects.toThrow('Bad request');
    });

    /**
     * Scenario: Non-200 response with no message or error should throw HTTP status
     */
    test('should throw HTTP status if no message or error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 500,
        ok: false,
        json: async () => ({}),
      });

      await expect(apiClient.get('/invalid')).rejects.toThrow('HTTP 500');

      consoleSpy.mockRestore();
    });

    /**
     * Scenario: Network error should throw and log error
     */
    test('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(apiClient.get('/auth/me')).rejects.toThrow('Network timeout');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ApiClient] GET /auth/me:',
        networkError
      );

      consoleSpy.mockRestore();
    });
  });

  // ==================== Proxy URL Encoding Tests ====================

  describe('Proxy URL Handling', () => {
    /**
     * Scenario: Endpoint should be URL encoded in proxy path parameter
     */
    test('should properly encode endpoint in proxy URL', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({}),
      });

      await apiClient.get('/auth/me');

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('path=%2Fauth%2Fme');
    });

    /**
     * Scenario: Complex endpoint with parameters should be encoded
     */
    test('should encode complex endpoints with parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({}),
      });

      await apiClient.get('/rooms/123/messages?limit=10');

      const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(calledUrl).toContain('path=');
      expect(calledUrl).toContain('%2F');
    });
  });

  // ==================== Content-Type Header Tests ====================

  describe('Content-Type Header', () => {
    /**
     * Scenario: All requests should have Content-Type application/json
     */
    test('should set Content-Type for all requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({}),
      });

      const methods = [
        { name: 'get', args: ['/test'] },
        { name: 'post', args: ['/test', {}] },
        { name: 'put', args: ['/test', {}] },
        { name: 'delete', args: ['/test'] },
        { name: 'patch', args: ['/test', {}] },
      ];

      for (const method of methods) {
        await (apiClient as any)[method.name](...method.args);
      }

      for (const call of (global.fetch as jest.Mock).mock.calls) {
        expect(call[1].headers['Content-Type']).toBe('application/json');
      }
    });
  });

  // ==================== Request Body Tests ====================

  describe('Request Body Handling', () => {
    /**
     * Scenario: GET and DELETE should not have body
     */
    test('should not include body for GET and DELETE', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({}),
      });

      await apiClient.get('/test');
      await apiClient.delete('/test');

      const getCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call) => call[1].method === 'GET'
      );
      const deleteCalls = (global.fetch as jest.Mock).mock.calls.filter(
        (call) => call[1].method === 'DELETE'
      );

      expect(getCalls[0][1].body).toBeNull();
      expect(deleteCalls[0][1].body).toBeNull();
    });

    /**
     * Scenario: POST, PUT, PATCH should include stringified data in body
     */
    test('should include body for POST, PUT, PATCH', async () => {
      const testData = { username: 'test', email: 'test@example.com' };
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({}),
      });

      await apiClient.post('/test', testData);
      await apiClient.put('/test', testData);
      await apiClient.patch('/test', testData);

      const postCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) => call[1].method === 'POST'
      );
      const putCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) => call[1].method === 'PUT'
      );
      const patchCall = (global.fetch as jest.Mock).mock.calls.find(
        (call) => call[1].method === 'PATCH'
      );

      expect(postCall[1].body).toBe(JSON.stringify(testData));
      expect(putCall[1].body).toBe(JSON.stringify(testData));
      expect(patchCall[1].body).toBe(JSON.stringify(testData));
    });

    /**
     * Scenario: POST with null data should not include body
     */
    test('should not include body if data is null', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({}),
      });

      await apiClient.request('POST', '/test', null);

      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[1].body).toBeNull();
    });
  });
});
