import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests for session management
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
      // Server responded with error status (backend sends { error: { message } })
      const data = error.response.data;
      const rawMessage = data?.error?.message ?? data?.message ?? data?.error ?? 'An error occurred';
      const message = typeof rawMessage === 'string' ? rawMessage : (rawMessage?.message ?? 'An error occurred');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/bae9a160-b71d-481f-8ab8-0f7e4f312bd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.service.js:interceptor',message:'response error',data:{status:error.response?.status,messageType:typeof message,runId:'post-fix'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,E'})}).catch(()=>{});
      // #endregion
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
