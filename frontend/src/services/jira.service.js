import apiClient from './api.service';

/**
 * Initiate OAuth flow - get authorization URL
 * @returns {Promise<{authorizationUrl: string, state: string}>}
 */
export const initiateOAuth = async () => {
  try {
    const response = await apiClient.get('/api/jira/oauth/authorize');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Handle OAuth callback - exchange code for tokens
 * @param {string} code - Authorization code from OAuth callback
 * @param {string} state - State parameter for CSRF protection
 * @returns {Promise<{success: boolean}>}
 */
export const handleOAuthCallback = async (code, state) => {
  try {
    const response = await apiClient.post('/api/jira/oauth/callback', {
      code,
      state,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if Jira is configured (OAuth authenticated)
 * @returns {Promise<{authenticated: boolean, user?: object}>}
 */
export const getConfigStatus = async () => {
  try {
    const response = await apiClient.get('/api/jira/config/status');
    return response.data;
  } catch (error) {
    // If endpoint doesn't exist or returns error, assume not configured
    return { authenticated: false };
  }
};

/**
 * Clear Jira configuration (disconnect)
 * @returns {Promise<{success: boolean}>}
 */
export const clearConfig = async () => {
  try {
    const response = await apiClient.delete('/api/jira/config');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get list of Jira projects
 * @returns {Promise<Array<{key: string, name: string, id: string}>>}
 */
export const getProjects = async () => {
  try {
    const response = await apiClient.get('/api/jira/projects');
    return response.data?.projects || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Get issue types for a project
 * @param {string} projectKey - Jira project key
 * @returns {Promise<Array<{id: string, name: string, description?: string}>>}
 */
export const getIssueTypes = async (projectKey) => {
  try {
    const response = await apiClient.get(`/api/jira/issue-types/${projectKey}`);
    return response.data?.issueTypes || [];
  } catch (error) {
    throw error;
  }
};

/**
 * Export tasks to Jira
 * @param {Array} tasks - Array of task objects with IDs
 * @param {string} projectKey - Jira project key
 * @param {string} issueType - Issue type ID or name
 * @returns {Promise<Array<{taskId: string, issueKey: string, url: string}>>}
 */
export const exportTasks = async (tasks, projectKey, issueType) => {
  try {
    const response = await apiClient.post('/api/jira/export', {
      tasks,
      projectKey,
      issueType,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Open OAuth popup window and handle callback
 * @param {string} authorizationUrl - OAuth authorization URL
 * @param {string} state - State parameter for CSRF protection
 * @returns {Promise<{success: boolean}>}
 */
export const openOAuthPopup = (authorizationUrl, state) => {
  return new Promise((resolve, reject) => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      authorizationUrl,
      'Jira OAuth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site.'));
      return;
    }

    // Listen for message from callback page
    const messageHandler = (event) => {
      // Verify origin for security (should match your backend origin)
      const expectedOrigin = window.location.origin;
      if (event.origin !== expectedOrigin) {
        return;
      }

      if (event.data.type === 'JIRA_OAUTH_SUCCESS') {
        window.removeEventListener('message', messageHandler);
        clearInterval(checkPopup);
        if (!popup.closed) {
          popup.close();
        }
        resolve({ success: true });
      } else if (event.data.type === 'JIRA_OAUTH_ERROR') {
        window.removeEventListener('message', messageHandler);
        clearInterval(checkPopup);
        if (!popup.closed) {
          popup.close();
        }
        reject(new Error(event.data.error || 'OAuth authentication failed'));
      }
    };

    window.addEventListener('message', messageHandler);

    // Fallback: Poll backend to check if authentication succeeded
    const checkPopup = setInterval(async () => {
      try {
        if (popup.closed) {
          clearInterval(checkPopup);
          window.removeEventListener('message', messageHandler);
          // Check if auth succeeded before rejecting
          try {
            const status = await getConfigStatus();
            if (status.authenticated) {
              resolve({ success: true });
            } else {
              reject(new Error('OAuth popup was closed'));
            }
          } catch (e) {
            reject(new Error('OAuth popup was closed'));
          }
          return;
        }

        // Poll backend to check authentication status
        try {
          const status = await getConfigStatus();
          if (status.authenticated) {
            clearInterval(checkPopup);
            window.removeEventListener('message', messageHandler);
            if (!popup.closed) {
              popup.close();
            }
            resolve({ success: true });
          }
        } catch (e) {
          // Continue polling
        }
      } catch (e) {
        // Continue polling
      }
    }, 1000);

    // Timeout after 5 minutes
    setTimeout(() => {
      if (!popup.closed) {
        popup.close();
      }
      clearInterval(checkPopup);
      window.removeEventListener('message', messageHandler);
      reject(new Error('OAuth timeout'));
    }, 300000);
  });
};
