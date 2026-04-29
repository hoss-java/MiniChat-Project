import React from 'react';

export const BrowserRouter = ({ children }: any) => React.createElement(React.Fragment, null, children);
export const Routes = ({ children }: any) => React.createElement(React.Fragment, null, children);

export const Route = ({ element }: any) => element;

export const Navigate = ({ to }: any) => {
  return null;
};

export const Link = ({ to, children, ...props }: any) => 
  React.createElement('a', { href: to, ...props }, children);

export const useNavigate = () => jest.fn();
export const useParams = () => ({});
export const useLocation = () => ({ pathname: '/' });
