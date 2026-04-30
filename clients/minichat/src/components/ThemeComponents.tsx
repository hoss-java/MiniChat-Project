// src/components/ThemeComponents.tsx
import React from 'react';
import { Button } from './shared/UIComponents';
import { useTheme } from '../contexts/ThemeContext';
import { Colors } from '../types/ColorTypes';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      variant="primary"
      className="theme-toggle"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </Button>
  );
};
