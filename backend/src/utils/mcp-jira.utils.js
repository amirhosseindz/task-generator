/**
 * Utility functions for MCP Jira integration
 */

/**
 * Convert task object to Jira issue format
 * @param {Object} task - Task object with subject, criteria, actionItems, assignee, priority
 * @param {string} projectKey - Jira project key
 * @param {string} issueType - Jira issue type
 * @param {string|null} assigneeAccountId - Jira account ID for assignee (optional)
 * @returns {Object} Jira issue data
 */
export const convertTaskToJiraIssue = (task, projectKey, issueType, assigneeAccountId = null) => {
  const issue = {
    fields: {
      project: {
        key: projectKey,
      },
      summary: task.subject || 'Untitled Task',
      issuetype: {
        name: issueType,
      },
      description: formatDescriptionAsADF(task.criteria, task.actionItems),
    },
  };

  // Map priority
  if (task.priority) {
    const priorityMap = {
      high: 'Highest',
      medium: 'Medium',
      low: 'Low',
    };
    issue.fields.priority = {
      name: priorityMap[task.priority.toLowerCase()] || 'Medium',
    };
  }

  // Add assignee if provided
  if (assigneeAccountId) {
    issue.fields.assignee = {
      accountId: assigneeAccountId,
    };
  }

  return issue;
};

/**
 * Format description as Atlassian Document Format (ADF)
 * @param {string} criteria - Acceptance criteria
 * @param {Array<string>} actionItems - Action items array
 * @returns {Object} ADF document structure
 */
export const formatDescriptionAsADF = (criteria, actionItems = []) => {
  const content = [];

  // Add criteria section
  if (criteria) {
    content.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Acceptance Criteria:',
          marks: [{ type: 'strong' }],
        },
      ],
    });
    content.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: criteria,
        },
      ],
    });
  }

  // Add action items section
  if (actionItems && actionItems.length > 0) {
    content.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Action Items:',
          marks: [{ type: 'strong' }],
        },
      ],
    });

    const listItems = actionItems.map((item) => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: item,
            },
          ],
        },
      ],
    }));

    content.push({
      type: 'bulletList',
      content: listItems,
    });
  }

  // If no content, add a default paragraph
  if (content.length === 0) {
    content.push({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Task created from meeting minutes',
        },
      ],
    });
  }

  return {
    version: 1,
    type: 'doc',
    content,
  };
};

/**
 * Extract error message from MCP response
 * @param {Object} mcpResponse - MCP response object
 * @returns {string} Error message
 */
export const extractMCPError = (mcpResponse) => {
  if (mcpResponse.error) {
    if (typeof mcpResponse.error === 'string') {
      return mcpResponse.error;
    }
    if (mcpResponse.error.message) {
      return mcpResponse.error.message;
    }
    if (mcpResponse.error.code) {
      return `MCP Error ${mcpResponse.error.code}: ${mcpResponse.error.message || 'Unknown error'}`;
    }
  }
  return 'Unknown MCP error';
};

/**
 * Validate Jira credentials format
 * @param {string} email - Jira email
 * @param {string} apiToken - Jira API token
 * @param {string} domain - Jira domain
 * @returns {Object} Validation result with isValid and error message
 */
export const validateJiraCredentials = (email, apiToken, domain) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { isValid: false, error: 'Invalid email address' };
  }

  if (!apiToken || typeof apiToken !== 'string' || apiToken.length < 10) {
    return { isValid: false, error: 'Invalid API token' };
  }

  if (!domain || typeof domain !== 'string') {
    return { isValid: false, error: 'Invalid domain' };
  }

  // Basic domain validation (should contain .atlassian.net or be a valid domain)
  if (!domain.includes('.') && !domain.includes('atlassian.net')) {
    return { isValid: false, error: 'Domain should be in format: your-domain.atlassian.net' };
  }

  return { isValid: true };
};
