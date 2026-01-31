import jiraApiClient from './jira-api-client.service.js';
import { convertTaskToJiraIssue } from '../utils/jira.utils.js';

/**
 * Jira Export Service
 * Exports tasks to Jira using direct REST API calls
 */
class JiraExportService {
  /**
   * Export tasks to Jira by creating issues directly via REST API
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

    const results = {};
    const errors = [];

    // Process tasks sequentially to avoid rate limiting and maintain order
    for (const task of tasks) {
      try {
        // Convert task to Jira issue format
        const issueData = convertTaskToJiraIssue(task, projectKey, issueType);
        
        // Create issue in Jira
        const createdIssue = await jiraApiClient.createIssue(issueData, oauthToken);
        
        // Map task ID to issue key
        const taskId = task.id || `task-${tasks.indexOf(task)}`;
        results[taskId] = {
          issueKey: createdIssue.key,
          url: createdIssue.url,
          success: true,
        };
      } catch (error) {
        // Log error but continue with other tasks
        const taskId = task.id || `task-${tasks.indexOf(task)}`;
        errors.push({
          taskId,
          error: error.message || 'Failed to create issue',
        });
        
        results[taskId] = {
          issueKey: null,
          url: null,
          success: false,
          error: error.message || 'Failed to create issue',
        };
        
        console.error(`Failed to export task ${taskId}:`, error);
      }
    }

    // If all tasks failed, throw an error
    if (errors.length === tasks.length) {
      throw new Error(`All tasks failed to export: ${errors.map(e => e.error).join('; ')}`);
    }

    // Log summary
    const successCount = Object.values(results).filter(r => r.success).length;
    const failureCount = tasks.length - successCount;
    
    if (failureCount > 0) {
      console.warn(`Export completed with ${successCount} successful and ${failureCount} failed exports`);
    }

    return {
      results,
      summary: {
        total: tasks.length,
        successful: successCount,
        failed: failureCount,
      },
    };
  }
}

export default new JiraExportService();
