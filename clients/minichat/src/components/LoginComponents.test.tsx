// src/components/__tests__/LoginComponents.test.tsx

/**
 * LoginComponents Test Suite
 * 
 * This test file covers all login-related UI components used in the authentication flow.
 * Each component is tested for:
 * - Rendering with required props
 * - Proper child/content rendering
 * - Event handler callbacks
 * - Error state display
 * - Loading state handling
 * - Disabled state management
 * - Theme/color prop application
 * - Navigation links
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import {
  LoginContainer,
  LoginCard,
  LoginHeader,
  ThemeToggle,
  LoginFormInputs,
  LoginRememberMe,
  LoginSubmitButton,
  RegisterLink,
} from './LoginComponents';

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
// LOGIN CONTAINER COMPONENT TESTS
// ============================================================================
/**
 * LoginContainer: A wrapper component that applies login-specific styling
 * Scenarios:
 * 1. Renders children content
 * 2. Applies login-container class for CSS styling
 * 3. Accepts colors prop (even if not currently used, for future extensibility)
 * 4. Acts as a flex/grid container for login form layout
 */
describe('LoginContainer', () => {
  test('should render children inside container', () => {
    render(
      <LoginContainer colors={mockColors}>
        <div>Login Form Content</div>
      </LoginContainer>
    );
    expect(screen.getByText('Login Form Content')).toBeInTheDocument();
  });

  test('should apply login-container class for styling', () => {
    const { container } = render(
      <LoginContainer colors={mockColors}>
        <span>Content</span>
      </LoginContainer>
    );
    expect(container.querySelector('.login-container')).toBeInTheDocument();
  });

  test('should render multiple children elements', () => {
    render(
      <LoginContainer colors={mockColors}>
        <div>Header</div>
        <div>Form</div>
        <div>Footer</div>
      </LoginContainer>
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Form')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});

// ============================================================================
// LOGIN CARD COMPONENT TESTS
// ============================================================================
/**
 * LoginCard: A card component that wraps form content with shadow/elevation
 * Scenarios:
 * 1. Renders children inside card
 * 2. Applies login-card class for elevation styling
 * 3. Accepts colors prop (for future background/border customization)
 * 4. Can contain form elements or other components
 */
describe('LoginCard', () => {
  test('should render children inside card', () => {
    render(
      <LoginCard colors={mockColors}>
        <div>Form Fields</div>
      </LoginCard>
    );
    expect(screen.getByText('Form Fields')).toBeInTheDocument();
  });

  test('should apply login-card class for styling', () => {
    const { container } = render(
      <LoginCard colors={mockColors}>
        <span>Content</span>
      </LoginCard>
    );
    expect(container.querySelector('.login-card')).toBeInTheDocument();
  });

  test('should wrap form elements with card styling', () => {
    const { container } = render(
      <LoginCard colors={mockColors}>
        <input type="text" placeholder="username" />
        <input type="password" placeholder="password" />
        <button>Login</button>
      </LoginCard>
    );
    const card = container.querySelector('.login-card');
    expect(card?.querySelector('input[type="text"]')).toBeInTheDocument();
    expect(card?.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(card?.querySelector('button')).toBeInTheDocument();
  });
});

// ============================================================================
// LOGIN HEADER COMPONENT TESTS
// ============================================================================
/**
 * LoginHeader: Displays the app title and tagline at top of login page
 * Scenarios:
 * 1. Renders app title "miniCh"
 * 2. Renders tagline "Secure P2P Messaging"
 * 3. Uses Heading level 1 for title (accessibility)
 * 4. Uses secondary text variant for tagline
 * 5. Wrapped in Section for semantic HTML
 */
describe('LoginHeader', () => {
  test('should render app title "miniCh"', () => {
    render(<LoginHeader colors={mockColors} />);
    expect(screen.getByText('miniCh')).toBeInTheDocument();
  });

  test('should render tagline "Secure P2P Messaging"', () => {
    render(<LoginHeader colors={mockColors} />);
    expect(screen.getByText('Secure P2P Messaging')).toBeInTheDocument();
  });

  test('should render title as h1 for accessibility', () => {
    const { container } = render(<LoginHeader colors={mockColors} />);
    const heading = container.querySelector('h1');
    expect(heading).toBeInTheDocument();
    expect(heading?.textContent).toBe('miniCh');
  });

  test('should render tagline with secondary text variant', () => {
    const { container } = render(<LoginHeader colors={mockColors} />);
    const tagline = container.querySelector('.text-secondary');
    expect(tagline).toBeInTheDocument();
    expect(tagline?.textContent).toBe('Secure P2P Messaging');
  });

  test('should be wrapped in login-header section', () => {
    const { container } = render(<LoginHeader colors={mockColors} />);
    expect(container.querySelector('.login-header')).toBeInTheDocument();
  });

  test('should accept colors prop without breaking', () => {
    // Verify component renders even with different color values
    const customColors = { ...mockColors, primary: '#ff0000' };
    render(<LoginHeader colors={customColors} />);
    expect(screen.getByText('miniCh')).toBeInTheDocument();
  });
});

// ============================================================================
// THEME TOGGLE COMPONENT TESTS
// ============================================================================
/**
 * ThemeToggle: Button that switches between light/dark theme
 * Scenarios:
 * 1. Displays moon emoji (🌙) when theme is "light"
 * 2. Displays sun emoji (☀️) when theme is "dark"
 * 3. Calls onToggle callback when clicked
 * 4. Uses primary variant for consistent styling
 * 5. Has theme-toggle class for custom CSS
 */
describe('ThemeToggle', () => {
  test('should display moon emoji when theme is light', () => {
    render(
      <ThemeToggle colors={mockColors} theme="light" onToggle={() => {}} />
    );
    expect(screen.getByRole('button', { name: '🌙' })).toBeInTheDocument();
  });

  test('should display sun emoji when theme is dark', () => {
    render(
      <ThemeToggle colors={mockColors} theme="dark" onToggle={() => {}} />
    );
    expect(screen.getByRole('button', { name: '☀️' })).toBeInTheDocument();
  });

  test('should call onToggle callback when clicked', () => {
    const handleToggle = jest.fn();
    render(
      <ThemeToggle colors={mockColors} theme="light" onToggle={handleToggle} />
    );
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  test('should call onToggle multiple times on multiple clicks', () => {
    const handleToggle = jest.fn();
    render(
      <ThemeToggle colors={mockColors} theme="light" onToggle={handleToggle} />
    );
    const button = screen.getByRole('button');

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    expect(handleToggle).toHaveBeenCalledTimes(3);
  });

  test('should apply theme-toggle class', () => {
    const { container } = render(
      <ThemeToggle colors={mockColors} theme="light" onToggle={() => {}} />
    );
    expect(container.querySelector('.theme-toggle')).toBeInTheDocument();
  });

  test('should use primary variant button style', () => {
    const { container } = render(
      <ThemeToggle colors={mockColors} theme="light" onToggle={() => {}} />
    );
    expect(container.querySelector('.btn-primary')).toBeInTheDocument();
  });
});

// ============================================================================
// LOGIN FORM INPUTS COMPONENT TESTS
// ============================================================================
/**
 * LoginFormInputs: Compound component containing username and password inputs
 * Scenarios:
 * 1. Renders both username and password input fields
 * 2. Username input has correct label and placeholder
 * 3. Password input is type="password" (masked)
 * 4. Displays username error when errors.username exists
 * 5. Displays password error when errors.password exists
 * 6. Calls onUsernameChange callback with value
 * 7. Calls onPasswordChange callback with value
 * 8. Disables both inputs when isLoading is true
 * 9. Enables inputs when isLoading is false
 */
describe('LoginFormInputs', () => {
  const defaultProps = {
    username: '',
    password: '',
    errors: {},
    isLoading: false,
    colors: mockColors,
    onUsernameChange: jest.fn(),
    onPasswordChange: jest.fn(),
  };

  test('should render username input field', () => {
    render(<LoginFormInputs {...defaultProps} />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  test('should render password input field with type="password"', () => {
    render(<LoginFormInputs {...defaultProps} />);
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput.type).toBe('password');
  });

  test('should display username placeholder', () => {
    render(<LoginFormInputs {...defaultProps} />);
    expect(screen.getByPlaceholderText('your_username')).toBeInTheDocument();
  });

  test('should display password placeholder (masked)', () => {
    render(<LoginFormInputs {...defaultProps} />);
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  test('should show username error message when errors.username exists', () => {
    const props = {
      ...defaultProps,
      errors: { username: 'Username is required' },
    };
    render(<LoginFormInputs {...props} />);
    expect(screen.getByText('Username is required')).toBeInTheDocument();
  });

  test('should show password error message when errors.password exists', () => {
    const props = {
      ...defaultProps,
      errors: { password: 'Password is incorrect' },
    };
    render(<LoginFormInputs {...props} />);
    expect(screen.getByText('Password is incorrect')).toBeInTheDocument();
  });

  test('should show both error messages when both fields have errors', () => {
    const props = {
      ...defaultProps,
      errors: { 
        username: 'Username is required',
        password: 'Password is required',
      },
    };
    render(<LoginFormInputs {...props} />);
    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  // ============================================================================
  // CORRECTED: LoginFormInputs onChange tests
  // ============================================================================

  test('should call onUsernameChange when username input changes', async () => {
    const handleUsernameChange = jest.fn();
    render(
      <LoginFormInputs 
        {...defaultProps} 
        onUsernameChange={handleUsernameChange}
      />
    );
    const usernameInput = screen.getByLabelText('Username') as HTMLInputElement;

    // Use fireEvent.change for controlled components
    fireEvent.change(usernameInput, { target: { value: 'john_doe' } });
    
    expect(handleUsernameChange).toHaveBeenCalledTimes(1);
    expect(handleUsernameChange).toHaveBeenCalledWith('john_doe');
  });

  test('should call onPasswordChange when password input changes', async () => {
    const handlePasswordChange = jest.fn();
    render(
      <LoginFormInputs 
        {...defaultProps} 
        onPasswordChange={handlePasswordChange}
      />
    );
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'pass123' } });
    
    expect(handlePasswordChange).toHaveBeenCalledTimes(1);
    expect(handlePasswordChange).toHaveBeenCalledWith('pass123');
  });

  test('should display current username value in input', () => {
    const props = { ...defaultProps, username: 'alice_smith' };
    render(<LoginFormInputs {...props} />);
    expect(screen.getByDisplayValue('alice_smith')).toBeInTheDocument();
  });

  test('should display current password value in input', () => {
    const props = { ...defaultProps, password: 'secret123' };
    render(<LoginFormInputs {...props} />);
    expect(screen.getByDisplayValue('secret123')).toBeInTheDocument();
  });

  test('should disable both inputs when isLoading is true', () => {
    const props = { ...defaultProps, isLoading: true };
    render(<LoginFormInputs {...props} />);
    expect(screen.getByLabelText('Username')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
  });

  test('should enable both inputs when isLoading is false', () => {
    const props = { ...defaultProps, isLoading: false };
    render(<LoginFormInputs {...props} />);
    expect(screen.getByLabelText('Username')).not.toBeDisabled();
    expect(screen.getByLabelText('Password')).not.toBeDisabled();
  });

  test('should handle rapid input changes', async () => {
    const handleUsernameChange = jest.fn();
    const handlePasswordChange = jest.fn();
    render(
      <LoginFormInputs 
        {...defaultProps} 
        onUsernameChange={handleUsernameChange}
        onPasswordChange={handlePasswordChange}
      />
    );

    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');

    await userEvent.type(usernameInput, 'user');
    await userEvent.type(passwordInput, 'pass');

    expect(handleUsernameChange).toHaveBeenCalled();
    expect(handlePasswordChange).toHaveBeenCalled();
  });
});

// ============================================================================
// LOGIN REMEMBER ME COMPONENT TESTS
// ============================================================================
/**
 * LoginRememberMe: Checkbox for "Remember me" functionality
 * Scenarios:
 * 1. Renders checkbox with "Remember me" label
 * 2. Displays unchecked by default (or based on checked prop)
 * 3. Calls onChange with boolean when toggled
 * 4. Can be disabled (e.g., during form submission)
 * 5. Maintains checked state from parent component
 */
describe('LoginRememberMe', () => {
  const defaultProps = {
    checked: false,
    onChange: jest.fn(),
    colors: mockColors,
  };

  test('should render checkbox with "Remember me" label', () => {
    render(<LoginRememberMe {...defaultProps} />);
    expect(screen.getByLabelText('Remember me')).toBeInTheDocument();
  });

  test('should render unchecked checkbox when checked is false', () => {
    const props = { ...defaultProps, checked: false };
    render(<LoginRememberMe {...props} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  test('should render checked checkbox when checked is true', () => {
    const props = { ...defaultProps, checked: true };
    render(<LoginRememberMe {...props} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  test('should call onChange with true when unchecked checkbox is clicked', () => {
    const handleChange = jest.fn();
    const props = { ...defaultProps, checked: false, onChange: handleChange };
    render(<LoginRememberMe {...props} />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  test('should call onChange with false when checked checkbox is clicked', () => {
    const handleChange = jest.fn();
    const props = { ...defaultProps, checked: true, onChange: handleChange };
    render(<LoginRememberMe {...props} />);
    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  test('should be disabled when disabled prop is true', () => {
    const props = { ...defaultProps, disabled: true };
    render(<LoginRememberMe {...props} />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  test('should not be disabled when disabled prop is false', () => {
    const props = { ...defaultProps, disabled: false };
    render(<LoginRememberMe {...props} />);
    expect(screen.getByRole('checkbox')).not.toBeDisabled();
  });

  test('should not be disabled when disabled prop is undefined', () => {
    render(<LoginRememberMe {...defaultProps} />);
    expect(screen.getByRole('checkbox')).not.toBeDisabled();
  });
});

// ============================================================================
// LOGIN SUBMIT BUTTON COMPONENT TESTS
// ============================================================================
/**
 * LoginSubmitButton: Form submit button with loading state
 * Scenarios:
 * 1. Renders button with "Login" text
 * 2. Has type="submit" for form submission
 * 3. Displays "Loading..." when isLoading is true
 * 4. Shows original "Login" text when isLoading is false
 * 5. Is disabled during loading state
 * 6. Applies submit-btn class for CSS styling
 */
describe('LoginSubmitButton', () => {
  const defaultProps = {
    isLoading: false,
    colors: mockColors,
  };

  test('should render button with "Login" text', () => {
    render(<LoginSubmitButton {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('should have type="submit" for form submission', () => {
    render(<LoginSubmitButton {...defaultProps} />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  test('should display "Loading..." text when isLoading is true', () => {
    const props = { ...defaultProps, isLoading: true };
    render(<LoginSubmitButton {...props} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('should display "Login" text when isLoading is false', () => {
    const props = { ...defaultProps, isLoading: false };
    render(<LoginSubmitButton {...props} />);
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('should be disabled when isLoading is true', () => {
    const props = { ...defaultProps, isLoading: true };
    render(<LoginSubmitButton {...props} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('should not be disabled when isLoading is false', () => {
    const props = { ...defaultProps, isLoading: false };
    render(<LoginSubmitButton {...props} />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  test('should apply loading class when isLoading is true', () => {
    const props = { ...defaultProps, isLoading: true };
    const { container } = render(<LoginSubmitButton {...props} />);
    expect(container.querySelector('.loading')).toBeInTheDocument();
  });

  test('should apply submit-btn class for styling', () => {
    const { container } = render(<LoginSubmitButton {...defaultProps} />);
    expect(container.querySelector('.submit-btn')).toBeInTheDocument();
  });

  test('should transition from Loading... to Login when isLoading changes', () => {
    const { rerender } = render(
      <LoginSubmitButton {...defaultProps} isLoading={true} />
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    rerender(<LoginSubmitButton {...defaultProps} isLoading={false} />);
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });
});

// ============================================================================
// REGISTER LINK COMPONENT TESTS
// ============================================================================
/**
 * RegisterLink: Navigation link to registration page
 * Scenarios:
 * 1. Renders text "Don't have an account?"
 * 2. Renders clickable "Register here" link
 * 3. Link navigates to "/register" route
 * 4. Link color matches primary color from theme
 * 5. Uses secondary text variant for contextual text
 * 6. Is wrapped in register-link section
 * 7. Works correctly with react-router-dom Link
 */
describe('RegisterLink', () => {
  test('should render "Don\'t have an account?" text', () => {
    render(
      <BrowserRouter>
        <RegisterLink colors={mockColors} />
      </BrowserRouter>
    );
    expect(screen.getByText(/Don't have an account\?/)).toBeInTheDocument();
  });

  test('should render "Register here" link', () => {
    render(
      <BrowserRouter>
        <RegisterLink colors={mockColors} />
      </BrowserRouter>
    );
    expect(screen.getByRole('link', { name: 'Register here' })).toBeInTheDocument();
  });

  test('should link to /register route', () => {
    render(
      <BrowserRouter>
        <RegisterLink colors={mockColors} />
      </BrowserRouter>
    );
    const link = screen.getByRole('link', { name: 'Register here' });
    expect(link).toHaveAttribute('href', '/register');
  });

  test('should apply primary color to link', () => {
    render(
      <BrowserRouter>
        <RegisterLink colors={mockColors} />
      </BrowserRouter>
    );
    const link = screen.getByRole('link', { name: 'Register here' });
    expect(link).toHaveStyle({ color: mockColors.primary });
  });

  test('should apply custom primary color when colors change', () => {
    const customColors = { ...mockColors, primary: '#ff5500' };
    render(
      <BrowserRouter>
        <RegisterLink colors={customColors} />
      </BrowserRouter>
    );
    const link = screen.getByRole('link', { name: 'Register here' });
    expect(link).toHaveStyle({ color: customColors.primary });
  });

  test('should use secondary text variant for description text', () => {
    const { container } = render(
      <BrowserRouter>
        <RegisterLink colors={mockColors} />
      </BrowserRouter>
    );
    expect(container.querySelector('.text-secondary')).toBeInTheDocument();
  });

  test('should be wrapped in register-link section', () => {
    const { container } = render(
      <BrowserRouter>
        <RegisterLink colors={mockColors} />
      </BrowserRouter>
    );
    expect(container.querySelector('.register-link')).toBeInTheDocument();
  });

  test('should render both text and link together', () => {
    const { container } = render(
      <BrowserRouter>
        <RegisterLink colors={mockColors} />
      </BrowserRouter>
    );
    const section = container.querySelector('.register-link');
    expect(section?.textContent).toContain("Don't have an account?");
    expect(section?.textContent).toContain('Register here');
  });

  test('should be clickable and navigable', () => {
    render(
      <BrowserRouter>
        <RegisterLink colors={mockColors} />
      </BrowserRouter>
    );
    const link = screen.getByRole('link', { name: 'Register here' });
    expect(link).toBeVisible();
    expect(link).toBeEnabled();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================
/**
 * Integration Tests: Test how multiple LoginComponents work together
 * Scenarios:
 * 1. Complete login form layout (header + card + inputs + button + link)
 * 2. Theme toggle integration with other components
 * 3. Error states across multiple components
 * 4. Loading state affects all interactive elements
 */
describe('LoginComponents Integration', () => {
  test('should render complete login page layout', () => {
    render(
      <BrowserRouter>
        <LoginContainer colors={mockColors}>
          <LoginHeader colors={mockColors} />
          <LoginCard colors={mockColors}>
            <LoginFormInputs
              username=""
              password=""
              errors={{}}
              isLoading={false}
              colors={mockColors}
              onUsernameChange={() => {}}
              onPasswordChange={() => {}}
            />
            <LoginRememberMe
              checked={false}
              onChange={() => {}}
              colors={mockColors}
            />
            <LoginSubmitButton isLoading={false} colors={mockColors} />
          </LoginCard>
          <RegisterLink colors={mockColors} />
          <ThemeToggle theme="light" onToggle={() => {}} colors={mockColors} />
        </LoginContainer>
      </BrowserRouter>
    );

    // Verify all major elements are present
    expect(screen.getByText('miniCh')).toBeInTheDocument();
    expect(screen.getByText('Secure P2P Messaging')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Remember me')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register here' })).toBeInTheDocument();
  });

  test('should disable form inputs when loading', () => {
    render(
      <LoginFormInputs
        username=""
        password=""
        errors={{}}
        isLoading={true}
        colors={mockColors}
        onUsernameChange={() => {}}
        onPasswordChange={() => {}}
      />
    );

    expect(screen.getByLabelText('Username')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toBeDisabled();
  });

  test('should show errors and disable submit during validation', () => {
    render(
      <BrowserRouter>
        <LoginCard colors={mockColors}>
          <LoginFormInputs
            username=""
            password=""
            errors={{
              username: 'Username is required',
              password: 'Password is required',
            }}
            isLoading={false}
            colors={mockColors}
            onUsernameChange={() => {}}
            onPasswordChange={() => {}}
          />
          <LoginSubmitButton isLoading={false} colors={mockColors} />
        </LoginCard>
      </BrowserRouter>
    );

    expect(screen.getByText('Username is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).not.toBeDisabled();
  });

  test('should theme toggle independently from form state', () => {
    const handleThemeToggle = jest.fn();
    const handlePasswordChange = jest.fn();

    render(
      <BrowserRouter>
        <ThemeToggle
          theme="light"
          onToggle={handleThemeToggle}
          colors={mockColors}
        />
        <LoginFormInputs
          username=""
          password=""
          errors={{}}
          isLoading={false}
          colors={mockColors}
          onUsernameChange={() => {}}
          onPasswordChange={handlePasswordChange}
        />
      </BrowserRouter>
    );

    const themeButton = screen.getByRole('button', { name: '🌙' });
    const passwordInput = screen.getByLabelText('Password');

    fireEvent.click(themeButton);
    expect(handleThemeToggle).toHaveBeenCalled();
    expect(handlePasswordChange).not.toHaveBeenCalled();

    fireEvent.change(passwordInput, { target: { value: 'test' } });
    expect(handlePasswordChange).toHaveBeenCalled();
  });
});

