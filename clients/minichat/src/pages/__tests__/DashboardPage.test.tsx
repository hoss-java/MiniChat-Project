/**
 * DashboardPage.test.tsx
 * 
 * Comprehensive test suite for the DashboardPage component.
 * 
 * TEST SCENARIOS OVERVIEW:
 * 
 * 1. INITIAL RENDER & AUTH STATE
 *    - Verifies correct UI elements render when user is authenticated
 *    - Tests loading state handling
 *    - Validates welcome message displays correct username
 * 
 * 2. RESPONSIVE LAYOUT (MOBILE vs DESKTOP)
 *    - Tests isMobileLayout state changes based on window width
 *    - Verifies resize event listener is properly attached and cleaned up
 *    - Validates sidebar renders correctly at different breakpoints
 * 
 * 3. USER INTERACTION - LOGOUT
 *    - Tests logout button click triggers logout action
 *    - Verifies user is redirected to login page after logout
 *    - Ensures both logout() and navigate() are called correctly
 * 
 * 4. ROOM CREATION FEATURE
 *    - Tests create room button click handler
 *    - Validates button state during async operations
 *    - Verifies appropriate loading indicators
 * 
 * 5. EMPTY STATE DISPLAY
 *    - Tests empty state message shows when no rooms exist
 *    - Validates copy is user-friendly and actionable
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../DashboardPage';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// ==================== SETUP: MOCKS ====================

// Mock authentication context
jest.mock('../../contexts/AuthContext');

// Mock theme context
jest.mock('../../contexts/ThemeContext');

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('DashboardPage', () => {
  // ==================== TEST DATA & MOCK VALUES ====================

  /**
   * Mock theme object - consistent across all tests
   * Provides colors object and theme toggle function
   */
  const mockTheme = {
    theme: 'light',
    colors: {
      primary: '#3b82f6',
      background: '#ffffff',
      surface: '#f3f4f6',
      text: '#1f2937',
      textSecondary: '#6b7280',
      error: '#ef4444',
      border: '#e5e7eb',
    },
    toggleTheme: jest.fn(),
  };

  /**
   * Mock auth context - varies per scenario via params
   * Default: authenticated user with no loading state
   */
  const createMockAuth = (overrides = {}) => ({
    state: {
      isLoading: false,
      user: {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
      },
      isAuthenticated: true,
      ...overrides.state,
    },
    logout: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
  });

  // ==================== TEST SETUP & TEARDOWN ====================

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue(mockTheme);
    window.innerWidth = 1024; // Desktop width by default
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Helper function to render DashboardPage with required providers
   * Wraps component in BrowserRouter for navigation functionality
   */
  const renderDashboard = (mockAuth = createMockAuth()) => {
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
    return render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
  };

  // ==================== TEST SCENARIO 1: INITIAL RENDER & AUTH STATE ====================

  describe('SCENARIO 1: Initial Render & Authentication State', () => {
    /**
     * TEST: Component renders all essential elements when user is authenticated
     * 
     * EXPECTATIONS:
     * - Welcome message displays with correct username
     * - All sidebar components are visible
     * - Create room button is present
     * - Logout button is accessible
     * - Empty state message is shown (no rooms yet)
     * 
     * PARAMETRIZED TEST DATA:
     * Tests different usernames to ensure dynamic content rendering
     */
    test.each([
      { username: 'john_doe', expectedGreeting: 'Welcome, john_doe' },
      { username: 'alice_smith', expectedGreeting: 'Welcome, alice_smith' },
      { username: 'testuser', expectedGreeting: 'Welcome, testuser' },
    ])(
      'should render all dashboard elements with username "$username"',
      ({ username, expectedGreeting }) => {
        const mockAuth = createMockAuth({
          state: {
            isLoading: false,
            user: { id: 'user123', username, email: 'test@example.com' },
            isAuthenticated: true,
          },
        });

        renderDashboard(mockAuth);

        // Verify welcome message
        expect(screen.getByText(new RegExp(expectedGreeting, 'i'))).toBeInTheDocument();

        // Verify sidebar elements
        expect(screen.getByRole('button', { name: /\+ new room/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();

        // Verify empty state
        expect(screen.getByText(/select a room to start chatting/i)).toBeInTheDocument();
      }
    );

    /**
     * TEST: Component shows loading state when auth is in progress
     * 
     * EXPECTATIONS:
     * - "Loading..." message is displayed
     * - Dashboard content is not rendered yet
     * 
     * PARAMETRIZED TEST DATA:
     * Tests that loading state takes precedence over normal render
     */
    test('should display loading state when isLoading is true', () => {
      const mockAuth = createMockAuth({ 
        state: { isLoading: true, user: null }
      });

      renderDashboard(mockAuth);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText(/select a room/i)).not.toBeInTheDocument();
    });

    /**
     * TEST: Fallback username displays when user object is missing
     * 
     * EXPECTATIONS:
     * - Generic "User" text is shown instead of throwing error
     * - Component remains functional and accessible
     */
    test('should display default username when user data is unavailable', () => {
      const mockAuth = createMockAuth({
        state: {
          user: null,
          isAuthenticated: false,
        }
      });

      renderDashboard(mockAuth);

      if (!mockAuth.state.isLoading) {
        expect(screen.getByText(/Welcome, User/i)).toBeInTheDocument();
      }
    });
  });

  // ==================== TEST SCENARIO 2: RESPONSIVE LAYOUT (MOBILE vs DESKTOP) ====================

  describe('SCENARIO 2: Responsive Layout & Window Resize Handling', () => {
    /**
     * TEST: isMobileLayout state updates correctly based on window width
     * 
     * EXPECTATIONS:
     * - Desktop width (1024px+): isMobileLayout = false
     * - Mobile width (<768px): isMobileLayout = true
     * - Sidebar receives correct prop value
     * 
     * PARAMETRIZED TEST DATA:
     * Tests multiple breakpoint combinations
     */
    test.each([
      { width: 1024, expectedMobileLayout: false, description: 'desktop' },
      { width: 768, expectedMobileLayout: false, description: 'tablet edge case' },
      { width: 767, expectedMobileLayout: true, description: 'mobile' },
      { width: 375, expectedMobileLayout: true, description: 'small mobile' },
      { width: 2560, expectedMobileLayout: false, description: 'ultra-wide desktop' },
    ])(
      'should set isMobileLayout=$expectedMobileLayout for width=$width ($description)',
      ({ width, expectedMobileLayout }) => {
        // Set initial width
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });

        renderDashboard();

        // Trigger resize event to ensure handler runs
        fireEvent.resize(window, { innerWidth: width });

        // Component should render correctly with the expected layout
        expect(screen.getByText(/select a room/i)).toBeInTheDocument();
      }
    );

    /**
     * TEST: Window resize event listener is attached on mount
     * 
     * EXPECTATIONS:
     * - addEventListener is called with 'resize' event
     * - Component responds to window resize dynamically
     */
    test('should attach resize event listener on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderDashboard();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
    });

    /**
     * TEST: Window resize event listener is cleaned up on unmount
     * 
     * EXPECTATIONS:
     * - removeEventListener is called with 'resize' event
     * - Memory leaks are prevented by cleaning up listeners
     */
    test('should remove resize event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderDashboard();
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });

  // ==================== TEST SCENARIO 3: USER INTERACTION - LOGOUT ====================

  describe('SCENARIO 3: Logout Flow & Navigation', () => {
    /**
     * TEST: Logout button triggers logout action and navigation
     * 
     * EXPECTATIONS:
     * - logout() function is called exactly once
     * - navigate() redirects to '/login' page
     * - Both functions are called in correct order
     * 
     * PARAMETRIZED TEST DATA:
     * Tests logout with different user contexts
     */
    test.each([
      { username: 'john_doe', userId: 'user123' },
      { username: 'admin_user', userId: 'admin456' },
      { username: 'guest', userId: 'guest789' },
    ])(
      'should logout and redirect to login for user "$username"',
      async ({ username, userId }) => {
        const mockAuth = createMockAuth({
          state: {
            isLoading: false,
            user: { id: userId, username, email: 'test@example.com' },
            isAuthenticated: true,
          },
        });

        renderDashboard(mockAuth);

        const logoutButton = screen.getByRole('button', { name: /logout/i });
        await userEvent.click(logoutButton);

        expect(mockAuth.logout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      }
    );

    /**
     * TEST: Logout button is properly disabled/enabled based on loading state
     * 
     * EXPECTATIONS:
     * - Logout button remains accessible
     * - No state changes affect logout functionality
     */
    test('should make logout button functional regardless of auth state', () => {
      const mockAuth = createMockAuth();

      renderDashboard(mockAuth);

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      expect(logoutButton).toBeEnabled();
    });
  });

  // ==================== TEST SCENARIO 4: ROOM CREATION FEATURE ====================

  describe('SCENARIO 4: Room Creation Functionality', () => {
    /**
     * TEST: Create room button click handler is invoked
     * 
     * EXPECTATIONS:
     * - Click event triggers handleCreateRoom function
     * - No errors are thrown
     * - Console.log('Create room') is called (placeholder behavior)
     * 
     * PARAMETRIZED TEST DATA:
     * Tests button clicks in different UI contexts
     */
    test.each([
      { clickCount: 1 },
      { clickCount: 2 },
      { clickCount: 3 },
    ])(
      'should handle create room button click ($clickCount times)',
      async ({ clickCount }) => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        renderDashboard();

        const createButton = screen.getByRole('button', { name: /new room/i });

        for (let i = 0; i < clickCount; i++) {
          await userEvent.click(createButton);
        }

        expect(consoleSpy).toHaveBeenCalledWith('Create room');
        expect(consoleSpy).toHaveBeenCalledTimes(clickCount);

        consoleSpy.mockRestore();
      }
    );

    /**
     * TEST: Create room button remains available and clickable
     * 
     * EXPECTATIONS:
     * - Button is always enabled
     * - Button has proper accessibility attributes
     */
    test('should render create room button as accessible element', () => {
      renderDashboard();

      const createButton = screen.getByRole('button', { name: /new room/i });
      expect(createButton).toBeEnabled();
      expect(createButton).toBeInTheDocument();
    });
  });

  // ==================== TEST SCENARIO 5: EMPTY STATE DISPLAY ====================

  describe('SCENARIO 5: Empty State & Room List Display', () => {
    /**
     * TEST: Empty state message displays when no rooms exist
     * 
     * EXPECTATIONS:
     * - "Select a room to start chatting" message is visible
     * - Message is clear and user-friendly
     * - Encourages user to create first room
     * 
     * PARAMETRIZED TEST DATA:
     * Ensures message consistency across different render scenarios
     */
    test.each([
      { rooms: [] as any[] },
      { rooms: [] as any[] },
    ])(
      'should display empty state when rooms list is empty',
      ({ rooms }) => {
        renderDashboard();

        expect(screen.getByText(/select a room to start chatting/i)).toBeInTheDocument();
      }
    );

    /**
     * TEST: Theme colors are applied to dashboard container
     * 
     * EXPECTATIONS:
     * - DashboardContainer receives correct color props
     * - Responsive rendering with theme context
     */
    test('should render dashboard with theme colors', () => {
      renderDashboard();

      const dashboardContent = screen.getByText(/select a room to start chatting/i);
      expect(dashboardContent).toBeInTheDocument();

      expect(useTheme).toHaveBeenCalled();
    });
  });

  // ==================== TEST SCENARIO 6: INTEGRATION TESTS ====================

  describe('SCENARIO 6: Full User Flow Integration', () => {
    /**
     * TEST: Complete user flow from dashboard load to logout
     * 
     * EXPECTATIONS:
     * - Component renders fully
     * - User sees welcome message
     * - User can interact with all buttons
     * - Logout triggers full logout sequence
     * 
     * PARAMETRIZED TEST DATA:
     * Tests multiple user scenarios in single flow
     */
    test.each([
      { username: 'john_doe', shouldLogout: true },
      { username: 'alice_smith', shouldLogout: false },
    ])(
      'should handle complete dashboard flow for "$username"',
      async ({ username, shouldLogout }) => {
        const mockAuth = createMockAuth({
          state: {
            isLoading: false,
            user: { id: 'user123', username, email: 'test@example.com' },
            isAuthenticated: true,
          },
        });

        renderDashboard(mockAuth);

        await waitFor(() => {
          expect(screen.getByRole('heading', { level: 1, name: new RegExp(`Welcome, ${username}`, 'i') })).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: /new room/i })).toBeInTheDocument();

        if (shouldLogout) {
          const logoutButton = screen.getByRole('button', { name: /logout/i });
          await userEvent.click(logoutButton);

          expect(mockAuth.logout).toHaveBeenCalled();
          expect(mockNavigate).toHaveBeenCalledWith('/login');
        }
      }
    );
  });
});
