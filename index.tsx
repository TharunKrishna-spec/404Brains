import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { HashRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      {/* FIX: Moved HashRouter here to wrap the entire App, ensuring routing context is available globally. */}
      <HashRouter>
        <App />
      </HashRouter>
    </AuthProvider>
  </React.StrictMode>
);