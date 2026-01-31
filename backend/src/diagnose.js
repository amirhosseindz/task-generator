// #region agent log
import { readFileSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';

const logPath = '/Users/amirhosseindashtizade/Projects/task-generator/.cursor/debug.log';
const log = (data) => {
  try {
    const logEntry = JSON.stringify({...data, timestamp: Date.now(), sessionId: 'debug-session'}) + '\n';
    appendFileSync(logPath, logEntry);
  } catch (e) {}
};

const cwd = process.cwd();
log({runId: 'diagnostic', hypothesisId: 'E', location: 'diagnose.js:1', message: 'Working directory check', data: {cwd}});

const packageJsonPath = join(cwd, 'package.json');
const packageJsonExists = existsSync(packageJsonPath);
log({runId: 'diagnostic', hypothesisId: 'A', location: 'diagnose.js:2', message: 'package.json existence check', data: {packageJsonPath, packageJsonExists}});

if (packageJsonExists) {
  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const hasExpressSession = !!(pkg.dependencies && pkg.dependencies['express-session']);
    log({runId: 'diagnostic', hypothesisId: 'A', location: 'diagnose.js:3', message: 'package.json content check', data: {hasExpressSession, deps: Object.keys(pkg.dependencies || {}), expressSessionVersion: pkg.dependencies?.['express-session']}});
  } catch (e) {
    log({runId: 'diagnostic', hypothesisId: 'A', location: 'diagnose.js:4', message: 'package.json parse error', data: {error: e.message}});
  }
}

const nodeModulesPath = join(cwd, 'node_modules');
const nodeModulesExists = existsSync(nodeModulesPath);
log({runId: 'diagnostic', hypothesisId: 'B', location: 'diagnose.js:5', message: 'node_modules existence check', data: {nodeModulesPath, nodeModulesExists}});

const expressSessionPath = join(nodeModulesPath, 'express-session');
const expressSessionExists = existsSync(expressSessionPath);
log({runId: 'diagnostic', hypothesisId: 'B', location: 'diagnose.js:6', message: 'express-session package check', data: {expressSessionPath, expressSessionExists}});

if (expressSessionExists) {
  try {
    const expressSessionPkg = JSON.parse(readFileSync(join(expressSessionPath, 'package.json'), 'utf8'));
    log({runId: 'diagnostic', hypothesisId: 'B', location: 'diagnose.js:7', message: 'express-session package.json found', data: {name: expressSessionPkg.name, version: expressSessionPkg.version}});
  } catch (e) {
    log({runId: 'diagnostic', hypothesisId: 'B', location: 'diagnose.js:8', message: 'express-session package.json read error', data: {error: e.message}});
  }
}

// Check if we can resolve the module
try {
  const resolved = await import.meta.resolve('express-session');
  log({runId: 'diagnostic', hypothesisId: 'B', location: 'diagnose.js:9', message: 'express-session module resolution', data: {resolved, success: true}});
} catch (e) {
  log({runId: 'diagnostic', hypothesisId: 'B', location: 'diagnose.js:10', message: 'express-session module resolution failed', data: {error: e.message, code: e.code}});
}
// #endregion
