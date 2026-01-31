import { validationResult } from 'express-validator';
import jiraOAuthService from '../services/jira-oauth.service.js';
import jiraApiClient from '../services/jira-api-client.service.js';
import jiraExportService from '../services/jira-export.service.js';
import { generateOAuthState } from '../utils/jira.utils.js';

/**
 * Initiate OAuth flow - return authorization URL
 * GET /api/jira/oauth/authorize
 */
export const initiateOAuth = (req, res, next) => {
  try {
    const state = generateOAuthState();
    
    // Store state in session for CSRF protection
    req.session.oauthState = state;
    
    const authUrl = jiraOAuthService.initiateOAuthFlow(state);
    
    res.json({
      authorizationUrl: authUrl,
      state: state,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle OAuth callback - exchange code for tokens
 * POST /api/jira/oauth/callback
 */
export const handleOAuthCallback = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
      });
    }

    // Extract code and state from either body (POST) or query (GET)
    const code = req.body?.code || req.query?.code;
    const state = req.body?.state || req.query?.state;

    // Verify state parameter for CSRF protection
    if (!req.session.oauthState || req.session.oauthState !== state) {
      return res.status(400).json({
        error: {
          message: 'Invalid state parameter',
        },
      });
    }

    // Clear state from session
    delete req.session.oauthState;

    // Exchange code for tokens
    const tokens = await jiraOAuthService.handleOAuthCallback(code);

    // Store tokens in session (encrypted)
    jiraOAuthService.storeTokens(req.session, tokens);

    // For GET requests (browser redirects), return HTML page that posts message to parent
    if (req.method === 'GET') {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Jira OAuth Success</title>
        </head>
        <body>
          <script>
            // Post success message to parent window (if in popup)
            if (window.opener) {
              window.opener.postMessage({
                type: 'JIRA_OAUTH_SUCCESS'
              }, window.location.origin);
              window.close();
            } else {
              // If not in popup, redirect to frontend
              window.location.href = '${process.env.CORS_ORIGIN || 'http://localhost:3000'}';
            }
          </script>
          <p>Authentication successful! You can close this window.</p>
        </body>
        </html>
      `);
    }

    // For POST requests (programmatic), return JSON
    res.json({
      success: true,
      message: 'OAuth authentication successful',
    });
  } catch (error) {
    // For GET requests, return error page
    if (req.method === 'GET') {
      const errorMessage = (error.message || 'Unknown error').replace(/'/g, "\\'").replace(/"/g, '\\"');
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Jira OAuth Error</title>
        </head>
        <body>
          <script>
            // Post error message to parent window (if in popup)
            if (window.opener) {
              window.opener.postMessage({
                type: 'JIRA_OAUTH_ERROR',
                error: '${errorMessage}'
              }, window.location.origin);
              window.close();
            }
          </script>
          <p>Authentication failed: ${errorMessage}</p>
        </body>
        </html>
      `);
    }
    
    next(error);
  }
};

/**
 * Check if Jira is authenticated
 * GET /api/jira/config/status
 */
export const getConfigStatus = (req, res, next) => {
  try {
    const tokens = jiraOAuthService.getTokens(req.session);
    const isAuthenticated = !!tokens;

    res.json({
      authenticated: isAuthenticated,
      hasTokens: isAuthenticated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear OAuth tokens from session
 * DELETE /api/jira/config
 */
export const clearConfig = (req, res, next) => {
  try {
    jiraOAuthService.clearTokens(req.session);
    
    res.json({
      success: true,
      message: 'Jira configuration cleared',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List available Jira projects
 * GET /api/jira/projects
 */
export const getProjects = async (req, res, next) => {
  try {
    // Get valid access token
    const accessToken = await jiraOAuthService.getValidAccessToken(req.session);
    
    if (!accessToken) {
      return res.status(401).json({
        error: {
          message: 'Not authenticated. Please connect to Jira first.',
        },
      });
    }

    const projects = await jiraApiClient.getProjects(accessToken);

    res.json({
      projects: projects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get issue types for a project
 * GET /api/jira/issue-types/:projectKey
 */
export const getIssueTypes = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
      });
    }

    const { projectKey } = req.params;

    // Get valid access token
    const accessToken = await jiraOAuthService.getValidAccessToken(req.session);
    
    if (!accessToken) {
      return res.status(401).json({
        error: {
          message: 'Not authenticated. Please connect to Jira first.',
        },
      });
    }

    const issueTypes = await jiraApiClient.getIssueTypes(projectKey, accessToken);

    res.json({
      issueTypes: issueTypes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export tasks to Jira
 * POST /api/jira/export
 */
export const exportTasks = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
      });
    }

    const { tasks, projectKey, issueType } = req.body;

    // Get valid access token
    const accessToken = await jiraOAuthService.getValidAccessToken(req.session);
    
    if (!accessToken) {
      return res.status(401).json({
        error: {
          message: 'Not authenticated. Please connect to Jira first.',
        },
      });
    }

    // Export tasks to Jira
    const exportResult = await jiraExportService.exportTasksToJira(
      tasks,
      projectKey,
      issueType,
      accessToken
    );

    res.json({
      success: true,
      results: exportResult.results || {},
      summary: exportResult.summary,
      message: 'Tasks exported successfully',
    });
  } catch (error) {
    next(error);
  }
};
