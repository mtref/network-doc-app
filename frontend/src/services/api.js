// frontend/src/services/api.js
// This file centralizes all API calls and handles authentication tokens.
// UPDATED: Correctly handles FormData for file uploads by DELETING the Content-Type header.

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5004';

// Helper to get the auth token from localStorage
const getToken = () => localStorage.getItem('token');

/**
 * A wrapper for the native fetch API.
 * @param {string} endpoint - The API endpoint to call (e.g., 'pcs', 'connections/1').
 * @param {object} options - The options object for the fetch call (e.g., method, body, headers).
 * @returns {Promise<any>} - A promise that resolves with the JSON response.
 */
const api = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json', // Set a default for most requests
    ...options.headers,
  };

  // If a token exists, add it to the Authorization header.
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // CORRECTED: If the body is FormData, delete the Content-Type header entirely.
  // The browser will then automatically set it to 'multipart/form-data' with the correct boundary.
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login'; 
      return Promise.reject({ message: 'Unauthorized. Please log in again.' });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.msg || errorData.error || `HTTP error! status: ${response.status}`;
      return Promise.reject(new Error(errorMessage));
    }
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return Promise.resolve({ success: true });

  } catch (error) {
    console.error('API call failed:', error);
    return Promise.reject(error);
  }
};

export default api;
