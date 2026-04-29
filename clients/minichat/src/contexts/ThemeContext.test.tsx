/**
 * themeContext.test.tsx
 * 
 * Unit tests for ThemeContext theme management
 * Tests theme toggling, localStorage persistence, system preference detection,
 * and hook error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeContext';

/**
 * Test component that uses useTheme hook
 * Used to test hook functionality within provider context
 */
const TestComponent = () => {
  const { theme, colors, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-display">{theme}</span>
      <span data-testid="primary-color">{colors.primary}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">
        Toggle Theme
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  // Clear localStorage and mocks before each test
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  // ===== THEME TOGGLING TESTS =====

  /**
   * SCENARIO: User clicks toggle button
   * EXPECTED: Theme switches from light to dark
   * VERIFIES: toggleTheme() function works correctly
   */
  test('should toggle theme from light to dark', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeDisplay = screen.getByTestId('theme-display');
    const toggleBtn = screen.getByTestId('toggle-btn');

    expect(themeDisplay).toHaveTextContent('light');

    fireEvent.click(toggleBtn);

    expect(themeDisplay).toHaveTextContent('dark');
  });

  /**
   * SCENARIO: User toggles theme twice (light → dark → light)
   * EXPECTED: Theme returns to original state
   * VERIFIES: toggleTheme() is idempotent
   */
  test('should toggle theme from dark back to light', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeDisplay = screen.getByTestId('theme-display');
    const toggleBtn = screen.getByTestId('toggle-btn');

    fireEvent.click(toggleBtn); // light → dark
    expect(themeDisplay).toHaveTextContent('dark');

    fireEvent.click(toggleBtn); // dark → light
    expect(themeDisplay).toHaveTextContent('light');
  });

  // ===== COLOR PALETTE TESTS =====

  /**
   * SCENARIO: Component renders in light theme
   * EXPECTED: Light color palette is applied (primary = blue #3b82f6)
   * VERIFIES: Correct colors are used for current theme
   */
  test('should apply light color palette in light theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const primaryColor = screen.getByTestId('primary-color');
    expect(primaryColor).toHaveTextContent('#3b82f6'); // Light blue
  });

  /**
   * SCENARIO: User toggles to dark theme
   * EXPECTED: Dark color palette is applied (primary = light blue #60a5fa)
   * VERIFIES: Colors change when theme changes
   */
  test('should apply dark color palette in dark theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');
    const primaryColor = screen.getByTestId('primary-color');

    fireEvent.click(toggleBtn);

    expect(primaryColor).toHaveTextContent('#60a5fa'); // Dark blue
  });

  // ===== LOCALSTORAGE PERSISTENCE TESTS =====

  /**
   * SCENARIO: User toggles theme and page refreshes (simulate with new render)
   * EXPECTED: Theme preference is restored from localStorage
   * VERIFIES: Theme persistence works across sessions
   */
  test('should persist theme preference to localStorage', () => {
    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');
    fireEvent.click(toggleBtn);

    expect(localStorage.getItem('theme')).toBe('dark');

    unmount();

    // Re-render (simulates page refresh)
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeDisplay = screen.getByTestId('theme-display');
    expect(themeDisplay).toHaveTextContent('dark');
  });

  /**
   * SCENARIO: localStorage already has saved theme ('dark')
   * EXPECTED: Component initializes with saved theme, not system preference
   * VERIFIES: localStorage takes priority over system preference
   */
  test('should restore theme from localStorage on mount', () => {
    localStorage.setItem('theme', 'dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeDisplay = screen.getByTestId('theme-display');
    expect(themeDisplay).toHaveTextContent('dark');
  });

  // ===== SYSTEM PREFERENCE TESTS =====

  /**
   * SCENARIO: No localStorage, system prefers dark mode
   * EXPECTED: Component initializes with dark theme
   * VERIFIES: System preference is used as fallback
   */
  test('should use system preference if localStorage is empty (dark)', () => {
    const mockMatchMedia = jest.fn().mockReturnValue({
      matches: true, // System prefers dark
    });
    window.matchMedia = mockMatchMedia;

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeDisplay = screen.getByTestId('theme-display');
    expect(themeDisplay).toHaveTextContent('dark');
  });

  /**
   * SCENARIO: No localStorage, system prefers light mode
   * EXPECTED: Component initializes with light theme
   * VERIFIES: System preference is used as fallback
   */
  test('should use system preference if localStorage is empty (light)', () => {
    const mockMatchMedia = jest.fn().mockReturnValue({
      matches: false, // System prefers light
    });
    window.matchMedia = mockMatchMedia;

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const themeDisplay = screen.getByTestId('theme-display');
    expect(themeDisplay).toHaveTextContent('light');
  });

  // ===== DOM ATTRIBUTE TESTS =====

  /**
   * SCENARIO: Theme is toggled
   * EXPECTED: data-theme attribute on document.documentElement is updated
   * VERIFIES: CSS can select theme via [data-theme] selector
   */
  test('should update data-theme attribute on documentElement', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    fireEvent.click(toggleBtn);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  // ===== HOOK ERROR HANDLING TESTS =====

  /**
   * SCENARIO: useTheme hook is called outside ThemeProvider
   * EXPECTED: Error is thrown with descriptive message
   * VERIFIES: Hook properly enforces provider requirement
   */
  test('should throw error when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const BadComponent = () => {
      useTheme(); // Called outside provider
      return <div>Test</div>;
    };

    expect(() => {
      render(<BadComponent />);
    }).toThrow('useTheme must be used within ThemeProvider');

    spy.mockRestore();
  });

  // ===== INTEGRATION TESTS =====

  /**
   * SCENARIO: Multiple components using useTheme in same provider
   * EXPECTED: All components share same theme state, all update together
   * VERIFIES: Context properly distributes state to all consumers
   */
  test('should share theme state across multiple components', () => {
    const Component1 = () => {
      const { theme } = useTheme();
      return <span data-testid="comp1-theme">{theme}</span>;
    };

    const Component2 = () => {
      const { theme, toggleTheme } = useTheme();
      return (
        <div>
          <span data-testid="comp2-theme">{theme}</span>
          <button onClick={toggleTheme} data-testid="comp2-toggle">
            Toggle
          </button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <Component1 />
        <Component2 />
      </ThemeProvider>
    );

    expect(screen.getByTestId('comp1-theme')).toHaveTextContent('light');
    expect(screen.getByTestId('comp2-theme')).toHaveTextContent('light');

    fireEvent.click(screen.getByTestId('comp2-toggle'));

    expect(screen.getByTestId('comp1-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('comp2-theme')).toHaveTextContent('dark');
  });
});
