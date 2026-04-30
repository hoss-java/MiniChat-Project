// src/components/shared/__tests__/UIComponents.test.tsx

/**
 * UIComponents Test Suite
 * 
 * This test file covers all generic UI components used throughout the miniChat application.
 * Each component is tested for:
 * - Rendering with default props
 * - Rendering with custom props
 * - Callback handlers (onChange, onClick)
 * - Conditional rendering (errors, loading states, labels)
 * - CSS class application
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Container,
  Card,
  Heading,
  Text,
  Input,
  Checkbox,
  Button,
  ErrorMessage,
  SuccessMessage,
  Section,
} from '../UIComponents';

describe('UIComponents', () => {
  
  // ============================================================================
  // CONTAINER COMPONENT TESTS
  // ============================================================================
  /**
   * Container: A generic wrapper div that provides consistent spacing/styling
   * Scenarios:
   * 1. Renders children correctly
   * 2. Applies default container class
   * 3. Merges custom className with default
   */
  describe('Container', () => {
    test('should render children correctly', () => {
      render(<Container>Hello World</Container>);
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    test('should apply default container class', () => {
      const { container } = render(<Container>Content</Container>);
      expect(container.querySelector('.container')).toBeInTheDocument();
    });

    test('should merge custom className with default class', () => {
      const { container } = render(<Container className="custom-class">Content</Container>);
      const div = container.querySelector('.container');
      expect(div).toHaveClass('container', 'custom-class');
    });
  });

  // ============================================================================
  // CARD COMPONENT TESTS
  // ============================================================================
  /**
   * Card: A generic card wrapper for grouping content
   * Scenarios:
   * 1. Renders children content
   * 2. Applies card class
   * 3. Accepts and merges custom classes
   */
  describe('Card', () => {
    test('should render children inside card', () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    test('should apply card class', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.querySelector('.card')).toBeInTheDocument();
    });

    test('should accept custom className', () => {
      const { container } = render(<Card className="elevated">Content</Card>);
      const card = container.querySelector('.card');
      expect(card).toHaveClass('card', 'elevated');
    });
  });

  // ============================================================================
  // HEADING COMPONENT TESTS
  // ============================================================================
  /**
   * Heading: Dynamic heading component that renders h1, h2, or h3 based on level prop
   * Scenarios:
   * 1. Renders h1 when level=1
   * 2. Renders h2 when level=2
   * 3. Renders h3 when level=3
   * 4. Applies heading class and custom className to heading element
   * 5. Renders children correctly at all levels
   */
  describe('Heading', () => {
    test('should render h1 when level is 1', () => {
      const { container } = render(<Heading level={1}>Title</Heading>);
      const h1 = container.querySelector('h1');
      expect(h1).toBeInTheDocument();
      expect(h1?.textContent).toBe('Title');
    });

    test('should render h2 when level is 2', () => {
      const { container } = render(<Heading level={2}>Subtitle</Heading>);
      const h2 = container.querySelector('h2');
      expect(h2).toBeInTheDocument();
      expect(h2?.textContent).toBe('Subtitle');
    });

    test('should render h3 when level is 3', () => {
      const { container } = render(<Heading level={3}>Small Title</Heading>);
      const h3 = container.querySelector('h3');
      expect(h3).toBeInTheDocument();
      expect(h3?.textContent).toBe('Small Title');
    });

    test('should apply heading class to all heading levels', () => {
      const { container: container1 } = render(<Heading level={1}>H1</Heading>);
      const { container: container2 } = render(<Heading level={2}>H2</Heading>);
      const { container: container3 } = render(<Heading level={3}>H3</Heading>);

      expect(container1.querySelector('h1')).toHaveClass('heading');
      expect(container2.querySelector('h2')).toHaveClass('heading');
      expect(container3.querySelector('h3')).toHaveClass('heading');
    });

    test('should merge custom className with heading class', () => {
      const { container } = render(<Heading level={2} className="custom-color">Title</Heading>);
      const h2 = container.querySelector('h2');
      expect(h2).toHaveClass('heading', 'custom-color');
    });
  });

  // ============================================================================
  // TEXT COMPONENT TESTS
  // ============================================================================
  /**
   * Text: Generic paragraph component with variant styling options
   * Scenarios:
   * 1. Renders text with default variant (primary)
   * 2. Renders text with secondary variant
   * 3. Renders text with error variant (red)
   * 4. Renders text with success variant (green)
   * 5. Renders text with warning variant (orange)
   * 6. Applies correct CSS classes for each variant
   * 7. Accepts custom className
   */
  describe('Text', () => {
    test('should render text with default primary variant', () => {
      const { container } = render(<Text>Primary Text</Text>);
      const paragraph = container.querySelector('p');
      expect(paragraph).toHaveClass('text', 'text-primary');
      expect(screen.getByText('Primary Text')).toBeInTheDocument();
    });

    test('should render text with secondary variant', () => {
      const { container } = render(<Text variant="secondary">Secondary Text</Text>);
      expect(container.querySelector('p')).toHaveClass('text-secondary');
    });

    test('should render text with error variant', () => {
      const { container } = render(<Text variant="error">Error Text</Text>);
      expect(container.querySelector('p')).toHaveClass('text-error');
    });

    test('should render text with success variant', () => {
      const { container } = render(<Text variant="success">Success Text</Text>);
      expect(container.querySelector('p')).toHaveClass('text-success');
    });

    test('should render text with warning variant', () => {
      const { container } = render(<Text variant="warning">Warning Text</Text>);
      expect(container.querySelector('p')).toHaveClass('text-warning');
    });

    test('should merge custom className with variant class', () => {
      const { container } = render(<Text variant="error" className="bold">Error</Text>);
      const paragraph = container.querySelector('p');
      expect(paragraph).toHaveClass('text', 'text-error', 'bold');
    });
  });

  // ============================================================================
  // INPUT COMPONENT TESTS
  // ============================================================================
  /**
   * Input: Form input with label, validation error display, and onChange handler
   * Scenarios:
   * 1. Renders input with correct type
   * 2. Renders label when provided
   * 3. Updates value when user types
   * 4. Calls onChange callback with new value
   * 5. Displays error message when error prop is provided
   * 6. Applies error-state CSS class when error exists
   * 7. Shows placeholder text
   * 8. Can be disabled
   * 9. Supports password input type
   */
  describe('Input', () => {
    test('should render input element with text type by default', () => {
      render(<Input id="test-input" value="" onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    test('should render label when label prop is provided', () => {
      render(<Input id="email" label="Email" value="" onChange={() => {}} />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    test('should update input value and call onChange handler', async () => {
      const handleChange = jest.fn();
      const { rerender } = render(
        <Input id="username" value="" onChange={handleChange} />
      );
      const input = screen.getByRole('textbox') as HTMLInputElement;

      // Type "john"
      await userEvent.type(input, 'john');

      // Verify onChange was called 4 times (once per character)
      expect(handleChange).toHaveBeenCalledTimes(4);
      
      // Verify each individual character call
      expect(handleChange).toHaveBeenNthCalledWith(1, 'j');
      expect(handleChange).toHaveBeenNthCalledWith(2, 'o');
      expect(handleChange).toHaveBeenNthCalledWith(3, 'h');
      expect(handleChange).toHaveBeenNthCalledWith(4, 'n');
    });

    test('should display error message when error prop is provided', () => {
      render(
        <Input 
          id="password" 
          value="" 
          onChange={() => {}} 
          error="Password is required"
        />
      );
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    test('should apply input-error class when error is present', () => {
      const { container } = render(
        <Input 
          id="test" 
          value="" 
          onChange={() => {}} 
          error="Invalid"
        />
      );
      const input = container.querySelector('input');
      expect(input).toHaveClass('input-error');
    });

    test('should not apply input-error class when no error', () => {
      const { container } = render(
        <Input id="test" value="" onChange={() => {}} />
      );
      const input = container.querySelector('input');
      expect(input).not.toHaveClass('input-error');
    });

    test('should show placeholder text', () => {
      render(
        <Input 
          id="test" 
          value="" 
          onChange={() => {}} 
          placeholder="Enter your name"
        />
      );
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    });

    test('should be disabled when disabled prop is true', () => {
      render(
        <Input 
          id="test" 
          value="" 
          onChange={() => {}} 
          disabled={true}
        />
      );
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    test('should support password input type', () => {
      render(
        <Input 
          id="password" 
          label="Password"
          value="" 
          onChange={() => {}} 
          type="password"
        />
      );
      
      // Method 1: Query by label (BEST - accessible)
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      expect(passwordInput.type).toBe('password');
    });

    test('should accept custom className', () => {
      const { container } = render(
        <Input 
          id="test" 
          value="" 
          onChange={() => {}} 
          className="large-input"
        />
      );
      expect(container.querySelector('.form-group')).toHaveClass('large-input');
    });
  });

  // ============================================================================
  // CHECKBOX COMPONENT TESTS
  // ============================================================================
  /**
   * Checkbox: Checkbox input with optional label
   * Scenarios:
   * 1. Renders unchecked by default
   * 2. Renders checked when checked prop is true
   * 3. Calls onChange when clicked
   * 4. Displays label when provided
   * 5. Can be disabled
   * 6. Accepts custom className
   */
  describe('Checkbox', () => {
    test('should render unchecked checkbox', () => {
      render(<Checkbox id="terms" checked={false} onChange={() => {}} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    test('should render checked checkbox when checked prop is true', () => {
      render(<Checkbox id="terms" checked={true} onChange={() => {}} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    test('should call onChange with true when unchecked checkbox is clicked', async () => {
      const handleChange = jest.fn();
      render(<Checkbox id="terms" checked={false} onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      fireEvent.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    test('should call onChange with false when checked checkbox is clicked', async () => {
      const handleChange = jest.fn();
      render(<Checkbox id="terms" checked={true} onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      fireEvent.click(checkbox);
      expect(handleChange).toHaveBeenCalledWith(false);
    });

    test('should render label when label prop is provided', () => {
      render(
        <Checkbox 
          id="terms" 
          checked={false} 
          onChange={() => {}} 
          label="I agree to terms"
        />
      );
      expect(screen.getByLabelText('I agree to terms')).toBeInTheDocument();
    });

    test('should be disabled when disabled prop is true', () => {
      render(
        <Checkbox 
          id="terms" 
          checked={false} 
          onChange={() => {}} 
          disabled={true}
        />
      );
      expect(screen.getByRole('checkbox')).toBeDisabled();
    });

    test('should accept custom className', () => {
      const { container } = render(
        <Checkbox 
          id="terms" 
          checked={false} 
          onChange={() => {}} 
          className="large-checkbox"
        />
      );
      expect(container.querySelector('.checkbox-group')).toHaveClass('large-checkbox');
    });
  });

  // ============================================================================
  // BUTTON COMPONENT TESTS
  // ============================================================================
  /**
   * Button: Interactive button with variants, loading state, and disabled state
   * Scenarios:
   * 1. Renders with default button type
   * 2. Supports submit, reset button types
   * 3. Calls onClick when clicked
   * 4. Shows loading state (displays "Loading..." text)
   * 5. Disables button while loading
   * 6. Applies variant CSS classes (primary, secondary, danger, success, warning)
   * 7. Can be disabled
   * 8. Accepts custom className
   */
  describe('Button', () => {
    test('should render button element', () => {
      render(<Button>Click Me</Button>);
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    test('should have button type by default', () => {
      render(<Button>Default Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    test('should support submit type', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    test('should support reset type', () => {
      render(<Button type="reset">Reset</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });

    test('should call onClick handler when clicked', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should display "Loading..." text when loading prop is true', () => {
      render(<Button loading={true}>Send</Button>);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should disable button when loading prop is true', () => {
      render(<Button loading={true}>Send</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    test('should apply primary variant class by default', () => {
      render(<Button>Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-primary');
    });

    test('should apply secondary variant class', () => {
      render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-secondary');
    });

    test('should apply danger variant class', () => {
      render(<Button variant="danger">Delete</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-danger');
    });

    test('should apply danger variant class', () => {
      render(<Button variant="danger">Delete</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-danger');
    });

    test('should apply success variant class', () => {
      render(<Button variant="success">Confirm</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-success');
    });

    test('should apply warning variant class', () => {
      render(<Button variant="warning">Warning</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-warning');
    });

    test('should be disabled when disabled prop is true', () => {
      render(<Button disabled={true}>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    test('should add loading class when loading is true', () => {
      render(<Button loading={true}>Send</Button>);
      expect(screen.getByRole('button')).toHaveClass('loading');
    });

    test('should accept custom className', () => {
      render(<Button className="wide-button">Click</Button>);
      expect(screen.getByRole('button')).toHaveClass('wide-button');
    });

    test('should not call onClick when button is disabled', () => {
      const handleClick = jest.fn();
      render(<Button disabled={true} onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // ERROR MESSAGE COMPONENT TESTS
  // ============================================================================
  /**
   * ErrorMessage: Displays error feedback to user
   * Scenarios:
   * 1. Renders error message text
   * 2. Applies error-message class
   * 3. Accepts custom className
   */
  describe('ErrorMessage', () => {
    test('should render error message', () => {
      render(<ErrorMessage message="Something went wrong" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    test('should apply error-message class', () => {
      const { container } = render(<ErrorMessage message="Error" />);
      expect(container.querySelector('.error-message')).toBeInTheDocument();
    });

    test('should accept custom className', () => {
      const { container } = render(
        <ErrorMessage message="Error" className="large-error" />
      );
      const errorDiv = container.querySelector('.error-message');
      expect(errorDiv).toHaveClass('error-message', 'large-error');
    });
  });

  // ============================================================================
  // SUCCESS MESSAGE COMPONENT TESTS
  // ============================================================================
  /**
   * SuccessMessage: Displays success feedback to user
   * Scenarios:
   * 1. Renders success message text
   * 2. Applies success-message class
   * 3. Accepts custom className
   */
  describe('SuccessMessage', () => {
    test('should render success message', () => {
      render(<SuccessMessage message="Operation successful" />);
      expect(screen.getByText('Operation successful')).toBeInTheDocument();
    });

    test('should apply success-message class', () => {
      const { container } = render(<SuccessMessage message="Success" />);
      expect(container.querySelector('.success-message')).toBeInTheDocument();
    });

    test('should accept custom className', () => {
      const { container } = render(
        <SuccessMessage message="Success" className="large-success" />
      );
      const successDiv = container.querySelector('.success-message');
      expect(successDiv).toHaveClass('success-message', 'large-success');
    });
  });

  // ============================================================================
  // SECTION COMPONENT TESTS
  // ============================================================================
  /**
   * Section: Semantic HTML section wrapper
   * Scenarios:
   * 1. Renders as <section> element
   * 2. Renders children correctly
   * 3. Applies section class
   * 4. Accepts custom className
   */
  describe('Section', () => {
    test('should render as section element', () => {
      const { container } = render(<Section>Content</Section>);
      expect(container.querySelector('section')).toBeInTheDocument();
    });

    test('should render children inside section', () => {
      render(<Section>Section Content</Section>);
      expect(screen.getByText('Section Content')).toBeInTheDocument();
    });

    test('should apply section class', () => {
      const { container } = render(<Section>Content</Section>);
      expect(container.querySelector('section')).toHaveClass('section');
    });

    test('should accept custom className', () => {
      const { container } = render(
        <Section className="hero-section">Content</Section>
      );
      const section = container.querySelector('section');
      expect(section).toHaveClass('section', 'hero-section');
    });
  });
});

