/**
 * LoginPage.test.tsx
 * 
 * Unit tests for LoginPage component
 * Tests: form validation, error handling, API calls, navigation, remember me, loading state
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeToggle } from '../../components/ThemeComponents';

// Mock hooks
jest.mock('../../contexts/AuthContext');
jest.mock('../../contexts/ThemeContext');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginPage', () => {
  // Mock theme hook return value
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

  // Mock auth hook return value
  const mockLogin = jest.fn();
  const mockAuth = {
    login: mockLogin,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue(mockTheme);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
    localStorage.clear();
  });

  /**
   * Helper function to render LoginPage with required providers
   */
  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  // ==================== Form Rendering Tests ====================

  describe('Form Rendering', () => {
    test('should render login form with username and password fields', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText('your_username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    test('should render submit button with correct text', () => {
      renderLoginPage();

      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('should render remember me checkbox', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    test('should render link to registration page', () => {
      renderLoginPage();

      const registerLink = screen.getByRole('link', { name: /register here/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });
  });

  // ==================== Form Validation Tests ====================

  describe('Form Validation', () => {
    test('should show error when username is empty', async () => {
      renderLoginPage();

      const submitBtn = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });
    });

    test('should show error when password is empty', async () => {
      renderLoginPage();

      const usernameInput = screen.getByPlaceholderText('your_username');
      await userEvent.type(usernameInput, 'testuser');

      const submitBtn = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    test('should show error when password is less than 6 characters', async () => {
      renderLoginPage();

      const usernameInput = screen.getByPlaceholderText('your_username');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, '12345'); // 5 chars

      const submitBtn = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
    });

    test('should not call login() if validation fails', async () => {
      renderLoginPage();

      const submitBtn = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });
  });

  // ==================== Form Submission Tests ====================

  describe('Form Submission', () => {
    test('should call login() with correct username and password', async () => {
      renderLoginPage();

      const usernameInput = screen.getByPlaceholderText('your_username');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');

      const submitBtn = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
      });
    });

    test('should show loading state during submission', async () => {
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderLoginPage();

      const usernameInput = screen.getByPlaceholderText('your_username');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');

      const submitBtn = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled();
      });
    });

    test('should disable form fields during loading', async () => {
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderLoginPage();

      const usernameInput = screen.getByPlaceholderText('your_username') as HTMLInputElement;
      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');

      const submitBtn = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(usernameInput.disabled).toBe(true);
        expect(passwordInput.disabled).toBe(true);
      });
    });
  });

  // ==================== Success & Navigation Tests ====================

  describe('Successful Login & Navigation', () => {
    test('should redirect to /dashboard on successful login', async () => {
      mockLogin.mockResolvedValue(undefined);

      renderLoginPage();

      const usernameInput = screen.getByPlaceholderText('your_username');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');

      const submitBtn = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('should save username to localStorage when remember me is checked', async () => {
      mockLogin.mockResolvedValue(undefined);

      renderLoginPage();

      const usernameInput = screen.getByPlaceholderText('your_username');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const rememberCheckbox = screen.getByLabelText(/remember me/i);

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(rememberCheckbox);

      const submitBtn = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(localStorage.getItem('rememberMe')).toBe('testuser');
      });
    });

    test('should not save username if remember me is unchecked', async () => {
      mockLogin.mockResolvedValue(undefined);

      renderLoginPage();

      const usernameInput = screen.getByPlaceholderText('your_username');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');

      const submitBtn = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(localStorage.getItem('rememberMe')).toBeNull();
      });
    });
  });

  // ==================== Error Handling Tests ====================

  describe('Error Handling', () => {
    test('should display error message on login failure', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid username or password'));

      renderLoginPage();

      const usernameInput = screen.getByPlaceholderText('your_username');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'wrongpassword');

      const submitBtn = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
      });
    });

    test('should display network error message', async () => {
      mockLogin.mockRejectedValue(new Error('Network error. Check your connection'));

      renderLoginPage();

      const usernameInput = screen.getByPlaceholderText('your_username');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');

      const submitBtn = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Network error. Check your connection')).toBeInTheDocument();
      });
    });

    test('should display generic error message when error has no message', async () => {
      mockLogin.mockRejectedValue(new Error());

      renderLoginPage();

      const usernameInput = screen.getByPlaceholderText('your_username');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');

      const submitBtn = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument();
      });
    });

    test('should not navigate on login error', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      renderLoginPage();

      const usernameInput = screen.getByPlaceholderText('your_username');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'wrongpassword');

      const submitBtn = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  // ==================== Remember Me Tests ====================

  describe('Remember Me', () => {
    test('should load remembered username on mount', () => {
      localStorage.setItem('rememberMe', 'saveduser');

      renderLoginPage();

      const usernameInput = screen.getByPlaceholderText('your_username') as HTMLInputElement;
      const rememberCheckbox = screen.getByLabelText(/remember me/i) as HTMLInputElement;

      expect(usernameInput.value).toBe('saveduser');
      expect(rememberCheckbox.checked).toBe(true);
    });

    test('should not load username if localStorage is empty', () => {
      renderLoginPage();

      const usernameInput = screen.getByPlaceholderText('your_username') as HTMLInputElement;

      expect(usernameInput.value).toBe('');
    });
  });

  // ==================== Theme Tests ====================

  describe('Theme Support', () => {
    test('should call toggleTheme when theme button is clicked', async () => {
      renderLoginPage();

      const themeBtn = screen.getByRole('button', { name: /🌙|☀️/i });
      fireEvent.click(themeBtn);

      expect(mockTheme.toggleTheme).toHaveBeenCalled();
    });

    test('should render theme button outside login card', () => {
      renderLoginPage();

      const loginContainer = screen.getByText(/miniCh/i).closest('.login-container');
      const themeBtn = screen.getByRole('button', { name: /🌙|☀️/i });

      expect(loginContainer).toContainElement(themeBtn);
      expect(themeBtn).toBeInTheDocument();
    });

    test('should render with theme colors', () => {
      renderLoginPage();

      const loginCard = screen.getByText(/miniCh/i).closest('.login-card');

      expect(loginCard).toHaveClass('login-card');
      expect(loginCard).toBeInTheDocument();
    });
  });
});
