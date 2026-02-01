import { validationResult } from 'express-validator';
import openaiService from '../services/openai.service.js';

/**
 * Generate tasks from meeting minutes
 * POST /api/tasks/generate
 */
export const generateTasks = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: errors.array(),
        },
      });
    }

    const { meetingMinutes } = req.body;

    // Extract tasks using OpenAI service
    const result = await openaiService.extractTasks(meetingMinutes);

    res.json({
      tasks: result.tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Health check endpoint
 * GET /api/health
 */
export const healthCheck = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
};
