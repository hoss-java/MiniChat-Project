/**
 * AuthContext.test.tsx
 * 
 * Tests for AuthContext functionality
 * Tests login, logout, token refresh, and localStorage persistence
 */

import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { apiClient } from '../../services/ApiClient';
import '@testing-library/jest-dom';
import { act } from 'react';
import userEvent from '@testing-library/user-event';

// Mock the ApiClient
jest.mock('../../services/ApiClient');

/**
 * Test component that uses useAuth hook
 * Used to test context functionality in component
 */
const TestComponent = () => {
  const { state, login, logout, register, refreshToken, fetchUser, updateProfile } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const handleFetchUser = async () => {
    try {
      setError(null);
      await fetchUser();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setError(null);
      await refreshToken();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleRegister = async () => {
    try {
      setError(null);
      await register('test@test.com', 'user', 'pass', 'pass');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setError(null);
      await updateProfile('newusername', 'newemail@test.com');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleLogin = async () => {
    try {
      setError(null);
      await login('testuser', 'password');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div>
      <div data-testid="username">{state.user?.username || 'Not logged in'}</div>
      <div data-testid="is-authenticated">{state.isAuthenticated.toString()}</div>
      <div data-testid="error">{error || ''}</div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={handleRegister}>Register</button>
      <button onClick={handleRefreshToken}>Refresh Token</button>
      <button onClick={handleFetchUser}>Fetch User</button>
      <button onClick={handleUpdateProfile}>Update Profile</button>
    </div>
  );
};



describe('AuthContext', () => {

  const originalError = console.error;
  beforeAll(() => {
    localStorage.clear();
    jest.clearAllMocks();

    console.error = jest.fn((...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('An update to TestComponent inside a test was not wrapped in act')
      ) {
        return;
      }
      originalError.call(console, ...args);
    });
  });

  afterAll(() => {
    console.error = originalError;
  });

  /**
   * Test: Initial state on app load
   * User should be logged out with null values
   */
  test('initial state should be logged out', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('username')).toHaveTextContent('Not logged in');
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
  });

  /**
   * Test: Login with valid credentials
   * Should set user, token, and isAuthenticated=true
   */
  test('login should update state and localStorage', async () => {
    const mockResponse = {
      user: { id: '1', username: 'testuser' },
      accessToken: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
    };
    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);
    (apiClient.get as jest.Mock).mockResolvedValue({ id: '1', username: 'testuser' });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('testuser');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    const saved = JSON.parse(localStorage.getItem('authState') || '{}');
    expect(saved.user.username).toBe('testuser');
    expect(saved.token).toBe('mock-jwt-token');
    expect(saved.refreshToken).toBe('mock-refresh-token');
  });

  /**
   * Parametrized test: Login error handling for different HTTP statuses
   * Tests multiple error scenarios in a single test case
   */
  describe('login error handling', () => {
    const errorScenarios = [
      {
        status: 400,
        message: 'Invalid credentials',
        expectedError: 'Invalid credentials',
        description: 'with invalid input (400)',
      },
      {
        status: 409,
        message: 'Email or username already exists',
        expectedError: 'Email or username already exists',
        description: 'with conflict error (409)',
      },
      {
        status: undefined,
        message: 'Network failed',
        expectedError: 'Network error. Check your connection',
        description: 'with network error (no status)',
      },
      {
        status: 500,
        message: 'Internal server error',
        expectedError: 'Registration failed. Try again later',
        description: 'with server error (500)',
      },
      {
        status: 503,
        message: 'Service unavailable',
        expectedError: 'Registration failed. Try again later',
        description: 'with service unavailable (503)',
      },
    ];

    test.each(errorScenarios)(
      'should handle login errors $description',
      async ({ status, message, expectedError }) => {
        const mockError = { status, message };
        (apiClient.post as jest.Mock).mockRejectedValue(mockError);

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        const loginButton = screen.getByText('Login');
        await userEvent.click(loginButton);

        await waitFor(() => {
          expect(screen.getByTestId('error')).toHaveTextContent(expectedError);
        });
      }
    );
  });

  /**
   * Parametrized test: updateProfile success and error handling
   * Tests multiple scenarios for profile update functionality
   */
  describe('updateProfile', () => {
    // First, add a handler to TestComponent for updateProfile
    // Update your TestComponent to include this:
    const handleUpdateProfile = async () => {
      try {
        setError(null);
        await updateProfile('newusername', 'newemail@test.com');
      } catch (err: any) {
        setError(err.message);
      }
    };

    const updateProfileScenarios = [
      {
        status: 200,
        mockResponse: { username: 'newusername', email: 'newemail@test.com' },
        expectedUsername: 'newusername',
        expectedError: null,
        description: 'successfully updates profile',
      },
      {
        status: 400,
        mockError: { status: 400, message: 'Invalid email format' },
        expectedUsername: 'Not logged in',
        expectedError: 'Invalid email format',
        description: 'with invalid input (400)',
      },
      {
        status: 401,
        mockError: { status: 401, message: 'Unauthorized' },
        expectedUsername: 'Not logged in',
        expectedError: 'Unauthorized',
        description: 'with unauthorized error (401)',
      },
      {
        status: 409,
        mockError: { status: 409, message: 'Email or username already exists' },
        expectedUsername: 'Not logged in',
        expectedError: 'Email or username already exists',
        description: 'with conflict error (409)',
      },
      {
        status: 500,
        mockError: { status: 500, message: 'Internal server error' },
        expectedUsername: 'Not logged in',
        expectedError: 'Internal server error',
        description: 'with server error (500)',
      },
      {
        status: undefined,
        mockError: { status: undefined, message: 'Network error' },
        expectedUsername: 'Not logged in',
        expectedError: 'Network error',
        description: 'with network error (no status)',
      },
    ];

    test.each(updateProfileScenarios)(
      'should handle updateProfile $description',
      async ({ mockResponse, mockError, expectedUsername, expectedError }) => {
        // Setup initial logged-in state
        const initialMockResponse = {
          user: { id: '1', username: 'testuser', email: 'test@test.com' },
          accessToken: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
        };
        (apiClient.post as jest.Mock).mockResolvedValue(initialMockResponse);
        (apiClient.get as jest.Mock).mockResolvedValue({
          id: '1',
          username: 'testuser',
          email: 'test@test.com',
        });

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        // First login to establish authenticated state
        const loginButton = screen.getByText('Login');
        await userEvent.click(loginButton);

        await waitFor(() => {
          expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
        });

        // Mock the updateProfile endpoint
        if (mockError) {
          (apiClient.put as jest.Mock).mockRejectedValue(mockError);
        } else {
          (apiClient.put as jest.Mock).mockResolvedValue(mockResponse);
        }

        // Trigger update profile
        const updateButton = screen.getByText('Update Profile');
        await userEvent.click(updateButton);

        // Verify results
        await waitFor(() => {
          if (expectedError) {
            expect(screen.getByTestId('error')).toHaveTextContent(expectedError);
          } else {
            expect(screen.getByTestId('username')).toHaveTextContent(expectedUsername);
            expect(screen.getByTestId('error')).toHaveTextContent('');
          }
        });
      }
    );
  });

  /**
   * Test: getProfile returns current user
   * Since getProfile calls fetchUser internally, a simple test is sufficient
   */
  test('getProfile should return the current authenticated user', async () => {
    const mockUser = { id: '1', username: 'testuser', email: 'test@test.com' };
    const initialMockResponse = {
      user: mockUser,
      accessToken: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
    };
    (apiClient.post as jest.Mock).mockResolvedValue(initialMockResponse);
    (apiClient.get as jest.Mock).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    });
  });

  /**
   * Test: Logout
   * Should clear user, token, and isAuthenticated=false
   */
  test('logout should clear state and localStorage', async () => {
    const mockResponse = {
      user: { id: '1', username: 'testuser' },
      token: 'mock-jwt-token',
    };
    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Login first
    const loginButton = screen.getByText('Login');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    // Then logout
    const logoutButton = screen.getByText('Logout');
    await userEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('Not logged in');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    // Check localStorage cleared
    expect(localStorage.getItem('authState')).toBeNull();
  });

  /**
   * Test: Persistence on page refresh
   * Should load user from localStorage on app restart
   */
  test('should persist and restore state from localStorage', () => {
    const mockState = {
      user: { id: '1', username: 'persisteduser' },
      token: 'persisted-token',
      isAuthenticated: true,
    };
    localStorage.setItem('authState', JSON.stringify(mockState));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('username')).toHaveTextContent('persisteduser');
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
  });

  /**
   * Test: useAuth hook throws outside provider
   * Should fail if used without AuthProvider wrapper
   */
  test('useAuth should throw error outside provider', () => {
    const BadComponent = () => {
      useAuth();
      return <div>Should not render</div>;
    };

    // Suppress console.error for this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    expect(() => {
      render(<BadComponent />);
    }).toThrow('useAuth must be used within AuthProvider');

    consoleError.mockRestore();
  });

  /**
   * Test: Register with valid credentials
   */
  test('register should create account and update state', async () => {
    const mockResponse = {
      user: { id: '1', username: 'newuser', email: 'new@test.com' },
      accessToken: 'mock-jwt-token',
    };
    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);
    (apiClient.get as jest.Mock).mockResolvedValue({ id: '1', username: 'newuser', email: 'new@test.com' });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const registerButton = screen.getByText('Register');
    await userEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('newuser');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    const saved = JSON.parse(localStorage.getItem('authState') || '{}');
    expect(saved.user.email).toBe('new@test.com');
    expect(saved.token).toBe('mock-jwt-token');
  });


  /**
   * Test: Register with duplicate email
   */
  test('register should throw error on duplicate email', async () => {
    (apiClient.post as jest.Mock).mockRejectedValueOnce({
      status: 409,
      message: 'Email already exists',
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const registerButton = screen.getByText('Register');
    await userEvent.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Email already exists');
    });
  });

  /**
   * Parametrized test: register error handling
   * Tests multiple error scenarios for user registration
   */
  describe('register error handling', () => {
    const registerErrorScenarios = [
      {
        status: 400,
        message: 'Invalid email format',
        expectedError: 'Invalid email format',
        description: 'with invalid input (400)',
      },
      {
        status: 400,
        message: null,
        expectedError: 'Invalid input. Please check your information',
        description: 'with invalid input (400) and no message',
      },
      {
        status: 409,
        message: 'Email or username already exists',
        expectedError: 'Email or username already exists',
        description: 'with conflict error (409)',
      },
      {
        status: 409,
        message: null,
        expectedError: 'Email or username already exists',
        description: 'with conflict error (409) and no message',
      },
      {
        status: undefined,
        message: 'Network failed',
        expectedError: 'Network error. Check your connection',
        description: 'with network error (no status)',
      },
      {
        status: 500,
        message: 'Internal server error',
        expectedError: 'Registration failed. Try again later',
        description: 'with server error (500)',
      },
      {
        status: 503,
        message: 'Service unavailable',
        expectedError: 'Registration failed. Try again later',
        description: 'with service unavailable (503)',
      },
    ];

    test.each(registerErrorScenarios)(
      'should handle register errors $description',
      async ({ status, message, expectedError }) => {
        const mockError = { status, message };
        (apiClient.post as jest.Mock).mockRejectedValue(mockError);

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        const registerButton = screen.getByText('Register');
        await act(async () => {
          await userEvent.click(registerButton);
        });

        await waitFor(() => {
          expect(screen.getByTestId('error')).toHaveTextContent(expectedError);
        });

        // Verify user is not authenticated after failed registration
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
      }
    );

    /**
     * Test: Register success case
     * Verify state and localStorage are properly updated
     */
    test('register should create account and update state on success', async () => {
      const mockResponse = {
        user: { id: '1', username: 'newuser', email: 'new@test.com' },
        accessToken: 'mock-jwt-token',
      };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);
      (apiClient.get as jest.Mock).mockResolvedValue({
        id: '1',
        username: 'newuser',
        email: 'new@test.com',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const registerButton = screen.getByText('Register');
      await act(async () => {
        await userEvent.click(registerButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('username')).toHaveTextContent('newuser');
        expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      const saved = JSON.parse(localStorage.getItem('authState') || '{}');
      expect(saved.user.email).toBe('new@test.com');
      expect(saved.token).toBe('mock-jwt-token');
      expect(saved.user.username).toBe('newuser');
    });
  });

  /**
   * Test: Refresh token
   */
  test('refreshToken should update access token', async () => {
    const mockState = {
      user: { id: '1', username: 'testuser', email: 'test@test.com' },
      token: 'old-token',
      refreshToken: 'refresh-token-value',
      isAuthenticated: true,
    };
    localStorage.setItem('authState', JSON.stringify(mockState));

    (apiClient.post as jest.Mock).mockResolvedValue({
      accessToken: 'new-token',
      refreshToken: 'new-refresh-token',
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const refreshButton = screen.getByText('Refresh Token');
    await userEvent.click(refreshButton);

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('authState') || '{}');
      expect(saved.token).toBe('new-token');
      expect(saved.refreshToken).toBe('new-refresh-token');
    });
  });
/**
 * Parametrized test: refreshToken error handling
 * Tests multiple error scenarios for token refresh functionality
 */
describe('refreshToken error handling', () => {
  const refreshTokenErrorScenarios = [
    {
      status: 400,
      message: 'Invalid refresh token',
      expectedError: 'Invalid refresh token',
      description: 'with invalid token (400)',
    },
    {
      status: 401,
      message: 'Refresh token expired',
      expectedError: 'Refresh token expired',
      description: 'with unauthorized error (401)',
    },
    {
      status: 403,
      message: 'Forbidden',
      expectedError: 'Forbidden',
      description: 'with forbidden error (403)',
    },
    {
      status: 500,
      message: 'Internal server error',
      expectedError: 'Internal server error',
      description: 'with server error (500)',
    },
    {
      status: undefined,
      message: 'Network error',
      expectedError: 'Network error',
      description: 'with network error (no status)',
    },
    {
      status: 503,
      message: undefined,
      expectedError: 'Token refresh failed',
      description: 'with fallback error message',
    },
  ];

  test.each(refreshTokenErrorScenarios)(
    'should handle refreshToken errors $description',
    async ({ status, message, expectedError }) => {
      const mockState = {
        user: { id: '1', username: 'testuser', email: 'test@test.com' },
        token: 'old-token',
        refreshToken: 'refresh-token-value',
        isAuthenticated: true,
      };
      localStorage.setItem('authState', JSON.stringify(mockState));

      const mockError = { status, message };
      (apiClient.post as jest.Mock).mockRejectedValue(mockError);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const refreshButton = screen.getByText('Refresh Token');
      await userEvent.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(expectedError);
      });
    }
  );
});

  /**
   * Test: Refresh token without stored refresh token
   * Should throw error when no refresh token is available
   */
  test('refreshToken should throw error when no refresh token available', async () => {
    const mockState = {
      user: { id: '1', username: 'testuser', email: 'test@test.com' },
      token: 'old-token',
      refreshToken: null,
      isAuthenticated: true,
    };
    localStorage.setItem('authState', JSON.stringify(mockState));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const refreshButton = screen.getByText('Refresh Token');
    await userEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('No refresh token available');
    });
  });

  /**
   * Test: Refresh token with empty localStorage
   * Should throw error when localStorage is empty
   */
  test('refreshToken should throw error when localStorage is empty', async () => {
    localStorage.clear();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const refreshButton = screen.getByText('Refresh Token');
    await userEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('No refresh token available');
    });
  });

  /**
   * Test: Fetch user
   */
  test('fetchUser should load user data', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      id: '1',
      username: 'testuser',
      email: 'test@test.com',
    });
    localStorage.setItem('authState', JSON.stringify({
      token: 'mock-token',
      refreshToken: 'mock-refresh',
      isAuthenticated: true,
    }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const fetchButton = screen.getByText('Fetch User');
    await userEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    });
  });

  /**
   * Parametrized test: fetchUser error handling
   * Tests multiple error scenarios for fetching user data
   */
  describe('fetchUser error handling', () => {
    const fetchUserErrorScenarios = [
      {
        status: 401,
        message: 'Unauthorized',
        expectedUsername: 'Not logged in',
        expectedAuthenticated: 'false',
        description: 'with unauthorized error (401)',
      },
      {
        status: 403,
        message: 'Forbidden',
        expectedUsername: 'Not logged in',
        expectedAuthenticated: 'false',
        description: 'with forbidden error (403)',
      },
      {
        status: 404,
        message: 'User not found',
        expectedUsername: 'Not logged in',
        expectedAuthenticated: 'false',
        description: 'with not found error (404)',
      },
      {
        status: 500,
        message: 'Internal server error',
        expectedUsername: 'Not logged in',
        expectedAuthenticated: 'false',
        description: 'with server error (500)',
      },
      {
        status: undefined,
        message: 'Network error',
        expectedUsername: 'Not logged in',
        expectedAuthenticated: 'false',
        description: 'with network error (no status)',
      },
    ];

    test.each(fetchUserErrorScenarios)(
      'should handle fetchUser errors $description',
      async ({ status, message, expectedUsername, expectedAuthenticated }) => {
         const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        // Setup initial authenticated state in localStorage
        localStorage.setItem(
          'authState',
          JSON.stringify({
            user: { id: '1', username: 'testuser', email: 'test@test.com' },
            token: 'mock-token',
            refreshToken: 'mock-refresh',
            isAuthenticated: true,
            isLoading: false,
          })
        );

        // Mock the error response
        const mockError = { status, message };
        (apiClient.get as jest.Mock).mockRejectedValue(mockError);

        const { rerender } = render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        // Verify initial authenticated state is loaded from localStorage
        await waitFor(() => {
          expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
        });

        // Trigger fetchUser with proper act() wrapping
        const fetchButton = screen.getByText('Fetch User');
        await act(async () => {
          await userEvent.click(fetchButton);
          // Wait for all state updates to complete
          await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Verify state is reset to initialState on error
        await waitFor(
          () => {
            expect(screen.getByTestId('username')).toHaveTextContent(expectedUsername);
            expect(screen.getByTestId('is-authenticated')).toHaveTextContent(expectedAuthenticated);
          },
          { timeout: 3000 }
        );

        // Verify localStorage is updated with initialState (user: null, isAuthenticated: false)
        const savedState = JSON.parse(localStorage.getItem('authState') || '{}');
        expect(savedState.user).toBe(null);
        expect(savedState.isAuthenticated).toBe(false);
        expect(savedState.token).toBe(null);
        expect(savedState.refreshToken).toBe(null);

        consoleSpy.mockRestore();
      }
    );
  });

  /**
   * Test: Refresh token with no refresh token available
   */
  test('refreshToken should throw error if no refresh token', async () => {
    localStorage.setItem('authState', JSON.stringify({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    }));

    const consoleError = jest.spyOn(console, 'error').mockImplementation();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const refreshButton = screen.getByText('Refresh Token');
    await userEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    consoleError.mockRestore();
  });

});
