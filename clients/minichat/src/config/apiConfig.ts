/**
 * apiConfig.ts
 * 
 * Global API configuration constants
 * Used by ApiClient to establish connection to backend
 * 
 * proxyURL: Endpoint for all backend requests (PHP proxy relay)
 * timeout: Request timeout in milliseconds
 */
export const API_CONFIG = {
  proxyURL: 'http://localhost:3280/sites/minichat/proxy.php',
  timeout: 5000,
};
