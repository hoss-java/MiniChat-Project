// src/components/__tests__/RegisterComponents.test.tsx

/**
 * RegisterComponents Test Suite
 * 
 * This test file covers all registration-related UI components used in the authentication flow.
 * Each component is tested for:
 * - Rendering with required props
 * - Proper child/content rendering
 * - Event handler callbacks
 * - Error state display
 * - Loading state handling
 * - Disabled state management
 * - Form field interactions
 * - Password strength visualization
 * - Navigation links
 * - Input value changes and validation feedback
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import {
  RegisterContainer,
  RegisterCard,
  RegisterHeader,
  RegisterFormInputs,
  PasswordStrengthIndicator,
  RegisterSubmitButton,
  LoginLink,
} from '../RegisterComponents';
import * as ThemeContext from '../../contexts/ThemeContext';

// Mock the useTheme hook
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

/**
 * Mock colors object used across all tests
 * Represents the color palette passed from ThemeContext
 */
const mockColors = {
  background: '#ffffff',
  surface: '#f5f5f5',
  border: '#e0e0e0',
  primary: '#007bff',
  text: '#000000',
  textSecondary: '#666666',
  error: '#dc3545',
};

// ============================================================================
// REGISTER CONTAINER COMPONENT TESTS
// ============================================================================
/**
 * RegisterContainer: A wrapper component that applies register-specific styling
 * Scenarios:
 * 1. Renders children content
 * 2. Applies register-container class for CSS styling
 * 3. Acts as a flex/grid container for register form layout
 * 4. Can contain multiple child elements
 */
describe('RegisterContainer', () => {
  test('should render children inside container', () => {
    render(
      <RegisterContainer>
        <div>Registration Form Content</div>
      </RegisterContainer>
    );
    expect(screen.getByText('Registration Form Content')).toBeInTheDocument();
  });

  test('should apply register-container class for styling', () => {
    const { container } = render(
      <RegisterContainer>
        <span>Content</span>
      </RegisterContainer>
    );
    expect(container.querySelector('.register-container')).toBeInTheDocument();
  });

  test('should render multiple children elements', () => {
    render(
      <RegisterContainer>
        <div>Header</div>
        <div>Form</div>
        <div>Footer</div>
      </RegisterContainer>
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Form')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});

// ============================================================================
// REGISTER CARD COMPONENT TESTS
// ============================================================================
/**
 * RegisterCard: A card component that wraps form content with shadow/elevation
 * Scenarios:
 * 1. Renders children inside card
 * 2. Applies register-card class for elevation styling
 * 3. Can contain form elements
 * 4. Provides visual separation and styling for registration form
 */
describe('RegisterCard', () => {
  test('should render children inside card', () => {
    render(
      <RegisterCard>
        <div>Form Fields</div>
      </RegisterCard>
    );
    expect(screen.getByText('Form Fields')).toBeInTheDocument();
  });

  test('should apply register-card class for styling', () => {
    const { container } = render(
      <RegisterCard>
        <span>Content</span>
      </RegisterCard>
    );
    expect(container.querySelector('.register-card')).toBeInTheDocument();
  });

  test('should wrap form elements with card styling', () => {
    const { container } = render(
      <RegisterCard>
        <input type="text" placeholder="username" />
        <input type="email" placeholder="email" />
        <input type="password" placeholder="password" />
        <button>Register</button>
      </RegisterCard>
    );
    const card = container.querySelector('.register-card');
    expect(card?.querySelector('input[type="text"]')).toBeInTheDocument();
    expect(card?.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(card?.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(card?.querySelector('button')).toBeInTheDocument();
  });
});

// ============================================================================
// REGISTER HEADER COMPONENT TESTS
// ============================================================================
/**
 * RegisterHeader: Displays the registration title and tagline at top of register page
 * Scenarios:
 * 1. Renders heading "Create Account"
 * 2. Renders tagline "Join miniChat and start secure conversations"
 * 3. Uses Heading level 1 for title (accessibility)
 * 4. Uses secondary text variant for tagline
 * 5. Wrapped in register-header section for semantic HTML
 */
describe('RegisterHeader', () => {
  test('should render heading "Create Account"', () => {
    render(<RegisterHeader />);
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  test('should render tagline text', () => {
    render(<RegisterHeader />);
    expect(screen.getByText('Join miniChat and start secure conversations')).toBeInTheDocument();
  });

  test('should render heading as h1 for accessibility', () => {
    const { container } = render(<RegisterHeader />);
    const heading = container.querySelector('h1');
    expect(heading).toBeInTheDocument();
    expect(heading?.textContent).toBe('Create Account');
  });

  test('should render tagline with secondary text variant', () => {
    const { container } = render(<RegisterHeader />);
    const tagline = container.querySelector('.text-secondary');
    expect(tagline).toBeInTheDocument();
    expect(tagline?.textContent).toBe('Join miniChat and start secure conversations');
  });

  test('should be wrapped in register-header section', () => {
    const { container } = render(<RegisterHeader />);
    expect(container.querySelector('.register-header')).toBeInTheDocument();
  });
});

// ============================================================================
// REGISTER FORM INPUTS COMPONENT TESTS
// ============================================================================
/**
 * RegisterFormInputs: Renders all registration form input fields
 * Scenarios:
 * 1. Renders username input field with label and placeholder
 * 2. Renders email input field with label and placeholder
 * 3. Renders password input field with label and placeholder
 * 4. Renders password confirm input field with label and placeholder
 * 5. Displays error messages for each field when provided
 * 6. Calls onChange callbacks when user enters values
 * 7. Disables all fields when isLoading is true
 * 8. Updates input values from props
 * 9. Displays error states visually
 * 10. Handles rapid input changes
 */
describe('RegisterFormInputs', () => {
  const mockHandlers = {
    onUsernameChange: jest.fn(),
    onEmailChange: jest.fn(),
    onPasswordChange: jest.fn(),
    onPasswordConfirmChange: jest.fn(),
  };

  const defaultProps = {
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    errors: {},
    isLoading: false,
    ...mockHandlers,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Username input rendering and interaction
  test('should render username input field', () => {
    render(<RegisterFormInputs {...defaultProps} />);
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    expect(usernameInput).toBeInTheDocument();
    expect(usernameInput).toHaveAttribute('type', 'text');
  });

  test('should display username label', () => {
    render(<RegisterFormInputs {...defaultProps} />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  test('should call onUsernameChange when username input changes', async () => {
    render(<RegisterFormInputs {...defaultProps} />);
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    await userEvent.type(usernameInput, 'testuser');
    expect(mockHandlers.onUsernameChange).toHaveBeenCalled();
  });


  test('should display username value from props', () => {
    render(<RegisterFormInputs {...defaultProps} username="john_doe" />);
    const usernameInput = screen.getByPlaceholderText('Enter your username') as HTMLInputElement;
    expect(usernameInput.value).toBe('john_doe');
  });

  test('should display username error when provided', () => {
    render(
      <RegisterFormInputs
        {...defaultProps}
        errors={{ username: 'Username already taken' }}
      />
    );
    expect(screen.getByText('Username already taken')).toBeInTheDocument();
  });

  test('should disable username input when isLoading is true', () => {
    render(<RegisterFormInputs {...defaultProps} isLoading={true} />);
    const usernameInput = screen.getByPlaceholderText('Enter your username');
    expect(usernameInput).toBeDisabled();
  });

  // Test 2: Email input rendering and interaction
  test('should render email input field', () => {
    render(<RegisterFormInputs {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText('you@example.com');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should display email label', () => {
    render(<RegisterFormInputs {...defaultProps} />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  test('should call onEmailChange when email input changes', async () => {
    render(<RegisterFormInputs {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText('you@example.com');
    await userEvent.type(emailInput, 'test@example.com');
    expect(mockHandlers.onEmailChange).toHaveBeenCalled();
  });

  test('should display email value from props', () => {
    render(<RegisterFormInputs {...defaultProps} email="user@example.com" />);
    const emailInput = screen.getByPlaceholderText('you@example.com') as HTMLInputElement;
    expect(emailInput.value).toBe('user@example.com');
  });

  test('should display email error when provided', () => {
    render(
      <RegisterFormInputs
        {...defaultProps}
        errors={{ email: 'Email already registered' }}
      />
    );
    expect(screen.getByText('Email already registered')).toBeInTheDocument();
  });

  test('should disable email input when isLoading is true', () => {
    render(<RegisterFormInputs {...defaultProps} isLoading={true} />);
    const emailInput = screen.getByPlaceholderText('you@example.com');
    expect(emailInput).toBeDisabled();
  });

  // Test 3: Password input rendering and interaction
  test('should render password input field', () => {
    render(<RegisterFormInputs {...defaultProps} />);
    const passwordInputs = screen.getAllByPlaceholderText(/Enter your password|Confirm your password/);
    expect(passwordInputs.length).toBeGreaterThanOrEqual(1);
    expect(passwordInputs[0]).toHaveAttribute('type', 'password');
  });

  test('should display password label', () => {
    render(<RegisterFormInputs {...defaultProps} />);
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  test('should call onPasswordChange when password input changes', async () => {
    render(<RegisterFormInputs {...defaultProps} />);
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    await userEvent.type(passwordInput, 'securePassword123');
    expect(mockHandlers.onPasswordChange).toHaveBeenCalled();
  });

  test('should display password value from props', () => {
    render(<RegisterFormInputs {...defaultProps} password="myPassword" />);
    const passwordInput = screen.getByPlaceholderText('Enter your password') as HTMLInputElement;
    expect(passwordInput.value).toBe('myPassword');
  });

  test('should display password error when provided', () => {
    render(
      <RegisterFormInputs
        {...defaultProps}
        errors={{ password: 'Password must be at least 8 characters' }}
      />
    );
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  test('should disable password input when isLoading is true', () => {
    render(<RegisterFormInputs {...defaultProps} isLoading={true} />);
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    expect(passwordInput).toBeDisabled();
  });

  // Test 4: Password confirm input rendering and interaction
  test('should render password confirm input field', () => {
    render(<RegisterFormInputs {...defaultProps} />);
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    expect(confirmPasswordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  test('should display confirm password label', () => {
    render(<RegisterFormInputs {...defaultProps} />);
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  test('should call onPasswordConfirmChange when confirm password input changes', async () => {
    render(<RegisterFormInputs {...defaultProps} />);
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    await userEvent.type(confirmPasswordInput, 'securePassword123');
    expect(mockHandlers.onPasswordConfirmChange).toHaveBeenCalled();
  });

  test('should display password confirm value from props', () => {
    render(<RegisterFormInputs {...defaultProps} passwordConfirm="myPassword" />);
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password') as HTMLInputElement;
    expect(confirmPasswordInput.value).toBe('myPassword');
  });

  test('should display password confirm error when provided', () => {
    render(
      <RegisterFormInputs
        {...defaultProps}
        errors={{ passwordConfirm: 'Passwords do not match' }}
      />
    );
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  test('should disable password confirm input when isLoading is true', () => {
    render(<RegisterFormInputs {...defaultProps} isLoading={true} />);
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
    expect(confirmPasswordInput).toBeDisabled();
  });

  // Test 5: Multiple error states
  test('should display multiple errors simultaneously', () => {
    render(
      <RegisterFormInputs
        {...defaultProps}
        errors={{
          username: 'Username taken',
          email: 'Email registered',
          password: 'Too short',
          passwordConfirm: 'Mismatch',
        }}
      />
    );
    expect(screen.getByText('Username taken')).toBeInTheDocument();
    expect(screen.getByText('Email registered')).toBeInTheDocument();
    expect(screen.getByText('Too short')).toBeInTheDocument();
    expect(screen.getByText('Mismatch')).toBeInTheDocument();
  });

  // Test 6: Loading state disables all inputs
  test('should disable all inputs when isLoading is true', () => {
    render(<RegisterFormInputs {...defaultProps} isLoading={true} />);
    const allInputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    allInputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  // Test 7: All inputs enabled when not loading
  test('should enable all inputs when isLoading is false', () => {
    render(<RegisterFormInputs {...defaultProps} isLoading={false} />);
    const allInputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    allInputs.forEach((input) => {
      expect(input).not.toBeDisabled();
    });
  });
});

// ============================================================================
// PASSWORD STRENGTH INDICATOR COMPONENT TESTS
// ============================================================================
/**
 * PasswordStrengthIndicator: Displays password strength as a visual progress bar
 * Scenarios:
 * 1. Renders strength bar container
 * 2. Renders filled portion of strength bar based on score
 * 3. Applies correct color based on strength level
 * 4. Displays strength label text (Weak, Fair, Good, Strong)
 * 5. Updates width percentage based on password strength score (0-3)
 * 6. Shows strength label with appropriate color styling
 * 7. Handles all strength levels correctly
 */
describe('PasswordStrengthIndicator', () => {
  test('should render strength bar container', () => {
    const strength = { score: 0, label: 'Weak', color: '#dc3545' };
    const { container } = render(<PasswordStrengthIndicator strength={strength} />);
    expect(container.querySelector('.password-strength')).toBeInTheDocument();
  });

  test('should render strength bar and fill elements', () => {
    const strength = { score: 0, label: 'Weak', color: '#dc3545' };
    const { container } = render(<PasswordStrengthIndicator strength={strength} />);
    expect(container.querySelector('.strength-bar')).toBeInTheDocument();
    expect(container.querySelector('.strength-fill')).toBeInTheDocument();
  });

  test('should display strength label text', () => {
    const strength = { score: 2, label: 'Good', color: '#ffc107' };
    render(<PasswordStrengthIndicator strength={strength} />);
    expect(screen.getByText(/Strength: Good/)).toBeInTheDocument();
  });

  test('should apply correct background color to strength fill for weak password', () => {
    const strength = { score: 0, label: 'Weak', color: '#dc3545' };
    const { container } = render(<PasswordStrengthIndicator strength={strength} />);
    const strengthFill = container.querySelector('.strength-fill') as HTMLElement;
    expect(strengthFill).toHaveStyle({ backgroundColor: '#dc3545' });
  });

  test('should apply correct background color to strength fill for strong password', () => {
    const strength = { score: 3, label: 'Strong', color: '#28a745' };
    const { container } = render(<PasswordStrengthIndicator strength={strength} />);
    const strengthFill = container.querySelector('.strength-fill') as HTMLElement;
    expect(strengthFill).toHaveStyle({ backgroundColor: '#28a745' });
  });

  test('should apply correct color to strength label text', () => {
    const strength = { score: 1, label: 'Fair', color: '#fd7e14' };
    const { container } = render(<PasswordStrengthIndicator strength={strength} />);
    const strengthLabel = container.querySelector('.strength-label') as HTMLElement;
    expect(strengthLabel).toHaveStyle({ color: '#fd7e14' });
  });

  test('should calculate correct width for score 0 (Weak)', () => {
    const strength = { score: 0, label: 'Weak', color: '#dc3545' };
    const { container } = render(<PasswordStrengthIndicator strength={strength} />);
    const strengthFill = container.querySelector('.strength-fill') as HTMLElement;
    // (0 + 1) * 25 = 25%
    expect(strengthFill).toHaveStyle({ width: '25%' });
  });

  test('should calculate correct width for score 1 (Fair)', () => {
    const strength = { score: 1, label: 'Fair', color: '#fd7e14' };
    const { container } = render(<PasswordStrengthIndicator strength={strength} />);
    const strengthFill = container.querySelector('.strength-fill') as HTMLElement;
    // (1 + 1) * 25 = 50%
    expect(strengthFill).toHaveStyle({ width: '50%' });
  });

  test('should calculate correct width for score 2 (Good)', () => {
    const strength = { score: 2, label: 'Good', color: '#ffc107' };
    const { container } = render(<PasswordStrengthIndicator strength={strength} />);
    const strengthFill = container.querySelector('.strength-fill') as HTMLElement;
    // (2 + 1) * 25 = 75%
    expect(strengthFill).toHaveStyle({ width: '75%' });
  });

  test('should calculate correct width for score 3 (Strong)', () => {
    const strength = { score: 3, label: 'Strong', color: '#28a745' };
    const { container } = render(<PasswordStrengthIndicator strength={strength} />);
    const strengthFill = container.querySelector('.strength-fill') as HTMLElement;
    // (3 + 1) * 25 = 100%
    expect(strengthFill).toHaveStyle({ width: '100%' });
  });

  test('should render all strength levels correctly', () => {
    const strengthLevels = [
      { score: 0, label: 'Weak', color: '#dc3545' },
      { score: 1, label: 'Fair', color: '#fd7e14' },
      { score: 2, label: 'Good', color: '#ffc107' },
      { score: 3, label: 'Strong', color: '#28a745' },
    ];

    strengthLevels.forEach((strength) => {
      const { unmount } = render(
        <PasswordStrengthIndicator strength={strength} />
      );
      expect(screen.getByText(new RegExp(`Strength: ${strength.label}`))).toBeInTheDocument();
      unmount();
    });
  });
});

// ============================================================================
// REGISTER SUBMIT BUTTON COMPONENT TESTS
// ============================================================================
/**
 * RegisterSubmitButton: Renders the form submission button for registration
 * Scenarios:
 * 1. Renders button with text "Create Account"
 * 2. Button type is "submit"
 * 3. Button has primary variant styling
 * 4. Button has register-submit class
 * 5. Button is disabled when isLoading is true
 * 6. Button is enabled when isLoading is false
 * 7. Button shows loading state when isLoading is true
 * 8. Button is clickable when not loading
 */
describe('RegisterSubmitButton', () => {
  test('should render button with "Create Account" text', () => {
    render(<RegisterSubmitButton isLoading={false} />);
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  test('should have submit type', () => {
    render(<RegisterSubmitButton isLoading={false} />);
    const button = screen.getByRole('button', { name: /Create Account/i });
    expect(button).toHaveAttribute('type', 'submit');
  });

  test('should apply register-submit class', () => {
    const { container } = render(<RegisterSubmitButton isLoading={false} />);
    expect(container.querySelector('.register-submit')).toBeInTheDocument();
  });

  test('should be disabled when isLoading is true', () => {
    render(<RegisterSubmitButton isLoading={true} />);
    const button = screen.getByRole('button', { name: /Loading/i });
    expect(button).toBeDisabled();
  });

  test('should be enabled when isLoading is false', () => {
    render(<RegisterSubmitButton isLoading={false} />);
    const button = screen.getByRole('button', { name: /Create Account/i });
    expect(button).not.toBeDisabled();
  });

  test('should have loading prop set to true when isLoading is true', () => {
    const { container } = render(<RegisterSubmitButton isLoading={true} />);
    const button = container.querySelector('button');
    expect(button).toBeDisabled();
  });

  test('should be clickable when not loading', () => {
    render(<RegisterSubmitButton isLoading={false} />);
    const button = screen.getByRole('button', { name: /Create Account/i });
    expect(button).not.toBeDisabled();
  });

  test('should toggle disabled state when isLoading prop changes', () => {
    const { rerender } = render(<RegisterSubmitButton isLoading={false} />);
    let button = screen.getByRole('button', { name: /Create Account/i });
    expect(button).not.toBeDisabled();

    rerender(<RegisterSubmitButton isLoading={true} />);
    button = screen.getByRole('button', { name: /Loading/i });
    expect(button).toBeDisabled();

    rerender(<RegisterSubmitButton isLoading={false} />);
    button = screen.getByRole('button', { name: /Create Account/i });
    expect(button).not.toBeDisabled();
  });
});


// ============================================================================
// LOGIN LINK COMPONENT TESTS
// ============================================================================
/**
 * LoginLink: Renders a link for users who already have an account
 * Scenarios:
 * 1. Renders section with login-link class
 * 2. Displays secondary text variant
 * 3. Displays text "Already have an account?"
 * 4. Renders link to "/login" route
 * 5. Link displays text "Sign in"
 * 6. Link has proper href attribute
 * 7. Link is clickable and navigable
 * 8. Uses react-router-dom Link component
 */
describe('LoginLink', () => {
  test('should render login-link section', () => {
    const { container } = render(
      <BrowserRouter>
        <LoginLink />
      </BrowserRouter>
    );
    expect(container.querySelector('.login-link')).toBeInTheDocument();
  });

  test('should render secondary text variant', () => {
    const { container } = render(
      <BrowserRouter>
        <LoginLink />
      </BrowserRouter>
    );
    expect(container.querySelector('.text-secondary')).toBeInTheDocument();
  });

  test('should display "Already have an account?" text', () => {
    render(
      <BrowserRouter>
        <LoginLink />
      </BrowserRouter>
    );
    expect(screen.getByText(/Already have an account/)).toBeInTheDocument();
  });

  test('should render link with "Sign in" text', () => {
    render(
      <BrowserRouter>
        <LoginLink />
      </BrowserRouter>
    );
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  test('should have link with href to /login', () => {
    render(
      <BrowserRouter>
        <LoginLink />
      </BrowserRouter>
    );
    const link = screen.getByRole('link', { name: /Sign in/i });
    expect(link).toHaveAttribute('href', '/login');
  });

  test('should have link class applied to navigation link', () => {
    const { container } = render(
      <BrowserRouter>
        <LoginLink />
      </BrowserRouter>
    );
    expect(container.querySelector('.link')).toBeInTheDocument();
  });

  test('should render complete text with link together', () => {
    render(
      <BrowserRouter>
        <LoginLink />
      </BrowserRouter>
    );
    const section = screen.getByText(/Already have an account/).closest('.text-secondary');
    expect(section).toBeInTheDocument();
    expect(section?.querySelector('a')).toBeInTheDocument();
  });

  test('should be wrapped in Section component', () => {
    const { container } = render(
      <BrowserRouter>
        <LoginLink />
      </BrowserRouter>
    );
    const section = container.querySelector('.login-link');
    expect(section?.querySelector('a')).toBeInTheDocument();
  });
});

