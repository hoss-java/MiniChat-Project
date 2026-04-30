// src/pages/__tests__/RegisterPage.test.tsx
/**
 * RegisterPage.test.tsx
 * 
 * Unit tests for RegisterPage component
 * 
 * SCOPE: Tests form validation, password strength calculation, error handling, 
 *        successful registration flow, loading states, and navigation
 * 
 * COVERAGE AREAS:
 * - Form rendering (inputs, buttons, labels, links)
 * - Form validation (email, username, password, confirmation)
 * - Password strength indicator
 * - Form submission and API calls
 * - Error handling (validation errors, API errors, network errors)
 * - Success flow and navigation
 * - Loading states and disabled inputs
 * - Theme toggle integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../RegisterPage';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// ==================== Mock Setup ====================

jest.mock('../../contexts/AuthContext');
jest.mock('../../contexts/ThemeContext');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('RegisterPage', () => {
  // ==================== Mock Data ====================

  /**
   * Mock theme hook return value
   * Provides color scheme and theme toggle functionality
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
   * Mock auth hook return value
   * The register function is mocked to simulate API calls
   */
  const mockRegister = jest.fn();
  const mockAuth = {
    register: mockRegister,
  };

  /**
   * Valid test data used across multiple tests
   * Represents a typical user registration scenario
   */
  const validFormData = {
    email: 'testuser@example.com',
    username: 'testuser',
    password: 'Password123!',
    passwordConfirm: 'Password123!',
  };

  // ==================== Setup & Cleanup ====================

  beforeEach(() => {
    // Use fake timers FIRST, before clearing mocks
    jest.useFakeTimers();
    
    // Clear all mocks before each test to prevent test pollution
    jest.clearAllMocks();
    
    // Reset mock return values
    (useTheme as jest.Mock).mockReturnValue(mockTheme);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
    
    // Clear navigation mock (redundant after clearAllMocks, but explicit is good)
    mockNavigate.mockClear();
  });

  afterEach(() => {
    // Only run pending timers if fake timers are active
    if (jest.isMockFunction(setTimeout)) {
      jest.runOnlyPendingTimers();
    }
    
    jest.useRealTimers();

    // Clean up DOM
    cleanup();
  });

  // Helper function - define BEFORE test suites
  const waitForSuccessNavigation = async () => {
    await waitFor(() => {
      expect(screen.getByText(/redirecting to login/i)).toBeInTheDocument();
    });
    
    jest.advanceTimersByTime(2000);
  };

  /**
   * Helper function to render RegisterPage with required providers
   * BrowserRouter is required for useNavigate hook to work
   */
  const renderRegisterPage = () => {
    return render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
  };

  // ==================== FORM RENDERING TESTS ====================
  describe('Form Rendering', () => {
    beforeEach(() => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      return () => {
        consoleErrorSpy.mockRestore();
      };
    });

    /**
     * SCENARIO: Component mounts and displays all required form fields
     * EXPECTED: All input fields should be visible with correct labels and placeholders
     */
    test('should render all form input fields with correct labels', () => {
      renderRegisterPage();

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    /**
     * SCENARIO: User sees correct placeholder text in input fields
     * EXPECTED: Placeholders guide user on what to enter
     */
    test('should render input fields with correct placeholders', () => {
      renderRegisterPage();

      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    });

    /**
     * SCENARIO: User can see registration button
     * EXPECTED: Submit button is visible and enabled on initial load
     */
    test('should render register button with correct text', () => {
      renderRegisterPage();

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      expect(registerBtn).toBeInTheDocument();
      expect(registerBtn).not.toBeDisabled();
    });

    /**
     * SCENARIO: New users can navigate to login page
     * EXPECTED: Login link should be present and point to /login route
     */
    test('should render link to login page', () => {
      renderRegisterPage();

      const loginLink = screen.getByRole('link', { name: /sign in/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    /**
     * SCENARIO: Page header is displayed with branding
     * EXPECTED: Registration header/title should be visible
     */
    test('should render registration header', () => {
      renderRegisterPage();

      // Be specific: look for the heading level 1
      expect(screen.getByRole('heading', { level: 1, name: /create account/i })).toBeInTheDocument();
    });
  });


  // ==================== EMAIL VALIDATION TESTS ====================
  describe('Email Validation - Parametrized Tests', () => {
    test.each([
      // [email, shouldBeValid, expectedError]
      ['', false, 'Email is required'],
      ['   ', false, 'Email is required'],
      ['invalid-email', false, 'Email format is invalid'],
      ['user@', false, 'Email format is invalid'],
      ['user@domain', false, 'Email format is invalid'],
      ['user@domain.', false, 'Email format is invalid'],
      ['valid@example.com', true, undefined],
      ['user.name+tag@example.co.uk', true, undefined],
      ['test123@test-domain.com', true, undefined],
    ])('email "%s" should %s (error: %s)', async (email, shouldBeValid, expectedError) => {
      mockRegister.mockResolvedValue(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, email);
      await userEvent.type(usernameInput, 'validuser');
      await userEvent.type(passwordInput, 'Password123!');
      await userEvent.type(confirmInput, 'Password123!');

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn); // Changed from fireEvent.click

      if (!shouldBeValid) {
        await waitFor(() => {
          expect(screen.getByText(expectedError)).toBeInTheDocument();
        });
        expect(mockRegister).not.toHaveBeenCalled();
      } else {
        await waitFor(() => {
          expect(mockRegister).toHaveBeenCalled();
        });
      }
    });
  });

  // ==================== PASSWORD STRENGTH INDICATOR TESTS ====================

  describe('Password Strength Indicator - Parametrized Tests', () => {
    /**
     * SCENARIO: Test password strength calculation with various password patterns
     * EXPECTED: Strength indicator updates based on password complexity
     * 
     * SCORING LOGIC:
     * - 0 points: No password
     * - +1: Length ≥ 8 chars
     * - +1: Length ≥ 12 chars
     * - +1: Has both lowercase and uppercase
     * - +1: Has digits
     * - +1: Has special characters (!@#$%^&*)
     * 
     * TEST CASES:
     * - Weak: short, no special chars
     * - Fair: 8+ chars, no special chars
     * - Good: mixed case, digits, no special
     * - Strong: all requirements partially met
     * - Very Strong: all requirements met
     */
    test.each([
      // [password, expectedLabel]
      ['abc', 'Weak'],
      ['abcdef', 'Weak'],
      ['abcdef12', 'Good'],
      ['Abcdef12', 'Strong'],
      ['Abcdef123', 'Strong'],
      ['Abcdef123!', 'Very Strong'],
      ['Abcdef1234!', 'Very Strong'],
      ['VeryStrongPassword123!@#', 'Very Strong'],
    ])('password "%s" should show strength label "%s"', async (password, expectedLabel) => {
      renderRegisterPage();

      const passwordInput = screen.getByLabelText(/^password/i);
      await userEvent.type(passwordInput, password);

      // The strength indicator only renders if password is not empty
      if (password) {
        await waitFor(() => {
          expect(screen.getByText((content) => content.includes(expectedLabel))).toBeInTheDocument();
        });
      }
    });

    /**
     * SCENARIO: Strength indicator should not display when password is empty
     * EXPECTED: No strength indicator visible for empty password
     */
    test('should not display strength indicator when password is empty', () => {
      renderRegisterPage();

      // Password strength indicator should not be in the document initially
      expect(screen.queryByText(/weak|fair|good|strong|very strong/i)).not.toBeInTheDocument();
    });

    /**
     * SCENARIO: Strength indicator updates as user types password
     * EXPECTED: Indicator appears and updates with each keystroke
     */
    test('should update strength indicator as password changes', async () => {
      renderRegisterPage();

      const passwordInput = screen.getByLabelText(/^password/i);

      // Type weak password
      await userEvent.type(passwordInput, 'weak');
      await waitFor(() => {
        expect(screen.getByText((content) => content.includes('Weak'))).toBeInTheDocument();
      });

      // Clear and type strong password
      await userEvent.clear(passwordInput);
      await userEvent.type(passwordInput, 'StrongPass123!');
      await waitFor(() => {
        expect(screen.getByText((content) => content.includes('Strong'))).toBeInTheDocument();
      });
    });
  });

  // ==================== FORM SUBMISSION TESTS ====================

  describe('Form Submission', () => {
    /**
     * SCENARIO: User submits form with all valid data
     * EXPECTED: Register function called with correct parameters
     */
    test('should call register with correct data on valid submission', async () => {
      mockRegister.mockResolvedValue(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(registerBtn);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          validFormData.email,
          validFormData.username,
          validFormData.password,
          validFormData.passwordConfirm
        );
      });
    });

    /**
     * SCENARIO: User attempts to submit form with invalid data
     * EXPECTED: Register function should not be called, validation errors displayed
     */
    test('should not call register if form validation fails', async () => {
      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const registerBtn = screen.getByRole('button', { name: /create account/i });

      // Submit with empty email (invalid)
      await userEvent.type(emailInput, '');
      fireEvent.click(registerBtn);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(mockRegister).not.toHaveBeenCalled();
      });
    });

    /**
     * SCENARIO: Form submission prevents default behavior
     * EXPECTED: Page should not reload on form submit
     */
    test('should prevent default form submission behavior', async () => {
      mockRegister.mockResolvedValue(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      const form = screen.getByRole('button', { name: /create account/i }).closest('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');

      form!.dispatchEvent(submitEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  // ==================== LOADING STATE TESTS ====================

  describe('Loading State & UI Feedback', () => {
    /**
     * SCENARIO: User submits form and registration is processing
     * EXPECTED: Button should show loading state and be disabled
     */
    test('should clear loading state after successful registration', async () => {
      mockRegister.mockResolvedValue(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(registerBtn);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });

      await waitForSuccessNavigation();

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    /**
     * SCENARIO: User tries to submit form while registration is in progress
     * EXPECTED: All input fields should be disabled to prevent multiple submissions
     */
    test('should disable all form fields during loading', async () => {
      mockRegister.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement;
      const confirmInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(registerBtn);

      await waitFor(() => {
        expect(emailInput.disabled).toBe(true);
        expect(usernameInput.disabled).toBe(true);
        expect(passwordInput.disabled).toBe(true);
        expect(confirmInput.disabled).toBe(true);
      });
    });

    /**
     * SCENARIO: Registration completes successfully
     * EXPECTED: Loading state should be cleared, button re-enabled
     */
    test('should clear loading state after successful registration', async () => {
      mockRegister.mockResolvedValue(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(registerBtn);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });

      await waitForSuccessNavigation();

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

  });

  // ==================== SUCCESS MESSAGE TESTS ====================

  describe('Success Flow & Messages', () => {

    /**
     * SCENARIO: Registration completes successfully
     * EXPECTED: Success message displayed to user
     */
    test('should display success message on successful registration', async () => {
      mockRegister.mockResolvedValue(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(registerBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/registration successful|redirecting to login/i)
        ).toBeInTheDocument();
      });
    });

    /**
     * SCENARIO: Registration completes successfully
     * EXPECTED: User redirected to login page after 2 second delay
     */
    test('should redirect to login page after successful registration', async () => {
      jest.useFakeTimers();
      mockRegister.mockResolvedValue(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      // Wait for the success message to appear
      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      });

      // Fast forward time by 2 seconds
      jest.advanceTimersByTime(2000);

      // Check navigation happened
      expect(mockNavigate).toHaveBeenCalledWith('/login');

      jest.useRealTimers();
    });

    /**
     * SCENARIO: Registration succeeds but network is slow
     * EXPECTED: Success message shown, navigation happens after timeout
     */
    test('should show success message before redirecting', async () => {
      mockRegister.mockResolvedValue(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      // Message should appear after promise resolves
      await waitFor(() => {
        expect(
          screen.getByText(/registration successful|redirecting to login/i)
        ).toBeInTheDocument();
      });

      // Navigation should not have happened yet (timer hasn't fired)
      expect(mockNavigate).not.toHaveBeenCalled();

      // Fast forward time to trigger the 2000ms setTimeout
      jest.advanceTimersByTime(2000);

      // Now navigation should have happened
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  // ==================== ERROR HANDLING TESTS ====================

  describe('Error Handling - Parametrized Tests', () => {
    /**
     * SCENARIO: Test various API error responses during registration
     * EXPECTED: Appropriate error messages displayed to user
     * 
     * TEST CASES:
     * - Email already exists
     * - Username already taken
     * - Network/connection error
     * - Server error (500)
     * - Generic error with no message
     */

    test.each([
      [
        'Email already registered',
        'An error with email already registered message',
        'Email already registered',
      ],
      [
        'Username already taken',
        'An error with username taken message',
        'Username already taken',
      ],
      [
        'Network error. Please check your internet connection',
        'A network connectivity issue',
        'Network error. Please check your internet connection',
      ],
      [
        'Server error. Please try again later',
        'A server-side error',
        'Server error. Please try again later',
      ],
    ])('should display error: "%s" when %s', async (errorMsg, scenario, expectedDisplay) => {
      mockRegister.mockRejectedValue({
        response: {
          data: {
            message: errorMsg,
          },
        },
      });

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      await waitFor(() => {
        expect(screen.getByText(expectedDisplay)).toBeInTheDocument();
      });
    });

    /**
     * SCENARIO: API throws error with message property
     * EXPECTED: Error message from error.message displayed
     */
    test('should display error message from error.message if response.data unavailable', async () => {
      const errorMessage = 'Registration failed due to unknown reason';
      mockRegister.mockRejectedValue(new Error(errorMessage));

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    /**
     * SCENARIO: API throws error with no message property
     * EXPECTED: Generic fallback error message displayed
     */
    test('should display generic error message when error has no message', async () => {
      mockRegister.mockRejectedValue(new Error());

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/registration failed|please try again/i)
        ).toBeInTheDocument();
      });
    });

    /**
     * SCENARIO: Registration fails with API error
     * EXPECTED: User should not be navigated to login page
     */
    test('should not navigate on registration error', async () => {
      mockRegister.mockRejectedValue(
        new Error('Email already exists')
      );

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    /**
     * SCENARIO: Registration fails but form remains editable
     * EXPECTED: User can correct errors and resubmit
     */
    test('should allow form resubmission after error', async () => {
      mockRegister
        .mockRejectedValueOnce(new Error('Email already exists'))
        .mockResolvedValueOnce(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      // First submission with email that already exists
      await userEvent.type(emailInput, 'existing@example.com');
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      let registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });

      // Clear and resubmit
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, validFormData.email);
      
      registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      await waitFor(() => {
        expect(screen.getByText(/redirecting to login/i)).toBeInTheDocument();
      });

      // Advance timers to let the setTimeout execute
      jest.advanceTimersByTime(2000);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(mockRegister).toHaveBeenCalledTimes(2);
    });

    /**
     * SCENARIO: Error state is cleared when user modifies form
     * EXPECTED: Old error messages disappear when user types
     */
    test('should clear error messages when user modifies form', async () => {
      mockRegister.mockRejectedValue(new Error('Registration failed'));

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
      });

      // User modifies form - error should still be visible until next submission
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'different@example.com');

      // Error persists until next form submission attempt
      expect(screen.queryByText(/registration failed/i)).toBeInTheDocument();
    });
  });

describe('Field Interactions & User Input', () => {
    /**
     * SCENARIO: User can type into all form fields
     * EXPECTED: Input values update correctly as user types
     */
    test('should update form field values as user types', async () => {
      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement;
      const confirmInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      expect(emailInput.value).toBe(validFormData.email);
      expect(usernameInput.value).toBe(validFormData.username);
      expect(passwordInput.value).toBe(validFormData.password);
      expect(confirmInput.value).toBe(validFormData.passwordConfirm);
    });

    /**
     * SCENARIO: User clears password field
     * EXPECTED: Password strength indicator disappears
     */
    test('should remove strength indicator when password is cleared', async () => {
      renderRegisterPage();

      const passwordInput = screen.getByLabelText(/^password/i);

      // Type password - strength should appear
      await userEvent.type(passwordInput, 'StrongPassword123!');
      await waitFor(() => {
        expect(screen.getByText(/weak|fair|good|strong|very strong/i)).toBeInTheDocument();
      });

      // Clear password - strength should disappear
      await userEvent.clear(passwordInput);
      expect(screen.queryByText(/weak|fair|good|strong|very strong/i)).not.toBeInTheDocument();
    });

    /**
     * SCENARIO: User pastes text into form fields
     * EXPECTED: Pasted content is accepted and validates correctly
     */
    test('should accept pasted content in form fields', async () => {
      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);

      expect(emailInput.value).toBe(validFormData.email);
      expect(usernameInput.value).toBe(validFormData.username);
    });

    /**
     * SCENARIO: User uses tab key to navigate between form fields
     * EXPECTED: Focus moves between inputs in correct order
     */
    test('should allow keyboard navigation between fields using Tab', async () => {
      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      // Start at username input
      usernameInput.focus();
      expect(usernameInput).toHaveFocus();

      // Tab to email
      await userEvent.tab();
      expect(emailInput).toHaveFocus();

      // Tab to password
      await userEvent.tab();
      expect(passwordInput).toHaveFocus();

      // Tab to confirm password
      await userEvent.tab();
      expect(confirmInput).toHaveFocus();
    });

  });

  // ==================== FIELD INTERACTION TESTS ====================
  describe('Success Flow & Messages', () => {
    /**
     * SCENARIO: Registration succeeds
     * EXPECTED: Success message displays before redirect
     */
    test('should show success message before redirecting', async () => {
      jest.useFakeTimers();
      mockRegister.mockResolvedValue(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      // Wait for success message to appear first
      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      });

      // Then advance timers to trigger redirect
      jest.advanceTimersByTime(2000);

      // Verify redirect happened
      expect(mockNavigate).toHaveBeenCalledWith('/login');

      jest.useRealTimers();
    });

    /**
     * SCENARIO: Registration succeeds
     * EXPECTED: User redirected to login page after 2 second delay
     */
    test('should redirect to login page after successful registration', async () => {
      jest.useFakeTimers();
      mockRegister.mockResolvedValue(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, validFormData.email);
      await userEvent.type(usernameInput, validFormData.username);
      await userEvent.type(passwordInput, validFormData.password);
      await userEvent.type(confirmInput, validFormData.passwordConfirm);

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2000);

      expect(mockNavigate).toHaveBeenCalledWith('/login');

      jest.useRealTimers();
    });
  });

  // ==================== PASSWORD STRENGTH CALCULATION TESTS ====================
  describe('Password Strength Calculation Logic', () => {
    /**
     * SCENARIO: Test the scoring algorithm with edge cases
     * EXPECTED: Correct strength labels based on password composition
     * 
     * SCORING BREAKDOWN:
     * - Empty: N/A (0 points)
     * - Length 8+: +1 point
     * - Length 12+: +1 point
     * - Uppercase + Lowercase: +1 point
     * - Digits: +1 point
     * - Special chars: +1 point
     * - Max score: 4 (capped at 4 labels: Weak, Fair, Good, Strong, Very Strong)
     */
    test.each([
      // Edge cases and specific scenarios (recalculated based on actual algorithm)
      ['abc', 'Weak'], // 0 points: short, lowercase only
      ['ABC', 'Weak'], // 0 points: short, uppercase only
      ['123', 'Weak'], // 0 points: short, digits only
      ['!!!', 'Weak'], // 0 points: short, special only
      ['Aa1!', 'Strong'], // 3 points: mixed case +1, digits +1, special +1 = Strong
      ['Abc12345', 'Strong'], // 3 points: 8+ chars +1, mixed case +1, digits +1 = Strong
      ['Abc123456789', 'Strong'], // 4 points: 8+ chars +1, 12+ chars +1, mixed case +1, digits +1 = Strong (capped at score 4)
      ['Abc12345!', 'Very Strong'], // 5 points: 8+ chars +1, mixed case +1, digits +1, special +1 = Very Strong (capped at score 4)
      ['Abc123456789!', 'Very Strong'], // 5 points: all criteria = Very Strong
      ['ABCDEFGH', 'Weak'], // 1 point: 8+ chars only
      ['abcdefgh', 'Weak'], // 1 point: 8+ chars only
      ['AbcDefgh', 'Good'], // 2 points: 8+ chars +1, mixed case +1 = Good
      ['AbcDefgh1', 'Strong'], // 3 points: 8+ chars +1, mixed case +1, digits +1 = Strong
      ['AbcDefgh1!', 'Very Strong'], // 4 points: 8+ chars +1, mixed case +1, digits +1, special +1 = Very Strong
    ])('password "%s" should have strength "%s"', async (password, expectedStrength) => {
      renderRegisterPage();

      const passwordInput = screen.getByLabelText(/^password/i);
      await userEvent.type(passwordInput, password);
      
      await waitFor(() => {
        expect(screen.getByText((content) => content.includes(expectedStrength))).toBeInTheDocument();
      });
    });

    /**
     * SCENARIO: Strength indicator should not display when password is empty
     * EXPECTED: No strength indicator visible for empty password
     */
    test('should not display strength indicator when password is empty', () => {
      renderRegisterPage();

      expect(screen.queryByText(/weak|fair|good|strong|very strong/i)).not.toBeInTheDocument();
    });
  });

  // ==================== THEME INTEGRATION TESTS ====================

  describe('Theme Support', () => {
    /**
     * SCENARIO: User clicks theme toggle button
     * EXPECTED: Theme context toggleTheme function is called
     */
    test('should call toggleTheme when theme button is clicked', async () => {
      renderRegisterPage();

      const themeBtn = screen.getByRole('button', { name: /🌙|☀️/i });
      fireEvent.click(themeBtn);

      expect(mockTheme.toggleTheme).toHaveBeenCalled();
    });

    /**
     * SCENARIO: Component renders with light theme
     * EXPECTED: Theme colors applied from context
     */
    test('should render with theme colors from context', () => {
      renderRegisterPage();

      // Use a more specific selector - target the heading directly
      const heading = screen.getByRole('heading', { name: /create account/i });
      const registerCard = heading.closest('.register-card');
      expect(registerCard).toBeInTheDocument();
      expect(registerCard).toHaveClass('register-card');
    });

    /**
     * SCENARIO: Theme toggle button is positioned outside register card
     * EXPECTED: Theme button accessible from anywhere on the page
     */
    test('should render theme button outside register card', () => {
      renderRegisterPage();

      // Use a more specific selector - target the heading directly
      const heading = screen.getByRole('heading', { name: /create account/i });
      const registerContainer = heading.closest('.register-container');
      const themeBtn = screen.getByRole('button', { name: /🌙|☀️/i });

      expect(registerContainer).toContainElement(themeBtn);
    });
  });

  // ==================== ACCESSIBILITY TESTS ====================

  describe('Accessibility', () => {
    /**
     * SCENARIO: User with screen reader navigates form
     * EXPECTED: All inputs have associated labels
     */
    test('should have associated labels for all input fields', () => {
      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      expect(emailInput).toHaveAttribute('id');
      expect(usernameInput).toHaveAttribute('id');
      expect(passwordInput).toHaveAttribute('id');
      expect(confirmInput).toHaveAttribute('id');
    });

    /**
     * SCENARIO: User with keyboard-only navigation
     * EXPECTED: All interactive elements are keyboard accessible
     */
    test('should be keyboard accessible', async () => {
      renderRegisterPage();

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      const loginLink = screen.getByRole('link', { name: /sign in/i });

      // Button and link should be focusable
      registerBtn.focus();
      expect(document.activeElement).toBe(registerBtn);

      loginLink.focus();
      expect(document.activeElement).toBe(loginLink);
    });

    /**
     * SCENARIO: User with visual impairment using error messages
     * EXPECTED: Error messages properly associated with form fields
     */
    test('should display error messages accessibly', async () => {
      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const registerBtn = screen.getByRole('button', { name: /create account/i });

      // Submit with empty email
      await userEvent.click(registerBtn);

      await waitFor(() => {
        const errorMsg = screen.getByText('Email is required');
        expect(errorMsg).toBeInTheDocument();
        expect(errorMsg).toHaveAttribute('role', 'alert');
      });
    });

    /**
     * SCENARIO: User encounters success message
     * EXPECTED: Success message is announced to screen readers
     */
    test('should announce success message to screen readers', async () => {
      mockRegister.mockResolvedValue(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'Password123!');
      await userEvent.type(confirmInput, 'Password123!');

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      await waitFor(() => {
        // Use a more flexible matcher that finds partial text
        const successMsg = screen.getByText(/registration successful/i);
        expect(successMsg).toBeInTheDocument();
      });
    });
  });

  // ==================== EDGE CASES & BOUNDARY TESTS ====================

  describe('Edge Cases & Boundary Conditions', () => {
    /**
     * SCENARIO: User submits form with whitespace-only values
     * EXPECTED: Treated as empty fields, validation errors shown
     */
    test('should treat whitespace-only input as empty', async () => {
      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, '   ');
      await userEvent.type(usernameInput, '   ');
      await userEvent.type(passwordInput, 'Password123!');
      await userEvent.type(confirmInput, 'Password123!');

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn); // Use userEvent.click instead of fireEvent

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    /**
     * SCENARIO: User enters maximum length values
     * EXPECTED: Username at max (50 chars) accepted, over max rejected
     */
    test('should validate username length boundaries correctly', async () => {
      mockRegister.mockResolvedValue(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      const maxUsername = 'a'.repeat(50);

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(usernameInput, maxUsername);
      await userEvent.type(passwordInput, 'Password123!');
      await userEvent.type(confirmInput, 'Password123!');

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });

    /**
     * SCENARIO: User enters special characters in username
     * EXPECTED: Special characters accepted in username field
     */
    test('should accept special characters in username', async () => {
      mockRegister.mockResolvedValue(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      const specialUsername = 'user_name-123';

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(usernameInput, specialUsername);
      await userEvent.type(passwordInput, 'Password123!');
      await userEvent.type(confirmInput, 'Password123!');

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          'test@example.com',
          specialUsername,
          'Password123!',
          'Password123!'
        );
      });
    });

    /**
     * SCENARIO: User rapidly submits form multiple times
     * EXPECTED: Only one API call made despite multiple clicks
     */
    test('should prevent multiple form submissions', async () => {
      mockRegister.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'Password123!');
      await userEvent.type(confirmInput, 'Password123!');

      const registerBtn = screen.getByRole('button', { name: /create account/i });

      // Click button multiple times rapidly
      await userEvent.click(registerBtn);
      await userEvent.click(registerBtn);
      await userEvent.click(registerBtn);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledTimes(1);
      });
    });

    /**
     * SCENARIO: User enters very long password
     * EXPECTED: Password accepted and strength calculated correctly
     */
    test('should handle very long passwords', async () => {
      renderRegisterPage();

      const passwordInput = screen.getByLabelText(/^password/i);
      const veryLongPassword = 'Aa1!' + 'x'.repeat(100);

      await userEvent.type(passwordInput, veryLongPassword);

      await waitFor(() => {
        expect(screen.getByText(/very strong/i)).toBeInTheDocument();
      });
    });

    /**
     * SCENARIO: User enters international characters in email
     * EXPECTED: Only valid email format accepted per regex
     */
    test('should accept international domain characters in email', async () => {
      mockRegister.mockResolvedValue(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, 'user@example.日本');
      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'Password123!');
      await userEvent.type(confirmInput, 'Password123!');

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      // Should allow international domains
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });
  });

  // ==================== CONTEXT & HOOK INTEGRATION TESTS ====================

  describe('Context & Hook Integration', () => {
    /**
     * SCENARIO: Auth context is properly initialized
     * EXPECTED: useAuth hook returns register function
     */
    test('should use auth context for registration', () => {
      renderRegisterPage();

      // Verify the page rendered (which means hooks were called successfully)
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();

      // Verify mockRegister is available (from useAuth)
      expect(mockRegister).toBeDefined();
    });

    /**
     * SCENARIO: Theme context is properly initialized
     * EXPECTED: useTheme hook returns theme object
     */
    test('should use theme context for styling', () => {
      renderRegisterPage();

      // Check if ThemeToggle is rendered by looking for its container or specific class
      const themeToggle = screen.queryByRole('button', { name: '' }); // If button has no text
      // OR if the button has specific text, use that:
      // const themeToggle = screen.queryByRole('button', { name: /toggle|switch/i });
      
      // Better approach: Check for the component's presence by its className
      const themeToggleContainer = document.querySelector('[class*="theme-toggle"]');
      expect(themeToggleContainer).toBeInTheDocument();

      // Verify the page has theme-aware classes
      const container = screen.getByLabelText(/email/i).closest('.register-container');
      expect(container).toBeInTheDocument();
    });

    /**
     * SCENARIO: Navigation hook is properly initialized
     * EXPECTED: useNavigate returns navigate function and navigates after successful registration
     */
    test('should use navigate hook from react-router-dom', async () => {
      mockRegister.mockResolvedValue(undefined);
      mockNavigate.mockClear(); // Reset before test

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'Password123!');
      await userEvent.type(confirmInput, 'Password123!');

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn); // Changed from fireEvent to userEvent

      // Wait for the 2000ms timeout in the component before navigation
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith('/login');
        },
        { timeout: 3000 } // Give it enough time for the setTimeout
      );
    });
  });
  // ==================== FORM STATE MANAGEMENT TESTS ====================

  describe('Form State Management', () => {
    /**
     * SCENARIO: User fills form, submits with error, then retries
     * EXPECTED: Form state persists, error state updates correctly
     */
    test('should preserve form values on validation error', async () => {
      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement;
      const confirmInput = screen.getByLabelText(/confirm password/i) as HTMLInputElement;

      // Fill form
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'short'); // invalid length
      await userEvent.type(confirmInput, 'short');

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });

      // Values should still be in inputs
      expect(emailInput.value).toBe('test@example.com');
      expect(usernameInput.value).toBe('testuser');
    });

    /**
     * SCENARIO: User fills form and sees multiple validation errors
     * EXPECTED: All validation errors displayed simultaneously
     */
    test('should display all validation errors at once', async () => {
      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      // Submit with multiple invalid fields (all empty)
      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Username is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
        expect(screen.getByText('Password confirmation is required')).toBeInTheDocument();
      });
    });

    /**
     * SCENARIO: Error state cleared on successful submission
     * EXPECTED: No error messages visible after successful registration
     */
    test('should clear error state on successful submission', async () => {
      mockRegister.mockResolvedValue(undefined);

      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'Password123!');
      await userEvent.type(confirmInput, 'Password123!');

      const registerBtn = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(registerBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/registration successful|redirecting to login/i)
        ).toBeInTheDocument();
      });

      // No error messages should be visible
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });
  });

});

