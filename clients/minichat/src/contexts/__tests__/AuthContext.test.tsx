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
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';

// Mock the ApiClient
jest.mock('../../services/ApiClient');

/**
 * Test component that uses useAuth hook
 * Used to test context functionality in component
 */
const TestComponent = () => {
  const { state, login, logout, register, refreshToken, fetchUser } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const handleRefreshToken = async () => {
    try {
      await refreshToken();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRegister = async () => {
    try {
      setError(null);
      await register('test@test.com', 'user', 'pass', 'pass');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div data-testid="username">{state.user?.username || 'Not logged in'}</div>
      <div data-testid="is-authenticated">{state.isAuthenticated.toString()}</div>
      <div data-testid="error">{error || ''}</div>
      <button onClick={() => login('testuser', 'password')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={handleRegister}>Register</button>
      <button onClick={handleRefreshToken}>Refresh Token</button>
      <button onClick={() => fetchUser()}>Fetch User</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
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
