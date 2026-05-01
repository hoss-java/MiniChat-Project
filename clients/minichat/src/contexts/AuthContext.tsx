/**
 * AuthContext.tsx
 * 
 * This file manages global authentication state for the entire application.
 * It stores user data, JWT token, and provides login/logout/refresh functions.
 * All components can access auth state via the useAuth() hook.
 */

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { apiClient } from '../services/ApiClient';
import { authService } from '../services/AuthService';
import { User } from '../types/UserTypes';
// ============ INTERFACES ============

/**
 * AuthState interface
 * Holds the current authentication state of the app
 * - user: null if logged out, User object if logged in
 * - token: JWT access token for API requests
 * - refreshToken: refresh token for obtaining new access tokens
 * - isAuthenticated: boolean flag indicating login status
 * - isLoading: boolean flag indicating async operations in progress
 */
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * AuthContextType interface
 * Defines all methods and state available in AuthContext
 * Any component using useAuth() gets access to these
 */
interface AuthContextType {
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, passwordConfirm: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  fetchUser: () => Promise<void>;
  getProfile: () => Promise<User | null>;
  updateProfile: (username: string, email: string) => Promise<void>;
}

// ============ INITIAL STATE ============

/**
 * initialState
 * Default values when app starts (user is logged out)
 */
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
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
	  const [state, setState] = useState<AuthState>(() => {
	    const loaded = loadFromLocalStorage();
	    return { ...loaded, isLoading: false };
	  });

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
	    const response = await authService.login(username, password);
			const newState: AuthState = {
			  user: response.user,
			  token: response.accessToken,
			  refreshToken: response.refreshToken,
			  isAuthenticated: true,
			  isLoading: false,
			};

	    setState(newState);
	    saveToLocalStorage(newState);

	    await fetchUser();
		} catch (error: any) {
		  const status = error.status;
		  const message = error.message;

		  if (status === 400) {
		    throw new Error(message || 'Invalid input. Please check your information');
		  } else if (status === 409) {
		    throw new Error(message || 'Email or username already exists');
		  } else if (!status) {  // ✅ Check if status exists
		    throw new Error('Network error. Check your connection');
		  } else {
		    throw new Error('Registration failed. Try again later');
		  }
		}
	};

/**
 * updateProfile(username, email)
 * Updates current user's profile information on server
 * Calls backend PUT /auth/profile through AuthService
 * Updates user state with new profile data
 * 
 * @param username - New username (3-50 characters)
 * @param email - New email address (must be valid)
 * @throws {Error} Validation error or network failure
 */
	const updateProfile = async (username: string, email: string): Promise<void> => {
	  try {
	    const response = await authService.updateProfile(username, email);
	    
	    const newState: AuthState = {
	      ...state,
	      user: { ...state.user!, username: response.username, email: response.email },
	    };
	    setState(newState);
	    saveToLocalStorage(newState);
	  } catch (error: any) {
	    const status = error.status;
	    throw new Error(error.message || 'Profile update failed');
	  }
	};

/**
 * getProfile()
 * Retrieves current authenticated user's profile data from server
 * Calls backend GET /auth/me through AuthService
 * Updates user state with profile information
 * 
 * @throws {Error} Error message from server or network failure
 */
	const getProfile = async (): Promise<User | null> => {
	  await fetchUser();
	  return state.user;
	};

	/**
	 * logout()
	 * Clears user authentication state and removes token from localStorage.
	 * Called when user clicks logout button or session expires.
	 * 
	 * @todo Call backend POST /auth/logout to invalidate token on server
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
	  const storedState = JSON.parse(localStorage.getItem('authState') || '{}');
	  const refreshTokenValue = storedState.refreshToken;
	  
	  if (!refreshTokenValue) {
	    throw new Error('No refresh token available');
	  }

	  try {
	    const response = await authService.refreshTokenRequest(refreshTokenValue);

	    const newState: AuthState = {
	      ...state,
	      token: response.accessToken,
	      refreshToken: response.refreshToken,
	    };
	    setState(newState);
	    saveToLocalStorage(newState);
	  } catch (error: any) {
	    const status = error.status;
	    throw new Error(error.message || 'Token refresh failed');
	  }
	};

	/**
	 * fetchUser()
	 * Retrieves the current authenticated user's data from the server.
	 * Called on app mount if a valid token exists in localStorage.
	 * Updates the auth state with user information and sets isLoading to false.
	 * 
	 * @throws {Error} Network or server errors are caught silently; auth state is cleared on failure
	 */
	const fetchUser = async (): Promise<void> => {
	  try {
	    const response = await authService.getProfile();
	    
	    const newState: AuthState = {
	      user: response,  // ✅ Includes publicKey, fingerprint
	      token: localStorage.getItem('authState') ? JSON.parse(localStorage.getItem('authState')!).token : null,
	      refreshToken: localStorage.getItem('authState') ? JSON.parse(localStorage.getItem('authState')!).refreshToken : null,
	      isAuthenticated: true,
	      isLoading: false,
	    };
	    setState(newState);
	    saveToLocalStorage(newState);
	  } catch (error: any) {
		  setState(initialState);
		  console.error('Failed to fetch user:', error.message);
		  throw error;
		}
	};

	/**
	 * register(email, username, password, passwordConfirm)
	 * Creates a new user account with email, username, and password.
	 * Stores JWT token upon successful registration.
	 * Calls backend POST /auth/register through ApiClient.
	 * Differentiates error types (invalid input, duplicate account, network, server).
	 * 
	 * @param email - User's email address
	 * @param username - User's username
	 * @param password - User's password
	 * @param passwordConfirm - Password confirmation (must match password)
	 * @throws {Error} "Invalid input. Please check your information" (400)
	 * @throws {Error} "Email or username already exists" (409)
	 * @throws {Error} "Network error. Check your connection" (network failure)
	 * @throws {Error} "Registration failed. Try again later" (5xx)
	 */
	const register = async (
	  email: string,
	  username: string,
	  password: string,
	  passwordConfirm: string
	): Promise<void> => {
	  try {
	    const response = await authService.register(email, username, password, passwordConfirm);
			const newState: AuthState = {
			  user: response.user,
			  token: response.accessToken,
			  refreshToken: null,
			  isAuthenticated: true,
			  isLoading: false,
			};

	    setState(newState);
	    saveToLocalStorage(newState);
		} catch (error: any) {
		  const status = error.status;
		  const message = error.message;

		  if (status === 400) {
		    throw new Error(message || 'Invalid input. Please check your information');
		  } else if (status === 409) {
		    throw new Error(message || 'Email or username already exists');
		  } else if (!status) {  // ✅ Check if status exists
		    throw new Error('Network error. Check your connection');
		  } else {
		    throw new Error('Registration failed. Try again later');
		  }
		}
	};

	/**
	 * useEffect hook
	 * Syncs AuthContext state with ApiClient for JWT injection and token refresh
	 * Runs whenever state changes to ensure ApiClient has latest token and refresh logic
	 */
	React.useEffect(() => {
	  apiClient.setAuthService({ state, logout, refreshToken });
	}, [state]);

  // Bundle state and functions into context value
  const value: AuthContextType = { state, login, register, logout, refreshToken, fetchUser, getProfile, updateProfile};

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
