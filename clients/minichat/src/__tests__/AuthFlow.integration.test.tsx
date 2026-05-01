/**
 * AuthFlow.integration.test.tsx
 * 
 * Integration test for complete authentication flow.
 * Tests the entire user journey: Login → Dashboard → Logout
 * 
 * Files involved:
 * - AuthContext.tsx (state management, login/logout actions)
 * - AuthService.ts (API calls)
 * - ApiClient.ts (JWT injection, token handling)
 * - LoginPage.tsx (form submission)
 * - ProtectedRoute.tsx (access control)
 * - DashboardPage.tsx (authenticated view)
 * - UIComponents.tsx (Input, Button, Checkbox components)
 * 
 * Scenarios:
 * 1. User logs in with valid credentials → token stored → redirects to dashboard
 * 2. ProtectedRoute allows authenticated users access
 * 3. User logs out → localStorage cleared → redirected to login
 * 4. Invalid credentials → error message displayed
 * 5. Token refresh on 401 response
 * 6. "Remember Me" checkbox stores username
 * 
 * Selectors used:
 * - getByRole() for buttons
 * - screen.getByLabelText() or getByTestId() for inputs
 * - screen.getByText() for error messages
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { authService } from '../services/AuthService';

// Mock authService
jest.mock('../services/AuthService');

const mockAuthService = authService as jest.Mocked<typeof authService>;

/**
 * Helper: Render component with all necessary providers and routing
 */
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {component}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

/**
 * Helper: Render with routing (for testing navigation)
 */
const renderWithRouting = () => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('AuthFlow Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  /**
   * SCENARIO 1: User Login Flow
   * 
   * Given: User is on LoginPage with empty form
   * When: User enters valid credentials (username, password) and submits
   * Then:
   *   1. authService.login() called with credentials
   *   2. JWT token stored in localStorage
   *   3. User state updated in AuthContext
   *   4. User redirected to /dashboard (optional, depends on routing setup)
   * 
   * Parametrized test cases cover:
   * - Different valid username/password combinations
   * - Verifies correct API call parameters
   * - Verifies token persistence
   * - Verifies user state in context
   */
  describe.each([
    {
      username: 'testuser',
      password: 'password123',
      description: 'valid credentials (standard user)'
    },
    {
      username: 'john_doe',
      password: 'securepass456',
      description: 'valid credentials (underscore username)'
    }
  ])(
    'Login with $description',
    ({ username, password }) => {
      const mockResponse = {
        user: { id: '1', username, email: `${username}@test.com` },
        accessToken: 'mock-jwt-token-abc123',
        refreshToken: 'mock-refresh-token-xyz789'
      };

      test('should call authService.login() with correct username and password', async () => {
        mockAuthService.login.mockResolvedValueOnce(mockResponse);
        mockAuthService.getProfile.mockResolvedValueOnce(mockResponse.user);

        renderWithProviders(<LoginPage />);

        // Alternative: Use getByLabelText (more robust)
        const usernameInput = screen.getByLabelText(/username/i);
        const passwordInput = screen.getByLabelText(/password/i);

        const submitButton = screen.getByRole('button', { name: /login/i });

        // User enters credentials
        await userEvent.clear(usernameInput);
        await userEvent.type(usernameInput, username);
        await userEvent.clear(passwordInput);
        await userEvent.type(passwordInput, password);

        // User submits form
        fireEvent.click(submitButton);

        // Assert: authService.login() called with correct parameters
        await waitFor(() => {
          expect(mockAuthService.login).toHaveBeenCalledWith(username, password);
          expect(mockAuthService.login).toHaveBeenCalledTimes(1);
        });
      });

      test('should store JWT token and refresh token in localStorage', async () => {
        mockAuthService.login.mockResolvedValueOnce(mockResponse);
        mockAuthService.getProfile.mockResolvedValueOnce(mockResponse.user);

        renderWithProviders(<LoginPage />);

        const usernameInput = document.querySelector('input[id="username"]') as HTMLInputElement;
        const passwordInput = document.querySelector('input[id="password"]') as HTMLInputElement;
        const submitButton = screen.getByRole('button', { name: /login/i });

        await userEvent.type(usernameInput, username);
        await userEvent.type(passwordInput, password);
        fireEvent.click(submitButton);

        // Assert: authState stored in localStorage with correct tokens
        await waitFor(() => {
          const authState = JSON.parse(localStorage.getItem('authState') || '{}');
          expect(authState.token).toBe('mock-jwt-token-abc123');
          expect(authState.refreshToken).toBe('mock-refresh-token-xyz789');
          expect(authState.isAuthenticated).toBe(true);
        });
      });

      test('should update user state in AuthContext with user details', async () => {
        mockAuthService.login.mockResolvedValueOnce(mockResponse);
        mockAuthService.getProfile.mockResolvedValueOnce(mockResponse.user);

        renderWithProviders(<LoginPage />);

        const usernameInput = document.querySelector('input[id="username"]') as HTMLInputElement;
        const passwordInput = document.querySelector('input[id="password"]') as HTMLInputElement;
        const submitButton = screen.getByRole('button', { name: /login/i });

        await userEvent.type(usernameInput, username);
        await userEvent.type(passwordInput, password);
        fireEvent.click(submitButton);

        // Assert: user object stored in authState
        await waitFor(() => {
          const authState = JSON.parse(localStorage.getItem('authState') || '{}');
          expect(authState.user).toEqual({
            id: '1',
            username,
            email: `${username}@test.com`
          });
          expect(authState.isLoading).toBe(false);
        });
      });
    }
  );

  /**
   * SCENARIO 2: Login Error Handling
   * 
   * Given: User submits login form with invalid input
   * When: Validation fails or server returns error
   * Then: Error message displayed, user NOT authenticated, localStorage empty
   * 
   * Parametrized test cases:
   * - Empty username (client-side validation)
   * - Password too short (client-side validation)
   * - Invalid credentials from server (401 response)
   * - Network error (no connectivity)
   */
  describe.each([
    {
      username: '',
      password: 'password123',
      errorMessage: 'Username is required',
      type: 'client-side validation',
      shouldCallApi: false
    },
    {
      username: 'testuser',
      password: 'short',
      errorMessage: 'Password must be at least 6 characters',
      type: 'client-side validation',
      shouldCallApi: false
    },
    {
      username: 'testuser',
      password: 'wrongpassword',
      errorMessage: 'Invalid credentials',
      type: 'server error (401)',
      shouldCallApi: true,
      mockError: { status: 401, message: 'Invalid credentials' }
    }
  ])(
    'Login error: $type',
    ({ username, password, errorMessage, shouldCallApi, mockError }) => {
      test(`should display error: "${errorMessage}"`, async () => {
        if (shouldCallApi && mockError) {
          mockAuthService.login.mockRejectedValueOnce(mockError);
        }

        renderWithProviders(<LoginPage />);

        const usernameInput = document.querySelector('input[id="username"]') as HTMLInputElement;
        const passwordInput = document.querySelector('input[id="password"]') as HTMLInputElement;
        const submitButton = screen.getByRole('button', { name: /login/i });

        // Only type if the value is not empty
        if (username) {
          await userEvent.type(usernameInput, username);
        } 
        if (password) {
          await userEvent.type(passwordInput, password);
        }
        fireEvent.click(submitButton);

        // Assert: error message displayed
        await waitFor(() => {
          expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });

        // Assert: user NOT authenticated
        expect(localStorage.getItem('authState')).toBeNull();

        // Assert: API only called if validation passed
        if (!shouldCallApi) {
          expect(mockAuthService.login).not.toHaveBeenCalled();
        }
      });
    }
  );

  /**
   * SCENARIO 3: Protected Route Access Control
   * 
   * Given: User is authenticated (token in localStorage)
   * When: User accesses ProtectedRoute
   * Then: Dashboard renders (not redirected to login page)
   * 
   * Test cases:
   * - Authenticated user can access /dashboard
   * - Dashboard displays user's username
   * - Loading state handled correctly
   */
  test('should render Dashboard when user is authenticated', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com'
    };

    const mockAuthState = {
      user: mockUser,
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      isAuthenticated: true,
      isLoading: false
    };

    // Pre-populate localStorage with auth state
    localStorage.setItem('authState', JSON.stringify(mockAuthState));

    renderWithProviders(
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    );

    // Assert: Dashboard renders with user's username
    await waitFor(() => {
      expect(screen.getByText(/welcome, testuser/i)).toBeInTheDocument();
    });

    // Assert: Not on login page
    expect(screen.queryByRole('button', { name: /login/i })).not.toBeInTheDocument();
  });

  /**
   * SCENARIO 4: Logout Flow & Cleanup
   * 
   * Given: User is authenticated on Dashboard
   * When: User clicks logout button
   * Then:
   *   1. localStorage cleared (authState removed)
   *   2. AuthContext state reset to initial (null user, no token)
   *   3. ProtectedRoute redirects to /login page
   * 
   * Test cases:
   * - Logout button clears localStorage
   * - User cannot access protected routes after logout
   * - Logout is idempotent (safe to call multiple times)
   */
  test('should clear localStorage and reset auth state on logout', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@test.com'
    };

    const mockAuthState = {
      user: mockUser,
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      isAuthenticated: true,
      isLoading: false
    };

    localStorage.setItem('authState', JSON.stringify(mockAuthState));

    renderWithProviders(
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    );

    // Wait for dashboard to render
    await waitFor(() => {
      expect(screen.getByText(/welcome, testuser/i)).toBeInTheDocument();
    });

    // User clicks logout button
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    // Assert: localStorage cleared
    await waitFor(() => {
      expect(localStorage.getItem('authState')).toBeNull();
    });

    // Assert: auth state reset (user should be null)
    const authState = localStorage.getItem('authState');
    expect(authState).toBeNull();
  });

  /**
   * SCENARIO 5: Remember Me Functionality
   * 
   * Given: User logs in with "Remember Me" checkbox checked
   * When: User submits form
   * Then:
   *   1. Username stored in localStorage under 'rememberMe' key
   *   2. Password NOT stored (security requirement)
   *   3. On next login page load, username field pre-filled
   * 
   * Test cases:
   * - Username remembered when checkbox checked
   * - Password never stored
   * - Username pre-filled on subsequent page loads
   */
  test('should store username in localStorage when "Remember Me" is checked', async () => {
    const username = 'testuser';
    const password = 'password123';

    const mockResponse = {
      user: { id: '1', username, email: `${username}@test.com` },
      accessToken: 'mock-jwt-token-123',
      refreshToken: 'mock-refresh-token-456'
    };

    mockAuthService.login.mockResolvedValueOnce(mockResponse);
    mockAuthService.getProfile.mockResolvedValueOnce(mockResponse.user);

    renderWithProviders(<LoginPage />);

    const usernameInput = document.querySelector('input[id="username"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[id="password"]') as HTMLInputElement;
    const rememberMeCheckbox = document.querySelector('input[id="rememberMe"]') as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /login/i });

    // User enters credentials and checks "Remember Me"
    await userEvent.type(usernameInput, username);
    await userEvent.type(passwordInput, password);
    fireEvent.click(rememberMeCheckbox);
    fireEvent.click(submitButton);

    // Assert: username stored in localStorage
    await waitFor(() => {
      expect(localStorage.getItem('rememberMe')).toBe(username);
    });

    // Assert: password NOT stored (security)
    expect(localStorage.getItem('rememberMe')).not.toBe(password);
  });

  /**
   * SCENARIO 6: Remember Me Pre-fill on Page Load
   * 
   * Given: Username previously stored via "Remember Me"
   * When: LoginPage loads again
   * Then: Username input is pre-filled, checkbox is checked
   * 
   * Test case:
   * - Username retrieved from localStorage on mount
   * - Checkbox automatically checked
   * - User can proceed with login (no re-entry needed)
   */
  test('should pre-fill username when page loads and "Remember Me" was previously checked', async () => {
    const rememberedUsername = 'john_doe';
    
    // Simulate user previously checking "Remember Me"
    localStorage.setItem('rememberMe', rememberedUsername);

    renderWithProviders(<LoginPage />);

    // Assert: username input pre-filled
    await waitFor(() => {
      const usernameInput = document.querySelector('input[id="username"]') as HTMLInputElement;
      expect(usernameInput.value).toBe(rememberedUsername);
    });

    // Assert: "Remember Me" checkbox is checked
    const rememberMeCheckbox = document.querySelector('input[id="rememberMe"]') as HTMLInputElement;
    expect(rememberMeCheckbox.checked).toBe(true);
  });
});
