// frontend/src/App.js
// This component now acts as the main router for the application.
// It checks the URL to display the correct page (Manual or Main App/Login).

import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import MainApp from './components/MainApp';
import UserManual from './components/UserManual'; // Import the new UserManual component

function App() {
  const { isAuthenticated, loading } = useAuth();

  // Simple routing based on URL path
  const path = window.location.pathname;

  if (path === '/manual') {
    return <UserManual />;
  }

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
