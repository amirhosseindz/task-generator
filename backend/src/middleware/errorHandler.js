/**
 * Centralized error handling middleware
 * Handles all errors and returns appropriate responses
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/bae9a160-b71d-481f-8ab8-0f7e4f312bd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'errorHandler.js:entry',message:'errorHandler invoked',data:{errMsg:err?.message,errStatus:err?.status,errStatusCode:err?.statusCode,responseStatus:err?.response?.status,hasResponse:!!err?.response},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
  // #endregion
  // Default error status and message
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Handle validation errors from express-validator
  if (err.type === 'validation') {
    status = 400;
    message = err.message;
  }

  // Handle OpenAI API errors (do not forward 401/403 to client; use 502)
  if (err.response?.status) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/bae9a160-b71d-481f-8ab8-0f7e4f312bd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'errorHandler.js:openaiBranch',message:'OpenAI error mapped to 502',data:{upstreamStatus:err.response.status,runId:'post-fix'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    status = 502;
    message = 'Failed to generate tasks. Please try again.';
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production' && status === 500) {
    message = 'Internal server error';
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/bae9a160-b71d-481f-8ab8-0f7e4f312bd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'errorHandler.js:send',message:'sending response',data:{status,messageType:typeof message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  res.status(status).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
