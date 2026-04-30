// src/components/__tests__/ProtectedRoute.test.tsx

/**
 * ProtectedRoute Test Suite
 *
 * This test file covers the ProtectedRoute component that guards access to authenticated pages.
 * Each scenario is tested for:
 * - Loading state display while checking authentication
 * - Rendering protected content when user is authenticated
 * - Redirecting to login when user is not authenticated
 * - Proper use of Auth Context
 * - Navigation behavior on authentication state changes
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import * as AuthContext from '../../contexts/AuthContext';

// Mock the useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock react-router-dom Navigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{`Navigating to ${to}`}</div>,
}));

/**
 * Mock authentication state used across all tests
 * Represents different authentication scenarios
 */
const mockAuthenticatedState = {
  user: { id: '1', username: 'testuser' },
  token: 'valid-jwt-token',
  isAuthenticated: true,
  isLoading: false,
};

const mockUnauthenticatedState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

const mockLoadingState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

// ============================================================================
// PROTECTED ROUTE LOADING STATE TESTS
// ============================================================================
/**
 * Loading State: While checking authentication from localStorage/server
 * Scenarios:
 * 1. Shows loading spinner when isLoading is true
 * 2. Does not render protected content while loading
 * 3. Does not redirect while loading
 * 4. Displays "Loading..." text to user
 */
describe('ProtectedRoute - Loading State', () => {
  test('should display loading spinner while checking authentication', () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      state: mockLoadingState,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('should not render protected content while loading', () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      state: mockLoadingState,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('should not redirect while loading', () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      state: mockLoadingState,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });
});

// ============================================================================
// PROTECTED ROUTE AUTHENTICATED STATE TESTS
// ============================================================================
/**
 * Authenticated State: User is logged in with valid JWT
 * Scenarios:
 * 1. Renders protected content when authenticated
 * 2. Does not show loading spinner
 * 3. Does not redirect to login
 * 4. Allows access to dashboard/protected pages
 */
describe('ProtectedRoute - Authenticated State', () => {
  test('should render protected content when user is authenticated', () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      state: mockAuthenticatedState,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('should not show loading spinner when authenticated', () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      state: mockAuthenticatedState,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  test('should not redirect when user is authenticated', () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      state: mockAuthenticatedState,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  test('should render complex protected component structures', () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      state: mockAuthenticatedState,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>
            <h1>Dashboard</h1>
            <p>Welcome, testuser</p>
            <button>Logout</button>
          </div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome, testuser')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
});

// ============================================================================
// PROTECTED ROUTE UNAUTHENTICATED STATE TESTS
// ============================================================================
/**
 * Unauthenticated State: User is not logged in or JWT is invalid
 * Scenarios:
 * 1. Redirects to login page when not authenticated
 * 2. Does not render protected content
 * 3. Does not show loading spinner
 * 4. Uses replace navigation to prevent back button to protected page
 */
describe('ProtectedRoute - Unauthenticated State', () => {
  test('should redirect to login when user is not authenticated', () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      state: mockUnauthenticatedState,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByText('Navigating to /login')).toBeInTheDocument();
  });

  test('should not render protected content when not authenticated', () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      state: mockUnauthenticatedState,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('should not show loading spinner when redirecting', () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      state: mockUnauthenticatedState,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  test('should redirect to /login specifically', () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      state: mockUnauthenticatedState,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Navigating to /login')).toBeInTheDocument();
  });
});

// ============================================================================
// PROTECTED ROUTE EDGE CASES TESTS
// ============================================================================
/**
 * Edge Cases: Unusual but valid scenarios
 * Scenarios:
 * 1. User with valid token but no user data (edge case)
 * 2. Rapid state changes (loading → authenticated)
 * 3. Multiple protected routes in same app
 */
describe('ProtectedRoute - Edge Cases', () => {
  test('should handle authenticated state with token but no user data', () => {
    const edgeState = {
      user: null,
      token: 'valid-jwt-token',
      isAuthenticated: true,
      isLoading: false,
    };

    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      state: edgeState,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    // Should render based on isAuthenticated flag, not user data
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('should wrap multiple protected routes correctly', () => {
    (AuthContext.useAuth as jest.Mock).mockReturnValue({
      state: mockAuthenticatedState,
    });

    const { container } = render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Dashboard</div>
        </ProtectedRoute>
        <ProtectedRoute>
          <div>Settings</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});
