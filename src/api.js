import axios from 'axios';
import { getToken, removeToken, isTokenExpired } from './utils/auth';

// Base API URL - Update this based on your backend server
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // Increased timeout for production
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Check if token is expired before making request
    if (isTokenExpired()) {
      removeToken();
      window.location.href = '/login';
      return Promise.reject(new Error('Token expired'));
    }

    const token = getToken();
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
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      // Handle specific status codes
      if (error.response.status === 401 && !originalRequest._retry) {
        // Unauthorized - clear token and redirect to login
        removeToken();
        window.location.href = '/login';
      }
      
      if (error.response.status === 403) {
        console.error('Access forbidden:', error.response.data?.message);
      }

      if (error.response.status === 429) {
        console.error('Rate limit exceeded. Please try again later.');
      }

      if (error.response.status >= 500) {
        console.error('Server error:', error.response.data?.message);
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error: No response from server');
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

/**
 * Create a new change log entry
 * @param {Object} changeData - The change data to create
 * @param {string} changeData.title - Change title (required)
 * @param {string} changeData.description - Change description
 * @param {string} changeData.type - Change type (required)
 * @param {string} changeData.api_id - Associated API ID
 * @param {string} changeData.version - Version number
 * @param {string} changeData.date - Change date
 * @param {string} changeData.author - Author name
 * @returns {Promise} - Promise resolving to created change
 */
export const createChange = async (changeData) => {
  try {
    // Validate required fields
    if (!changeData.title || changeData.title.trim() === '') {
      throw new Error('Change title is required');
    }

    if (!changeData.type || changeData.type.trim() === '') {
      throw new Error('Change type is required');
    }

    // Prepare the request payload
    const payload = {
      title: changeData.title.trim(),
      description: changeData.description?.trim() || '',
      type: changeData.type.toLowerCase(),
      api_id: changeData.api_id || null,
      version: changeData.version?.trim() || '',
      date: changeData.date || new Date().toISOString(),
      author: changeData.author?.trim() || '',
      ...changeData // Include any additional fields
    };

    const response = await api.post('/api/v1/changes', payload);
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with an error
      throw new Error(error.response.data?.message || 'Failed to create change log');
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
 * Validate a policy against APIs
 * @param {string|number} policyId - The policy ID to validate
 * @returns {Promise} - Promise resolving to validation results
 */
export const validatePolicy = async (policyId) => {
  try {
    const response = await api.post(`/api/v1/policies/${policyId}/validate`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to validate policy');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw error;
    }
  }
};

/**
 * Get validation status for all policies
 * @returns {Promise} - Promise resolving to validation status for all policies
 */
export const getAllPolicyValidations = async () => {
  try {
    const response = await api.get('/api/v1/policies/validations');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to fetch validation status');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw error;
    }
  }
};

/**
 * Get validation results for a specific policy
 * @param {string|number} policyId - The policy ID
 * @returns {Promise} - Promise resolving to validation results
 */
export const getPolicyValidation = async (policyId) => {
  try {
    const response = await api.get(`/api/v1/policies/${policyId}/validation`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to fetch validation results');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw error;
    }
  }
};

/**
 * Get validation summary statistics
 * @returns {Promise} - Promise resolving to validation summary
 */
export const getValidationSummary = async () => {
  try {
    const response = await api.get('/api/v1/policies/validation/summary');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to fetch validation summary');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw error;
    }
  }
};

/**
 * Validate all policies
 * @returns {Promise} - Promise resolving to validation results for all policies
 */
export const validateAllPolicies = async () => {
  try {
    const response = await api.post('/api/v1/policies/validate/all');
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Failed to validate all policies');
    } else if (error.request) {
      throw new Error('No response from server. Please check your connection.');
    } else {
      throw error;
    }
  }
};

export default api;
