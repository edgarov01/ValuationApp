
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ValuationProvider } from './contexts/ValuationContext';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { HashRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <ValuationProvider>
          <PortfolioProvider>
            <App />
          </PortfolioProvider>
        </ValuationProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
);
    