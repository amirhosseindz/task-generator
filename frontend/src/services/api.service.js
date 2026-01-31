import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging (optional)
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error cases
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject(new Error('Network error: Unable to reach the server'));
    } else {
      // Something else happened
      return Promise.reject(new Error(error.message || 'An unexpected error occurred'));
    }
  }
);

/**
 * Generate tasks from meeting minutes
 * @param {string} meetingMinutes - The meeting minutes text
 * @returns {Promise<{tasks: Array}>} - Promise resolving to tasks array
 */
export const generateTasks = async (meetingMinutes) => {
  try {
    const response = await apiClient.post('/api/tasks/generate', {
      meetingMinutes,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Health check endpoint
 * @returns {Promise<{status: string, timestamp: string}>}
 */
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default apiClient;
