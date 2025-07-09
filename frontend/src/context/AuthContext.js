// frontend/src/context/AuthContext.js
// This file creates a React Context to manage and provide authentication state
// and functions (like login, logout) to the entire application.

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

// Create the context
const AuthContext = createContext(null);

// Custom hook to use the auth context easily in other components
export const useAuth = () => useContext(AuthContext);

// The provider component that will wrap our application
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Effect to load user data from localStorage on initial app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setToken(null);
      }
    }
    setLoading(false);
  }, [token]);

  // Login function
  const login = useCallback(async (username, password) => {
    try {
      const response = await api('login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      const { access_token, user: userData } = response;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: error.message || 'Login failed. Please check your credentials.' };
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    // Redirect to login page to ensure a clean state
    window.location.href = '/login';
  }, []);

  // The value provided to consuming components
  const value = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
