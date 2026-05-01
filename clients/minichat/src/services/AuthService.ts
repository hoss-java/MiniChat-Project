import { apiClient } from './ApiClient';

export class AuthService {
  /**
   * login(username, password)
   * Authenticates user with username and password
   * Calls backend POST /auth/login through ApiClient
   * 
   * @param username - User's username
   * @param password - User's password
   * @returns Promise with accessToken, refreshToken, and user data
   * @throws {ApiError} On authentication failure
   */
  async login(username: string, password: string): Promise<any> {
    return apiClient.post('/auth/login', { username, password });
  }

  /**
   * register(email, username, password, passwordConfirm)
   * Registers new user with email, username, and password
   * Calls backend POST /auth/register through ApiClient
   * 
   * @param email - User's email address
   * @param username - User's desired username
   * @param password - User's password
   * @param passwordConfirm - Password confirmation
   * @returns Promise with accessToken and user data
   * @throws {ApiError} On validation or duplicate user failure
   */
  async register(email: string, username: string, password: string, passwordConfirm: string): Promise<any> {
    return apiClient.post('/auth/register', { email, username, password, passwordConfirm });
  }

  /**
   * getProfile()
   * Retrieves current authenticated user's profile
   * Calls backend GET /auth/me through ApiClient
   * 
   * @returns Promise with User object (id, username, email, publicKey, fingerprint, createdAt)
   * @throws {ApiError} On unauthorized or server error
   */
  async getProfile(): Promise<any> {
    return apiClient.get('/auth/me');
  }

  /**
   * updateProfile(data)
   * Updates current user's profile information
   * Calls backend PUT /auth/profile through ApiClient
   * 
   * @param username - User's username
   * @param email - User's email address
   * @returns Promise with updated User object
   * @throws {ApiError} On validation or unauthorized failure
   */
  async updateProfile(username: string, email: string): Promise<any> {
    return apiClient.put('/auth/profile', { username, email });
  }

  /**
   * refreshTokenRequest(refreshToken)
   * Exchanges refresh token for new access token
   * Calls backend POST /auth/refresh through ApiClient
   * 
   * @param refreshToken - Valid refresh token from previous login
   * @returns Promise with new accessToken and refreshToken
   * @throws {ApiError} On invalid or expired refresh token
   */
  async refreshTokenRequest(refreshToken: string): Promise<any> {
    return apiClient.post(`/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`, {});
  }
}

export const authService = new AuthService();
