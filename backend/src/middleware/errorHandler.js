/**
 * Centralized error handling middleware
 * Handles all errors and returns appropriate responses
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error status and message
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Handle validation errors from express-validator
  if (err.type === 'validation') {
    status = 400;
    message = err.message;
  }

  // Handle OpenAI API errors
  if (err.response?.status) {
    status = err.response.status;
    message = 'Failed to generate tasks. Please try again.';
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production' && status === 500) {
    message = 'Internal server error';
  }

  res.status(status).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
