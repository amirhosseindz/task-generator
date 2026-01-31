// #region agent log
import { readFileSync, existsSync, appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logPath = '/Users/amirhosseindashtizade/Projects/task-generator/.cursor/debug.log';
const log = (data) => {
  try {
    const logEntry = JSON.stringify({...data, timestamp: Date.now(), sessionId: 'debug-session'}) + '\n';
    appendFileSync(logPath, logEntry);
  } catch (e) {}
};
const cwd = process.cwd();
log({runId: 'pre-import', hypothesisId: 'E', location: 'index.js:1', message: 'Working directory check', data: {cwd}});
const packageJsonPath = join(cwd, 'package.json');
const packageJsonExists = existsSync(packageJsonPath);
log({runId: 'pre-import', hypothesisId: 'A', location: 'index.js:2', message: 'package.json existence check', data: {packageJsonPath, packageJsonExists}});
if (packageJsonExists) {
  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const hasExpressSession = !!(pkg.dependencies && pkg.dependencies['express-session']);
    log({runId: 'pre-import', hypothesisId: 'A', location: 'index.js:3', message: 'package.json content check', data: {hasExpressSession, deps: Object.keys(pkg.dependencies || {})}});
  } catch (e) {
    log({runId: 'pre-import', hypothesisId: 'A', location: 'index.js:4', message: 'package.json parse error', data: {error: e.message}});
  }
}
const nodeModulesPath = join(cwd, 'node_modules');
const nodeModulesExists = existsSync(nodeModulesPath);
log({runId: 'pre-import', hypothesisId: 'B', location: 'index.js:5', message: 'node_modules existence check', data: {nodeModulesPath, nodeModulesExists}});
const expressSessionPath = join(nodeModulesPath, 'express-session');
const expressSessionExists = existsSync(expressSessionPath);
log({runId: 'pre-import', hypothesisId: 'B', location: 'index.js:6', message: 'express-session package check', data: {expressSessionPath, expressSessionExists}});
// #endregion

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// #region agent log
log({runId: 'pre-import', hypothesisId: 'B', location: 'index.js:7', message: 'About to dynamically import express-session', data: {}});
let session;
try {
  const sessionModule = await import('express-session');
  session = sessionModule.default || sessionModule;
  log({runId: 'pre-import', hypothesisId: 'B', location: 'index.js:8', message: 'express-session dynamic import succeeded', data: {hasDefault: !!sessionModule.default}});
} catch (e) {
  log({runId: 'pre-import', hypothesisId: 'B', location: 'index.js:9', message: 'express-session dynamic import failed', data: {error: e.message, code: e.code, stack: e.stack}});
  throw e;
}
// #endregion
import tasksRoutes from './routes/tasks.routes.js';
import jiraRoutes from './routes/jira.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // CSRF protection
  },
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionConfig));
app.use(logger);

// Routes
app.use('/api/tasks', tasksRoutes);
app.use('/api/jira', jiraRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Task Generator API',
    version: '1.0.0',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server only if not in test environment
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    gracefulShutdown('unhandledRejection');
  });
}

export default app;
