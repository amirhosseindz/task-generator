import dotenv from 'dotenv';

dotenv.config();

/**
 * Jira MCP Client Service
 * Communicates with Atlassian MCP server for Jira operations
 */
class JiraMCPClientService {
  constructor() {
    this.mcpServerUrl = process.env.JIRA_MCP_SERVER_URL || 'https://mcp.atlassian.com/v1/mcp';
  }

  /**
   * Call MCP server tool
   * @param {string} toolName - Name of the MCP tool to call
   * @param {Object} args - Tool arguments
   * @param {string} accessToken - OAuth access token
   * @returns {Promise<Object>} Tool response
   */
  async callMCPTool(toolName, args, accessToken) {
    if (!accessToken) {
      throw new Error('OAuth access token is required');
    }

    try {
      // MCP servers typically use HTTP POST with JSON-RPC-like protocol
      // For Atlassian MCP server, we'll use the standard MCP protocol
      const response = await fetch(`${this.mcpServerUrl}/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`MCP tool call failed: ${error.error?.message || response.statusText}`);
      }

      const result = await response.json();
      return result.result || result;
    } catch (error) {
      console.error(`MCP tool call error (${toolName}):`, error);
      throw error;
    }
  }

  /**
   * List available Jira projects
   * @param {string} accessToken - OAuth access token
   * @returns {Promise<Array>} List of projects
   */
  async getProjects(accessToken) {
    try {
      // Try MCP tool first
      const result = await this.callMCPTool('jira_list_projects', {}, accessToken);
      
      // Handle different response formats
      if (result.projects && Array.isArray(result.projects)) {
        return result.projects;
      }
      
      if (Array.isArray(result)) {
        return result;
      }

      // Fallback: Try direct Jira REST API if MCP tool doesn't work
      return await this.getProjectsDirect(accessToken);
    } catch (error) {
      console.error('Error getting projects via MCP, trying direct API:', error);
      // Fallback to direct API
      return await this.getProjectsDirect(accessToken);
    }
  }

  /**
   * Get projects directly from Jira REST API (fallback)
   * @param {string} accessToken - OAuth access token
   * @returns {Promise<Array>} List of projects
   */
  async getProjectsDirect(accessToken) {
    try {
      // Get cloud ID first
      const cloudIdResponse = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!cloudIdResponse.ok) {
        throw new Error('Failed to get accessible resources');
      }

      const resources = await cloudIdResponse.json();
      if (!resources || resources.length === 0) {
        throw new Error('No accessible Jira resources found');
      }

      const cloudId = resources[0].id;

      // Get projects
      const projectsResponse = await fetch(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!projectsResponse.ok) {
        throw new Error('Failed to get projects');
      }

      const projects = await projectsResponse.json();
      return projects.map(project => ({
        key: project.key,
        id: project.id,
        name: project.name,
        projectTypeKey: project.projectTypeKey,
      }));
    } catch (error) {
      console.error('Error getting projects directly:', error);
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

    try {
      // Try MCP tool first
      const result = await this.callMCPTool('jira_get_issue_types', { projectKey }, accessToken);
      
      // Handle different response formats
      if (result.issueTypes && Array.isArray(result.issueTypes)) {
        return result.issueTypes;
      }
      
      if (Array.isArray(result)) {
        return result;
      }

      // Fallback: Try direct Jira REST API
      return await this.getIssueTypesDirect(projectKey, accessToken);
    } catch (error) {
      console.error('Error getting issue types via MCP, trying direct API:', error);
      // Fallback to direct API
      return await this.getIssueTypesDirect(projectKey, accessToken);
    }
  }

  /**
   * Get issue types directly from Jira REST API (fallback)
   * @param {string} projectKey - Project key
   * @param {string} accessToken - OAuth access token
   * @returns {Promise<Array>} List of issue types
   */
  async getIssueTypesDirect(projectKey, accessToken) {
    try {
      // Get cloud ID first
      const cloudIdResponse = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!cloudIdResponse.ok) {
        throw new Error('Failed to get accessible resources');
      }

      const resources = await cloudIdResponse.json();
      if (!resources || resources.length === 0) {
        throw new Error('No accessible Jira resources found');
      }

      const cloudId = resources[0].id;

      // Get issue types for project
      const issueTypesResponse = await fetch(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project/${projectKey}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!issueTypesResponse.ok) {
        throw new Error('Failed to get project issue types');
      }

      const project = await issueTypesResponse.json();
      return project.issueTypes || [];
    } catch (error) {
      console.error('Error getting issue types directly:', error);
      throw error;
    }
  }
}

export default new JiraMCPClientService();
