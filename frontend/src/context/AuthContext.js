// frontend/src/context/AuthContext.js
// This context now validates the auth token on initial load for improved security.

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // This effect runs once on app startup to validate any existing token.
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Verify token with the backend to get fresh user data.
          const userData = await api.getProfile();
          setUser(userData);
        } catch (error) {
          // If the token is invalid (e.g., expired), clear it from storage.
          console.error("Token validation failed:", error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      // Finished loading, the app can now render the correct routes.
      setLoading(false);
    };

    validateToken();
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const response = await api.login({ username, password });
      const { access_token, user: userData } = response;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      api.setAuthHeader(access_token);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: error.message || 'Login failed. Please check your credentials.' };
    }
  }, []);

  // Logout now only handles clearing state and storage.
  // The redirection is handled by the routing logic in App.js.
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    api.setAuthHeader(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  // The loading state is handled in App.js, so we can render children directly.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};