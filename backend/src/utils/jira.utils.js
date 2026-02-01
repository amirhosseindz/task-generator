import crypto from 'crypto';

/**
 * Jira utility functions for parsing responses and validation
 */

/**
 * Parse OpenAI response to extract Jira issue keys
 * @param {string} openAiResponse - The raw response from OpenAI
 * @returns {Array<{issueKey: string, url?: string}>} Array of issue information
 */
export function parseJiraResponse(openAiResponse) {
  try {
    // Try to parse as JSON first
    let parsed;
    if (typeof openAiResponse === 'string') {
      // Remove markdown code blocks if present
      const cleaned = openAiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } else {
      parsed = openAiResponse;
    }

    // Handle different response formats
    if (parsed.issues && Array.isArray(parsed.issues)) {
      return parsed.issues.map(issue => ({
        issueKey: issue.key || issue.issueKey,
        url: issue.url || issue.self,
      }));
    }

    if (parsed.issue && parsed.issue.key) {
      return [{
        issueKey: parsed.issue.key,
        url: parsed.issue.url || parsed.issue.self,
      }];
    }

    // Try to extract issue keys from text using regex
    const issueKeyPattern = /([A-Z]+-\d+)/g;
    const matches = openAiResponse.match(issueKeyPattern);
    if (matches) {
      return matches.map(key => ({ issueKey: key }));
    }

    return [];
  } catch (error) {
    console.error('Error parsing Jira response:', error);
    return [];
  }
}

/**
 * Validate OAuth token structure
 * @param {Object} tokens - OAuth tokens object
 * @returns {boolean} True if valid, false otherwise
 */
export function validateOAuthTokens(tokens) {
  if (!tokens || typeof tokens !== 'object') {
    return false;
  }

  // Check for required fields
  if (!tokens.access_token || typeof tokens.access_token !== 'string') {
    return false;
  }

  // Check expiration if present
  if (tokens.expires_at && typeof tokens.expires_at !== 'number') {
    return false;
  }

  return true;
}

/**
 * Check if OAuth token is expired
 * @param {Object} tokens - OAuth tokens object
 * @returns {boolean} True if expired, false otherwise
 */
export function isTokenExpired(tokens) {
  if (!tokens || !tokens.expires_at) {
    return false; // Assume not expired if no expiration info
  }

  // Add 5 minute buffer before actual expiration
  const buffer = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() >= (tokens.expires_at - buffer);
}

/**
 * Extract issue key from Jira URL
 * @param {string} url - Jira issue URL
 * @returns {string|null} Issue key or null
 */
export function extractIssueKeyFromUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const match = url.match(/\/([A-Z]+-\d+)(?:\?|$|\/)/);
  return match ? match[1] : null;
}

/**
 * Generate OAuth state parameter for CSRF protection
 * @returns {string} Random state string
 */
export function generateOAuthState() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Convert task object to Jira issue format
 * @param {Object} task - Task object with subject, criteria, actionItems, assignee, priority
 * @param {string} projectKey - Jira project key
 * @param {string} issueType - Jira issue type
 * @param {string|null} assigneeAccountId - Jira account ID for assignee (optional)
 * @returns {Object} Jira issue data
 */
export function convertTaskToJiraIssue(task, projectKey, issueType, assigneeAccountId = null) {
  // Determine if issueType is an ID (numeric string) or a name
  // Jira API requires: { id: "..." } for IDs, { name: "..." } for names
  const isNumericId = /^\d+$/.test(String(issueType));
  const issuetypeField = isNumericId 
    ? { id: issueType }
    : { name: issueType };
  
  const issue = {
    fields: {
      project: {
        key: projectKey,
      },
      summary: task.subject || 'Untitled Task',
      issuetype: issuetypeField,
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
}

/**
 * Format description as Atlassian Document Format (ADF)
 * @param {string} criteria - Acceptance criteria
 * @param {Array<string>} actionItems - Action items array
 * @returns {Object} ADF document structure
 */
export function formatDescriptionAsADF(criteria, actionItems = []) {
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
}
