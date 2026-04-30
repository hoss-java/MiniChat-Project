import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock LoginPage locally
jest.mock('../pages/LoginPage', () => {
  return function MockLoginPage() {
    return <div>Mock Login Page</div>;
  };
});

test('App renders without crashing', () => {
  const { container } = render(<App />);
  // Just verify something is rendered
  expect(container.querySelector('div')).toBeInTheDocument();
});
