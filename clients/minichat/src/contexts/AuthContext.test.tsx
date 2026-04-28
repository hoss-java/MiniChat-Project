/**
 * AuthContext.test.tsx
 * 
 * Tests for AuthContext functionality
 * Tests login, logout, token refresh, and localStorage persistence
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { apiClient } from '../services/ApiClient';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';

// Mock the ApiClient
jest.mock('../services/ApiClient');

/**
 * Test component that uses useAuth hook
 * Used to test context functionality in component
 */
const TestComponent = () => {
  const { state, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="username">{state.user?.username || 'Not logged in'}</div>
      <div data-testid="is-authenticated">{state.isAuthenticated.toString()}</div>
      <button onClick={() => login('testuser', 'password')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
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
      token: 'mock-jwt-token',
    };
    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    loginButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('testuser');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    // Check localStorage
    const saved = JSON.parse(localStorage.getItem('authState') || '{}');
    expect(saved.user.username).toBe('testuser');
    expect(saved.token).toBe('mock-jwt-token');
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
});
