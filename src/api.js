import axios from 'axios';

// Base API URL - Update this based on your backend server
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle specific status codes
      if (error.response.status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
      if (error.response.status === 403) {
        console.error('Access forbidden');
      }
    }
    return Promise.reject(error);
  }
);

// API Service Functions

/**
 * Fetch all APIs
 * @returns {Promise} - Promise resolving to API list
 */
export const fetchAllApis = async () => {
  try {
    const response = await api.get('/api/v1/apis');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch a single API by ID
 * @param {string|number} apiId - The API ID
 * @returns {Promise} - Promise resolving to API details
 */
export const fetchApiById = async (apiId) => {
  try {
    const response = await api.get(`/api/v1/apis/${apiId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new API
 * @param {Object} apiData - The API data to create
 * @param {string} apiData.name - API name (required)
 * @param {string} apiData.description - API description
 * @param {string} apiData.version - API version (default: "1.0.0")
 * @param {string} apiData.status - API status (default: "development")
 * @param {string} apiData.base_url - Base URL for the API
 * @param {Array} apiData.tags - Tags for categorization
 * @returns {Promise} - Promise resolving to created API
 */
export const createApi = async (apiData) => {
  try {
    // Validate required fields
    if (!apiData.name || apiData.name.trim() === '') {
      throw new Error('API name is required');
    }

    // Prepare the request payload
    const payload = {
      name: apiData.name.trim(),
      description: apiData.description?.trim() || '',
      version: apiData.version || '1.0.0',
      status: apiData.status || 'development',
      base_url: apiData.base_url?.trim() || '',
      tags: apiData.tags || [],
      ...apiData // Include any additional fields
    };

    const response = await api.post('/api/v1/apis', payload);
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with an error
      throw new Error(error.response.data?.message || 'Failed to create API');
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw error;
    }
  }
};

/**
 * Update an existing API
 * @param {string|number} apiId - The API ID
 * @param {Object} apiData - The API data to update
 * @returns {Promise} - Promise resolving to updated API
 */
export const updateApi = async (apiId, apiData) => {
  try {
    const response = await api.put(`/api/v1/apis/${apiId}`, apiData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete an API
 * @param {string|number} apiId - The API ID
 * @returns {Promise} - Promise resolving to deletion confirmation
 */
export const deleteApi = async (apiId) => {
  try {
    const response = await api.delete(`/api/v1/apis/${apiId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;
