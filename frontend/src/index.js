// frontend/src/index.js
// The entry point for the React application.
// This file renders the main App component into the DOM.
// UPDATED: Wrapped the App component with AuthProvider to provide global auth state.

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext'; // Import the AuthProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
