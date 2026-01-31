import express from 'express';
import { body, param, query } from 'express-validator';
import {
  initiateOAuth,
  handleOAuthCallback,
  getConfigStatus,
  clearConfig,
  getProjects,
  getIssueTypes,
  exportTasks,
} from '../controllers/jira.controller.js';

const router = express.Router();

/**
 * GET /api/jira/oauth/authorize
 * Initiate OAuth flow, return authorization URL
 */
router.get('/oauth/authorize', initiateOAuth);

/**
 * POST /api/jira/oauth/callback
 * Handle OAuth callback, exchange code for tokens (for programmatic calls)
 */
router.post(
  '/oauth/callback',
  [
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Authorization code is required'),
    body('state')
      .trim()
      .notEmpty()
      .withMessage('State parameter is required'),
  ],
  handleOAuthCallback
);

/**
 * GET /api/jira/oauth/callback
 * Handle OAuth callback, exchange code for tokens (for browser redirects from Jira)
 */
router.get(
  '/oauth/callback',
  [
    query('code')
      .trim()
      .notEmpty()
      .withMessage('Authorization code is required'),
    query('state')
      .trim()
      .notEmpty()
      .withMessage('State parameter is required'),
  ],
  handleOAuthCallback
);

/**
 * GET /api/jira/config/status
 * Check if Jira is authenticated (has OAuth tokens)
 */
router.get('/config/status', getConfigStatus);

/**
 * DELETE /api/jira/config
 * Clear OAuth tokens from session
 */
router.delete('/config', clearConfig);

/**
 * GET /api/jira/projects
 * List available Jira projects (via Jira REST API)
 */
router.get('/projects', getProjects);

/**
 * GET /api/jira/issue-types/:projectKey
 * Get issue types for project (via Jira REST API)
 */
router.get(
  '/issue-types/:projectKey',
  [
    param('projectKey')
      .trim()
      .notEmpty()
      .withMessage('Project key is required')
      .matches(/^[A-Z]+$/)
      .withMessage('Project key must be uppercase letters only'),
  ],
  getIssueTypes
);

/**
 * POST /api/jira/export
 * Export tasks to Jira via Jira REST API
 */
router.post(
  '/export',
  [
    body('tasks')
      .isArray({ min: 1 })
      .withMessage('Tasks array is required and must not be empty'),
    body('tasks.*.id')
      .notEmpty()
      .withMessage('Each task must have an id'),
    body('tasks.*.subject')
      .trim()
      .notEmpty()
      .withMessage('Each task must have a subject'),
    body('projectKey')
      .trim()
      .notEmpty()
      .withMessage('Project key is required')
      .matches(/^[A-Z]+$/)
      .withMessage('Project key must be uppercase letters only'),
    body('issueType')
      .trim()
      .notEmpty()
      .withMessage('Issue type is required'),
  ],
  exportTasks
);

export default router;
