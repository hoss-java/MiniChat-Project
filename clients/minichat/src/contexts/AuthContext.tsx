/**
 * AuthContext.tsx
 * 
 * This file manages global authentication state for the entire application.
 * It stores user data, JWT token, and provides login/logout/refresh functions.
 * All components can access auth state via the useAuth() hook.
 */

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { apiClient } from '../services/ApiClient';

// ============ INTERFACES ============

/**
 * User interface
 * Represents a logged-in user's data
 */
interface User {
  id: string;
  username: string;
}

/**
 * AuthState interface
 * Holds the current authentication state of the app
 * - user: null if logged out, User object if logged in
 * - token: null if logged out, JWT string if logged in
 * - isAuthenticated: boolean flag for easy checking
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

/**
 * AuthContextType interface
 * Defines all methods and state available in AuthContext
 * Any component using useAuth() gets access to these
 */
interface AuthContextType {
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// ============ INITIAL STATE ============

/**
 * initialState
 * Default values when app starts (user is logged out)
 */
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

// ============ CREATE CONTEXT ============

/**
 * AuthContext
 * React Context object that holds auth state
 * Use useAuth() hook to access this in components
 */
export const AuthContext = createContext<AuthContextType | null>(null);

// ============ LOCALSTORAGE FUNCTIONS ============

/**
 * saveToLocalStorage(state)
 * Persists auth state to browser localStorage
 * Called after login/logout so user stays logged in on page refresh
 * 
 * @param state - AuthState object to save
 */
const saveToLocalStorage = (state: AuthState): void => {
  localStorage.setItem('authState', JSON.stringify(state));
};

/**
 * loadFromLocalStorage()
 * Retrieves auth state from browser localStorage on app startup
 * Allows user to stay logged in across browser sessions
 * 
 * @returns AuthState from localStorage, or initialState if nothing saved
 */
const loadFromLocalStorage = (): AuthState => {
  const saved = localStorage.getItem('authState');
  return saved ? JSON.parse(saved) : initialState;
};

// ============ AUTHPROVIDER COMPONENT ============

/**
 * AuthProviderProps interface
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component
 * Wraps the entire app with authentication context
 * Must wrap <App /> in index.tsx so all components can access auth state
 * 
 * Usage:
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize state from localStorage on first render
  const [state, setState] = useState<AuthState>(() => loadFromLocalStorage());

	/**
	 * login(username, password)
	 * Authenticates user with username and password, stores JWT token.
	 * Calls backend POST /auth/login through ApiClient.
	 * Differentiates error types (invalid credentials, network, server).
	 * 
	 * @param username - User's username
	 * @param password - User's password
	 * @throws {Error} "Invalid username or password" (401)
	 * @throws {Error} "Network error. Check your connection" (network failure)
	 * @throws {Error} "Login failed. Try again later" (5xx)
	 */
	const login = async (username: string, password: string): Promise<void> => {
	  try {
	    const response = await apiClient.post('/auth/login', { username, password });
	    const newState: AuthState = {
	      user: response.user,
	      token: response.token,
	      isAuthenticated: true,
	    };
	    setState(newState);
	    saveToLocalStorage(newState);
	  } catch (error: any) {
	    const status = error.response?.status;
	    const message = error.response?.data?.message;

	    if (status === 401) {
	      throw new Error('Invalid username or password');
	    } else if (status === 400) {
	      throw new Error(message || 'Invalid input');
	    } else if (!error.response) {
	      throw new Error('Network error. Check your connection');
	    } else {
	      throw new Error('Login failed. Try again later');
	    }
	  }
	};


  /**
   * logout()
   * Clears user data and removes token from state and localStorage
   * Called when user clicks logout button
   * 
   * TODO: Call API to invalidate token on server
   */
  const logout = (): void => {
    setState(initialState);
    localStorage.removeItem('authState');
  };

	/**
	 * refreshToken()
	 * Gets new JWT token using refresh token
	 * Calls backend POST /auth/refresh through ApiClient
	 */
	const refreshToken = async (): Promise<void> => {
	  const response = await apiClient.post('/auth/refresh', {});
	  const newState: AuthState = {
	    ...state,
	    token: response.token,
	  };
	  setState(newState);
	  saveToLocalStorage(newState);
	};

  // Bundle state and functions into context value
  const value: AuthContextType = { state, login, logout, refreshToken };

  // Provide context to all child components
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============ CUSTOM HOOK ============

/**
 * useAuth()
 * Custom hook to access auth context in any component
 * Must be used inside <AuthProvider> wrapper
 * 
 * Usage in a component:
 * const { state, login, logout } = useAuth();
 * 
 * @returns AuthContextType with state and all auth functions
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
