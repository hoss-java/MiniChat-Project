// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  RegisterContainer,
  RegisterCard,
  RegisterHeader,
  RegisterFormInputs,
  PasswordStrengthIndicator,
  RegisterSubmitButton,
  LoginLink,
} from '../components/RegisterComponents';
import { ThemeToggle } from '../components/ThemeComponents';
import { ErrorMessage, SuccessMessage } from '../components/shared/UIComponents';
import './RegisterPage.css';

interface FormErrors {
  email?: string;
  username?: string;
  password?: string;
  passwordConfirm?: string;
  general?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    let score = 0;
    if (!pwd) return { score: 0, label: 'N/A', color: 'gray' };

    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*]/.test(pwd)) score++;

    const labels = ['Weak', 'Weak', 'Good', 'Strong', 'Very Strong'];
    const colorValues = ['#dc3545', '#dc3545', '#ffc107', '#8bc34a', '#4caf50'];

    return {
      score: Math.min(score, 4),
      label: labels[Math.min(score, 4)],
      color: colorValues[Math.min(score, 4)],
    };
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email format is invalid';
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (username.length > 50) {
      newErrors.username = 'Username must be at most 50 characters';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!passwordConfirm) {
      newErrors.passwordConfirm = 'Password confirmation is required';
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register(email, username, password, passwordConfirm);
      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      setErrors({ general: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = calculatePasswordStrength(password);

  return (
    <RegisterContainer>
      <ThemeToggle />
      <RegisterCard>
        <RegisterHeader />
        <form onSubmit={handleSubmit} className="register-form">
          {errors.general && <ErrorMessage message={errors.general} />}
          {successMessage && <SuccessMessage message={successMessage} />}

          <RegisterFormInputs
            email={email}
            username={username}
            password={password}
            passwordConfirm={passwordConfirm}
            errors={{
              email: errors.email,
              username: errors.username,
              password: errors.password,
              passwordConfirm: errors.passwordConfirm,
            }}
            isLoading={isLoading}
            onEmailChange={setEmail}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onPasswordConfirmChange={setPasswordConfirm}
          />

          {password && <PasswordStrengthIndicator strength={passwordStrength} />}

          <RegisterSubmitButton isLoading={isLoading} />
        </form>

        <LoginLink />
      </RegisterCard>
    </RegisterContainer>
  );
};

export default RegisterPage;
