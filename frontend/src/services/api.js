// frontend/src/services/api.js
// This file has been refactored into a more structured API service object.

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5004';

// Module-level variable to hold the token, avoiding constant localStorage access.
let authToken = localStorage.getItem('token');

/**
 * The core private fetch function.
 * @param {string} endpoint - The API endpoint to call.
 * @param {object} options - The options object for the fetch call.
 * @returns {Promise<any>} - A promise that resolves with the response.
 */
const _fetch = async (endpoint, options = {}) => {
  const headers = {
    // Default to JSON content type, but allow it to be overridden.
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add the Authorization header if a token exists.
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  // For file uploads, the browser must set the Content-Type header with the correct boundary.
  // Deleting it allows the browser to handle this automatically.
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, { ...options, headers });

    // If the token is invalid or expired, reject the promise.
    // The AuthContext will catch this and handle logging the user out.
    if (response.status === 401) {
      return Promise.reject(new Error('Unauthorized'));
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.msg || errorData.error || `HTTP error! Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    // Handle responses that have no content (e.g., DELETE).
    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error(`API call to "${endpoint}" failed:`, error);
    // Re-throw the error so it can be handled by the calling component.
    throw error;
  }
};

const api = {
  /**
   * Sets the auth token for all subsequent API requests.
   * @param {string | null} token - The JWT token.
   */
  setAuthHeader: (token) => {
    authToken = token;
  },

  /**
   * Specific method for logging in.
   * @param {object} credentials - { username, password }.
   * @returns {Promise<object>} - The login response data.
   */
  login: (credentials) => _fetch('login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  /**
   * Fetches the current user's profile to validate the token.
   * @returns {Promise<object>} - The user data.
   */
  getProfile: () => _fetch('profile'),
  
  // Generic RESTful methods for other API calls.
  get: (endpoint) => _fetch(endpoint),
  post: (endpoint, body) => _fetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => _fetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => _fetch(endpoint, { method: 'DELETE' }),

  /**
   * A dedicated method for handling FormData (file uploads).
   * @param {string} endpoint - The API endpoint to call.
   * @param {FormData} formData - The FormData object to send.
   * @returns {Promise<any>}
   */
  postForm: (endpoint, formData) => _fetch(endpoint, { method: 'POST', body: formData }),
};

export default api;