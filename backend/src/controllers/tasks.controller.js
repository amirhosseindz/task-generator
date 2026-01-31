import { validationResult } from 'express-validator';
import openaiService from '../services/openai.service.js';

/**
 * Generate tasks from meeting minutes
 * POST /api/tasks/generate
 */
export const generateTasks = async (req, res, next) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/bae9a160-b71d-481f-8ab8-0f7e4f312bd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks.controller.js:generateTasks:entry',message:'POST /generate hit',data:{hasBody:!!req.body,bodyKeys:req.body?Object.keys(req.body):[]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/bae9a160-b71d-481f-8ab8-0f7e4f312bd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks.controller.js:beforeOpenAI',message:'before openaiService.extractTasks',data:{meetingMinutesLen:meetingMinutes?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
    // #endregion
    // Extract tasks using OpenAI service
    const result = await openaiService.extractTasks(meetingMinutes);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/bae9a160-b71d-481f-8ab8-0f7e4f312bd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks.controller.js:afterOpenAI',message:'openaiService.extractTasks succeeded',data:{taskCount:result?.tasks?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    res.json({
      tasks: result.tasks,
    });
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/bae9a160-b71d-481f-8ab8-0f7e4f312bd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks.controller.js:catch',message:'controller catch',data:{errMsg:error?.message,responseStatus:error?.response?.status,hasResponse:!!error?.response},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C,D'})}).catch(()=>{});
    // #endregion
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
