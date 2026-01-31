import express from 'express';
import { body } from 'express-validator';
import { generateTasks, healthCheck } from '../controllers/tasks.controller.js';

const router = express.Router();

/**
 * POST /api/tasks/generate
 * Generate tasks from meeting minutes
 */
router.post(
  '/generate',
  [
    body('meetingMinutes')
      .trim()
      .notEmpty()
      .withMessage('meetingMinutes is required')
      .isLength({ min: 10 })
      .withMessage('meetingMinutes must be at least 10 characters long'),
  ],
  generateTasks
);

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', healthCheck);

export default router;
