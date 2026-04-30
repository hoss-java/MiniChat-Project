// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LoginContainer,
  LoginCard,
  LoginHeader,
  LoginFormInputs,
  LoginRememberMe,
  LoginSubmitButton,
  RegisterLink,
} from '../components/LoginComponents';
import { Colors } from '../types/ColorTypes';
import { ThemeToggle } from '../components/ThemeComponents';
import { ErrorMessage } from '../components/shared/UIComponents';
import './LoginPage.css';

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await login(username, password);
      if (rememberMe) localStorage.setItem('rememberMe', username);
      navigate('/dashboard');
    } catch (error: any) {
      setErrors({ general: error.message || 'Login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const remembered = localStorage.getItem('rememberMe');
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, []);

  return (
    <LoginContainer colors={colors}>
      <ThemeToggle />
      <LoginCard colors={colors}>
        <LoginHeader colors={colors} />
        <form onSubmit={handleSubmit} className="login-form">
          {errors.general && <ErrorMessage message={errors.general} />}
          <LoginFormInputs
            username={username}
            password={password}
            errors={{ username: errors.username, password: errors.password }}
            isLoading={isLoading}
            colors={colors}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
          />
          <LoginRememberMe checked={rememberMe} onChange={setRememberMe} disabled={isLoading} colors={colors} />
          <LoginSubmitButton isLoading={isLoading} colors={colors} />
        </form>

        <RegisterLink colors={colors} />
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage;
