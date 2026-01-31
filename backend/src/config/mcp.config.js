import dotenv from 'dotenv';

dotenv.config();

/**
 * MCP Configuration
 * Configures MCP client connection settings
 */
export const mcpConfig = {
  // Timeout for MCP operations in milliseconds
  timeout: parseInt(process.env.MCP_TIMEOUT, 10) || 30000,
  
  // Retry configuration
  retry: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
  },
  
  // MCP server URL (if using remote server, otherwise embedded)
  serverUrl: process.env.MCP_JIRA_SERVER_URL || null,
};

export default mcpConfig;
