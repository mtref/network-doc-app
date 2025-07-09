// frontend/src/App.js
// This component now acts as the main router for the application.
// It checks the authentication state and renders either the LoginPage
// or the main application (MainApp).

import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import MainApp from './components/MainApp';

function App() {
  const { isAuthenticated, loading } = useAuth();

  // Display a loading indicator while the auth state is being determined.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If authenticated, show the main application. Otherwise, show the login page.
  return isAuthenticated ? <MainApp /> : <LoginPage />;
}

export default App;
