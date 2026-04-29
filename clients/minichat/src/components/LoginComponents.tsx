// src/components/LoginComponents.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Heading, Text, Input, Checkbox, Button, ErrorMessage, Container, Section } from './shared/UIComponents';
import { useTheme } from '../contexts/ThemeContext';

interface Colors {
  background: string;
  surface: string;
  border: string;
  primary: string;
  text: string;
  textSecondary: string;
  error: string;
}

export const LoginContainer: React.FC<{ colors: Colors; children: React.ReactNode }> = 
  ({ colors, children }) => <Container className="login-container">{children}</Container>;

export const LoginCard: React.FC<{ colors: Colors; children: React.ReactNode }> = 
  ({ colors, children }) => <Card className="login-card">{children}</Card>;

export const LoginHeader: React.FC<{ colors: Colors }> = ({ colors }) => (
  <Section className="login-header">
    <Heading level={1} >miniCh</Heading>
    <Text variant="secondary">Secure P2P Messaging</Text>
  </Section>
);

export const ThemeToggle: React.FC<{ colors: Colors; theme: string; onToggle: () => void }> = 
  ({ colors, theme, onToggle }) => (
    <Button
      onClick={onToggle}
      variant="primary"
      className="theme-toggle"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </Button>
  );

export const LoginFormInputs: React.FC<{
  username: string;
  password: string;
  errors: { username?: string; password?: string };
  isLoading: boolean;
  colors: Colors;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
}> = ({ username, password, errors, isLoading, colors, onUsernameChange, onPasswordChange }) => (
  <>
    <Input
      label="Username"
      id="username"
      value={username}
      onChange={onUsernameChange}
      error={errors.username}
      disabled={isLoading}
      placeholder="your_username"
    />
    <Input
      label="Password"
      id="password"
      type="password"
      value={password}
      onChange={onPasswordChange}
      error={errors.password}
      disabled={isLoading}
      placeholder="••••••••"
    />
  </>
);

export const LoginRememberMe: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  colors: Colors;
}> = ({ checked, onChange, disabled, colors }) => 
  <Checkbox id="rememberMe" label="Remember me" checked={checked} onChange={onChange} disabled={disabled} />;

export const LoginSubmitButton: React.FC<{ isLoading: boolean; colors: Colors }> = 
  ({ isLoading, colors }) => 
    <Button type="submit" loading={isLoading} className="submit-btn">
      Login
    </Button>;

export const RegisterLink: React.FC<{ colors: Colors }> = ({ colors }) => (
  <Section className="register-link">
    <Text variant="secondary">
      Don't have an account?{' '}
      <Link to="/register" style={{ color: colors.primary }}>
        Register here
      </Link>
    </Text>
  </Section>
);
