import dotenv from 'dotenv';

dotenv.config();

/**
 * Jira API Client Service
 * Communicates directly with Jira REST API for Jira operations
 */
class JiraAPIClientService {
  constructor() {
    // Cache cloud ID and site URL per access token to avoid repeated API calls
    this.cloudIdCache = new Map();
    this.siteUrlCache = new Map();
  }

  /**
   * Get cloud ID and site URL for the Jira instance
   * @param {string} accessToken - OAuth access token
   * @returns {Promise<Object>} Object with cloudId and siteUrl
   */
  async getCloudIdAndSiteUrl(accessToken) {
    if (!accessToken) {
      throw new Error('OAuth access token is required');
    }

    // Check cache first
    if (this.cloudIdCache.has(accessToken) && this.siteUrlCache.has(accessToken)) {
      return {
        cloudId: this.cloudIdCache.get(accessToken),
        siteUrl: this.siteUrlCache.get(accessToken),
      };
    }

    try {
      const response = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to get accessible resources: ${error.error?.message || response.statusText}`);
      }

      const resources = await response.json();
      if (!resources || resources.length === 0) {
        throw new Error('No accessible Jira resources found');
      }

      const cloudId = resources[0].id;
      const siteUrl = resources[0].url || null;
      
      // Cache the cloud ID and site URL
      this.cloudIdCache.set(accessToken, cloudId);
      if (siteUrl) {
        this.siteUrlCache.set(accessToken, siteUrl);
      }
      
      return { cloudId, siteUrl };
    } catch (error) {
      console.error('Error getting cloud ID and site URL:', error);
      throw error;
    }
  }

  /**
   * Get cloud ID for the Jira instance
   * @param {string} accessToken - OAuth access token
   * @returns {Promise<string>} Cloud ID
   */
  async getCloudId(accessToken) {
    const { cloudId } = await this.getCloudIdAndSiteUrl(accessToken);
    return cloudId;
  }

  /**
   * Get base URL for Jira API calls
   * @param {string} accessToken - OAuth access token
   * @returns {Promise<string>} Base API URL
   */
  async getBaseUrl(accessToken) {
    const cloudId = await this.getCloudId(accessToken);
    return `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3`;
  }

  /**
   * List available Jira projects
   * @param {string} accessToken - OAuth access token
   * @returns {Promise<Array>} List of projects
   */
  async getProjects(accessToken) {
    if (!accessToken) {
      throw new Error('OAuth access token is required');
    }

    try {
      const baseUrl = await this.getBaseUrl(accessToken);
      const response = await fetch(`${baseUrl}/project`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to get projects: ${error.errorMessages?.join(', ') || error.message || response.statusText}`);
      }

      const projects = await response.json();
      return projects.map(project => ({
        key: project.key,
        id: project.id,
        name: project.name,
        projectTypeKey: project.projectTypeKey,
      }));
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  }

  /**
   * Get issue types for a project
   * @param {string} projectKey - Project key
   * @param {string} accessToken - OAuth access token
   * @returns {Promise<Array>} List of issue types
   */
  async getIssueTypes(projectKey, accessToken) {
    if (!projectKey) {
      throw new Error('Project key is required');
    }

    if (!accessToken) {
      throw new Error('OAuth access token is required');
    }

    try {
      const baseUrl = await this.getBaseUrl(accessToken);
      const response = await fetch(`${baseUrl}/project/${projectKey}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Failed to get project issue types: ${error.errorMessages?.join(', ') || error.message || response.statusText}`);
      }

      const project = await response.json();
      return project.issueTypes || [];
    } catch (error) {
      console.error('Error getting issue types:', error);
      throw error;
    }
  }

  /**
   * Create a Jira issue
   * @param {Object} issueData - Jira issue data (fields object)
   * @param {string} accessToken - OAuth access token
   * @returns {Promise<Object>} Created issue with key and URL
   */
  async createIssue(issueData, accessToken) {
    if (!issueData || !issueData.fields) {
      throw new Error('Issue data with fields is required');
    }

    if (!accessToken) {
      throw new Error('OAuth access token is required');
    }

    try {
      const baseUrl = await this.getBaseUrl(accessToken);
      const response = await fetch(`${baseUrl}/issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessages = error.errorMessages || [];
        const errors = error.errors || {};
        const errorText = errorMessages.length > 0 
          ? errorMessages.join(', ')
          : Object.keys(errors).length > 0
          ? Object.entries(errors).map(([key, value]) => `${key}: ${value}`).join(', ')
          : error.message || response.statusText;
        
        throw new Error(`Failed to create Jira issue: ${errorText}`);
      }

      const createdIssue = await response.json();
      
      // Get cloud ID and site URL (cached, so this is efficient)
      const { cloudId, siteUrl } = await this.getCloudIdAndSiteUrl(accessToken);
      
      // Construct the browse URL if we have the site URL
      let browseUrl = null;
      if (siteUrl) {
        browseUrl = `${siteUrl}/browse/${createdIssue.key}`;
      } else {
        // Fallback to API URL if site URL is not available
        browseUrl = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${createdIssue.key}`;
      }

      return {
        key: createdIssue.key,
        id: createdIssue.id,
        self: createdIssue.self,
        url: browseUrl,
      };
    } catch (error) {
      console.error('Error creating Jira issue:', error);
      throw error;
    }
  }

  /**
   * Clear cloud ID and site URL cache (useful for testing or when tokens change)
   * @param {string} accessToken - Optional access token to clear specific cache entry
   */
  clearCache(accessToken = null) {
    if (accessToken) {
      this.cloudIdCache.delete(accessToken);
      this.siteUrlCache.delete(accessToken);
    } else {
      this.cloudIdCache.clear();
      this.siteUrlCache.clear();
    }
  }
}

export default new JiraAPIClientService();
