// src/components/RegisterComponents.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Heading, Text, Input, Button, ErrorMessage, Container, Section } from './shared/UIComponents';
import { Colors } from '../types/ColorTypes';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export const RegisterContainer: React.FC<{ children: React.ReactNode }> =
  ({ children }) => <Container className="register-container">{children}</Container>;

export const RegisterCard: React.FC<{ children: React.ReactNode }> =
  ({ children }) => <Card className="register-card">{children}</Card>;

export const RegisterHeader: React.FC = () => (
  <Section className="register-header">
    <Heading level={1}>Create Account</Heading>
    <Text variant="secondary">Join miniChat and start secure conversations</Text>
  </Section>
);

export const RegisterFormInputs: React.FC<{
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  errors: { username?: string; email?: string; password?: string; passwordConfirm?: string };
  isLoading: boolean;
  onUsernameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onPasswordConfirmChange: (v: string) => void;
}> = ({
  username,
  email,
  password,
  passwordConfirm,
  errors,
  isLoading,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onPasswordConfirmChange,
}) => (
  <>
    <Input
      id="username"
      label="Username"
      type="text"
      value={username}
      onChange={onUsernameChange}
      placeholder="Enter your username"
      error={errors.username}
      disabled={isLoading}
    />

    <Input
      id="email"
      label="Email"
      type="email"
      value={email}
      onChange={onEmailChange}
      placeholder="you@example.com"
      error={errors.email}
      disabled={isLoading}
    />

    <Input
      id="password"
      label="Password"
      type="password"
      value={password}
      onChange={onPasswordChange}
      placeholder="Enter your password"
      error={errors.password}
      disabled={isLoading}
    />

    <Input
      id="passwordConfirm"
      label="Confirm Password"
      type="password"
      value={passwordConfirm}
      onChange={onPasswordConfirmChange}
      placeholder="Confirm your password"
      error={errors.passwordConfirm}
      disabled={isLoading}
    />
  </>
);


export const PasswordStrengthIndicator: React.FC<{ strength: PasswordStrength }> = ({ strength }) => (
  <div className="password-strength">
    <div className="strength-bar">
      <div
        className="strength-fill"
        style={{
          width: `${(strength.score + 1) * 25}%`,
          backgroundColor: strength.color,
        }}
      />
    </div>
    <span className="strength-label" style={{ color: strength.color }}>
      Strength: {strength.label}
    </span>
  </div>
);

export const RegisterSubmitButton: React.FC<{ isLoading: boolean }> =
  ({ isLoading }) => (
    <Button
      type="submit"
      disabled={isLoading}
      loading={isLoading}
      variant="primary"
      className="register-submit"
    >
      Create Account
    </Button>
  );

export const LoginLink: React.FC = () => (
  <Section className="login-link">
    <Text variant="secondary">
      Already have an account?{' '}
      <Link to="/login" className="link">
        Sign in
      </Link>
    </Text>
  </Section>
);
