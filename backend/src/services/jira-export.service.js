import OpenAI from 'openai';
import dotenv from 'dotenv';
import { parseJiraResponse } from '../utils/jira.utils.js';

dotenv.config();

/**
 * Jira Export Service
 * Exports tasks to Jira using OpenAI with MCP tools
 */
class JiraExportService {
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });

    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.mcpServerUrl = process.env.JIRA_MCP_SERVER_URL || 'https://mcp.atlassian.com/v1/mcp';
  }

  /**
   * Export tasks to Jira using OpenAI with MCP tools
   * @param {Array} tasks - Array of task objects with IDs
   * @param {string} projectKey - Jira project key
   * @param {string} issueType - Jira issue type (e.g., "Task", "Story", "Bug")
   * @param {string} oauthToken - OAuth access token
   * @returns {Promise<Object>} Export results with taskId → issueKey mapping
   */
  async exportTasksToJira(tasks, projectKey, issueType, oauthToken) {
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      throw new Error('Tasks array is required and must not be empty');
    }

    if (!projectKey) {
      throw new Error('Project key is required');
    }

    if (!issueType) {
      throw new Error('Issue type is required');
    }

    if (!oauthToken) {
      throw new Error('OAuth access token is required');
    }

    // Build prompt with structured task JSON
    const systemPrompt = `You are a Jira integration assistant. Create Jira issues from the provided task data.

For each task, create a Jira issue in the specified project with the following details:
- Project: ${projectKey}
- Issue Type: ${issueType}
- Summary: Use the task subject
- Description: Include the criteria and action items in a structured format
- Assignee: Use the task assignee if provided
- Priority: Map task priority to Jira priority (High/Medium/Low)

Use the MCP tools available to create the issues. Return a JSON object mapping each task ID to the created issue key and URL.

Return format:
{
  "results": [
    {
      "taskId": "task-uuid",
      "issueKey": "PROJ-123",
      "url": "https://your-domain.atlassian.net/browse/PROJ-123",
      "success": true
    }
  ]
}`;

    const userPrompt = `Create Jira issues for the following tasks:

${JSON.stringify(tasks, null, 2)}

Project: ${projectKey}
Issue Type: ${issueType}

Create one issue per task and return the mapping of task IDs to issue keys.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'mcp',
            server_url: this.mcpServerUrl,
            authorization: {
              type: 'bearer',
              token: oauthToken,
            },
            require_approval: 'never',
          },
        ],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      // Parse the response to extract issue keys
      const parsed = this.parseExportResponse(content, tasks);

      return parsed;
    } catch (error) {
      console.error('Jira export error:', error);
      
      // Handle OpenAI API errors
      if (error.response) {
        throw new Error(`OpenAI API error: ${error.response.status} - ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Parse OpenAI response to extract task-to-issue mappings
   * @param {string} content - OpenAI response content
   * @param {Array} tasks - Original tasks array
   * @returns {Object} Parsed results with taskId → issueKey mapping
   */
  parseExportResponse(content, tasks) {
    try {
      // Try to parse as JSON first
      let parsed;
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        parsed = JSON.parse(cleaned);
      } catch (e) {
        // If not JSON, try to extract issue keys from text
        return this.extractIssueKeysFromText(content, tasks);
      }

      // Handle structured response
      if (parsed.results && Array.isArray(parsed.results)) {
        const results = {};
        parsed.results.forEach(result => {
          if (result.taskId && result.issueKey) {
            results[result.taskId] = {
              issueKey: result.issueKey,
              url: result.url || null,
              success: result.success !== false,
            };
          }
        });
        return { results };
      }

      // Fallback: extract from text
      return this.extractIssueKeysFromText(content, tasks);
    } catch (error) {
      console.error('Error parsing export response:', error);
      // Return empty results on parse error
      return {
        results: {},
        error: 'Failed to parse export response',
      };
    }
  }

  /**
   * Extract issue keys from text response
   * @param {string} text - Response text
   * @param {Array} tasks - Original tasks array
   * @returns {Object} Results with extracted issue keys
   */
  extractIssueKeysFromText(text, tasks) {
    const results = {};
    const issueKeyPattern = /([A-Z]+-\d+)/g;
    const matches = text.match(issueKeyPattern);
    
    if (matches && matches.length > 0) {
      // Try to map issue keys to tasks (simple sequential mapping)
      tasks.forEach((task, index) => {
        if (matches[index]) {
          results[task.id || `task-${index}`] = {
            issueKey: matches[index],
            url: null,
            success: true,
          };
        }
      });
    }

    return { results };
  }
}

export default new JiraExportService();
