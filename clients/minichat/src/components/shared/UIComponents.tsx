// src/components/shared/UIComponents.tsx
import React from 'react';

// Generic Container
export const Container: React.FC<{ children: React.ReactNode; className?: string }> = 
  ({ children, className = '' }) => (
    <div className={`container ${className}`}>
      {children}
    </div>
  );

// Generic Card
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = 
  ({ children, className = '' }) => (
    <div className={`card ${className}`}>
      {children}
    </div>
  );

// Generic Heading
export const Heading: React.FC<{ level: 1 | 2 | 3; children: React.ReactNode; className?: string }> = 
  ({ level, children, className = '' }) => {
    const commonProps = { className: `heading ${className}` };
    
    switch (level) {
      case 1:
        return <h1 {...commonProps}>{children}</h1>;
      case 2:
        return <h2 {...commonProps}>{children}</h2>;
      case 3:
        return <h3 {...commonProps}>{children}</h3>;
    }
  };

// Generic Text
export const Text: React.FC<{ children: React.ReactNode; variant?: 'primary' | 'secondary' | 'error' | 'success' | 'warning'; className?: string }> = 
  ({ children, variant = 'primary', className = '' }) => (
    <p className={`text text-${variant} ${className}`}>{children}</p>
  );

// Generic Form Input
export const Input: React.FC<{
  label?: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  className?: string;
}> = ({ label, id, value, onChange, error, disabled, type = 'text', placeholder, className = '' }) => (
  <div className={`form-group ${className}`}>
    {label && <label htmlFor={id}>{label}</label>}
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`input ${error ? 'input-error' : ''}`}
    />
    {error && <span className="error-text">{error}</span>}
  </div>
);

// Generic Checkbox
export const Checkbox: React.FC<{
  id: string;
  label?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  className?: string;
}> = ({ id, label, checked, onChange, disabled, className = '' }) => (
  <div className={`checkbox-group ${className}`}>
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    />
    {label && <label htmlFor={id}>{label}</label>}
  </div>
);

// Generic Button
export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: (e?: React.MouseEvent | React.FormEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  loading?: boolean;
  className?: string;
}> = ({ children, onClick, type = 'button', disabled, variant = 'primary', loading, className = '' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`btn btn-${variant} ${loading ? 'loading' : ''} ${className}`}
  >
    {loading ? 'Loading...' : children}
  </button>
);

// Generic Error Message
export const ErrorMessage: React.FC<{ message: string; className?: string }> = 
  ({ message, className = '' }) => (
    <div className={`error-message ${className}`}>
      {message}
    </div>
  );

// Generic Success Message
export const SuccessMessage: React.FC<{ message: string; className?: string }> = 
  ({ message, className = '' }) => (
    <div className={`success-message ${className}`}>
      {message}
    </div>
  );

// Generic Section
export const Section: React.FC<{ children: React.ReactNode; className?: string }> = 
  ({ children, className = '' }) => (
    <section className={`section ${className}`}>
      {children}
    </section>
  );
