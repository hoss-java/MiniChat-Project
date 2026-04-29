/**
 * ThemeContext.tsx
 * 
 * Global theme management with light/dark mode support
 * Persists user preference to localStorage
 * Respects system color scheme preference as fallback
 * 
 * Usage: Wrap app with <ThemeProvider>, then use useTheme() hook in components
 */

import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

/**
 * Theme type - either 'light' or 'dark'
 */
type Theme = 'light' | 'dark';

/**
 * ThemeColors interface
 * Defines all color tokens used throughout the app
 * Each component accesses colors via useTheme() hook
 */
interface ThemeColors {
  primary: string;      // Main brand color
  secondary: string;    // Secondary accent
  background: string;   // Page background
  surface: string;      // Card/panel background
  text: string;         // Primary text
  textSecondary: string;// Secondary text
  error: string;        // Error states
  success: string;      // Success states
  warning: string;      // Warning states
  border: string;       // Borders and dividers
}

/**
 * ThemeContextType interface
 * Exposes theme state and functions to consumers
 */
interface ThemeContextType {
  theme: Theme;                   // Current theme ('light' or 'dark')
  colors: ThemeColors;            // Color palette for current theme
  toggleTheme: () => void;        // Switch between light/dark
}

/**
 * Light mode color palette
 */
const LIGHT_COLORS: ThemeColors = {
  primary: '#3b82f6',      // Blue
  secondary: '#10b981',    // Green
  background: '#ffffff',   // White
  surface: '#f3f4f6',      // Light gray
  text: '#1f2937',         // Dark gray
  textSecondary: '#6b7280',// Medium gray
  error: '#ef4444',        // Red
  success: '#10b981',      // Green
  warning: '#f59e0b',      // Amber
  border: '#e5e7eb',       // Light border
};

/**
 * Dark mode color palette
 */
const DARK_COLORS: ThemeColors = {
  primary: '#60a5fa',      // Light blue
  secondary: '#34d399',    // Light green
  background: '#111827',   // Dark gray/black
  surface: '#1f2937',      // Darker gray
  text: '#f3f4f6',         // Light gray
  textSecondary: '#d1d5db',// Medium light gray
  error: '#f87171',        // Light red
  success: '#34d399',      // Light green
  warning: '#fbbf24',      // Light amber
  border: '#374151',       // Dark border
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * ThemeProvider component
 * Manages theme state and provides it to all child components
 * Persists preference to localStorage and respects system preference
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const colors = theme === 'light' ? LIGHT_COLORS : DARK_COLORS;

  /**
   * toggleTheme()
   * Switches between light/dark, saves to localStorage, updates DOM attribute
   */
  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      return newTheme;
    });
  };

  // Apply theme on mount
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const value: ThemeContextType = useMemo(
    () => ({ theme, colors, toggleTheme }),
    [theme, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * useTheme hook
 * Access current theme and colors in any component
 * Must be used within <ThemeProvider>
 * 
 * @returns {ThemeContextType} { theme, colors, toggleTheme }
 * @throws {Error} If used outside ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
