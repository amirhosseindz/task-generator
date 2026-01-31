# Jira Integration Setup Guide

This guide walks you through setting up Jira integration for the Task Generator application, including OAuth 2.1 authentication and direct REST API integration.

## Overview

The Task Generator uses Atlassian OAuth 2.1 to authenticate with Jira and makes direct REST API calls to interact with Jira. This allows you to export tasks directly from the application to your Jira instance.

## Prerequisites

- An Atlassian account with access to a Jira site (Cloud or Server)
- Admin access to create OAuth apps in your Atlassian account
- Backend access to configure environment variables

## Step 1: Create an Atlassian OAuth App

1. **Navigate to Atlassian Developer Console**
   - Go to https://developer.atlassian.com/console/myapps/
   - Sign in with your Atlassian account

2. **Create a New OAuth 2.1 App**
   - Click "Create" → "OAuth 2.1 (3LO)" app
   - Fill in the app details:
     - **App name**: Task Generator (or your preferred name)
     - **App logo**: Optional
     - **App description**: Optional description

3. **Configure Authorization Settings**
   - **Authorization callback URL**: 
     - Development: `http://localhost:5000/api/jira/oauth/callback`
     - Production: `https://your-domain.com/api/jira/oauth/callback`
   - **Scopes**: Select the following scopes:
     - `read:jira-work` - Read Jira issues and projects
     - `write:jira-work` - Create and update Jira issues
     - `manage:jira-project` - Manage Jira projects (optional, for advanced features)

4. **Save and Note Your Credentials**
   - After creating the app, you'll see:
     - **Client ID**: Copy this value
     - **Client Secret**: Copy this value (you may need to reveal it)
   - **Important**: Store these credentials securely. You'll need them for backend configuration.

## Step 2: Configure Backend Environment Variables

Configure the following environment variables in your backend environment file (`backend/.env.development` for development or `backend/.env.production` for production):

### Required Variables

```env
# Atlassian OAuth Client ID (from Step 1)
ATLASSIAN_CLIENT_ID=your-client-id-here

# Atlassian OAuth Client Secret (from Step 1)
ATLASSIAN_CLIENT_SECRET=your-client-secret-here

# OAuth Redirect URI (must match the callback URL in your OAuth app)
OAUTH_REDIRECT_URI=http://localhost:5000/api/jira/oauth/callback

# Session Secret (for secure session management)
SESSION_SECRET=your-session-secret-here
```

### Optional Variables

```env
# Credential Encryption Key (optional, falls back to SESSION_SECRET)
CREDENTIAL_ENCRYPTION_KEY=your-encryption-key-here
```

### Generating Secure Secrets

Generate strong random strings for `SESSION_SECRET` and `CREDENTIAL_ENCRYPTION_KEY`:

**Using OpenSSL:**
```bash
openssl rand -hex 32
```

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important Security Notes:**
- Use different secrets for development and production
- Never commit secrets to version control
- Store production secrets securely (e.g., environment variable management service)
- Rotate secrets periodically

## Step 3: Production Configuration

For production deployments, update the following:

1. **OAuth App Configuration**
   - Update the authorization callback URL in your Atlassian OAuth app to your production domain:
     - `https://your-production-domain.com/api/jira/oauth/callback`

2. **Backend Environment Variables**
   ```env
   OAUTH_REDIRECT_URI=https://your-production-domain.com/api/jira/oauth/callback
   ```

3. **CORS Configuration**
   - Ensure `CORS_ORIGIN` in your backend environment matches your frontend domain
   - Example: `CORS_ORIGIN=https://your-frontend-domain.com`

4. **Session Security**
   - Ensure `NODE_ENV=production` is set
   - This enables secure cookies (HTTPS only) and stricter session settings

## Step 4: Verify Configuration

1. **Start the Application**
   ```bash
   make start  # For development
   # or
   make start ENV=prod  # For production
   ```

2. **Test OAuth Connection**
   - Open the application in your browser
   - Click "Connect to Jira"
   - You should be redirected to Atlassian login
   - After authorizing, you should see "Connected" status

3. **Test Project Listing**
   - After connecting, try exporting a task
   - You should see your Jira projects in the project selector

## Troubleshooting

### OAuth Authentication Fails

**Problem**: "Invalid redirect URI" error during OAuth flow

**Solution**:
- Verify that `OAUTH_REDIRECT_URI` in your backend environment exactly matches the callback URL in your Atlassian OAuth app
- Check for trailing slashes, protocol (http vs https), and port numbers
- For development, ensure you're using `http://localhost:5000` (not `https://`)

**Problem**: "Invalid client credentials" error

**Solution**:
- Verify `ATLASSIAN_CLIENT_ID` and `ATLASSIAN_CLIENT_SECRET` are correct
- Check for extra spaces or newlines in environment variables
- Ensure you copied the full client ID and secret from the Atlassian Developer Console

### Cannot List Projects

**Problem**: "Not authenticated" error when trying to list projects

**Solution**:
- Ensure you've completed the OAuth flow (clicked "Connect to Jira" and authorized)
- Check that your session is valid (try disconnecting and reconnecting)
- Verify OAuth tokens are stored in session (check backend logs)

**Problem**: "No accessible Jira resources found"

**Solution**:
- Ensure your Atlassian account has access to at least one Jira site
- Verify the OAuth app has the correct scopes (`read:jira-work`)
- Check that you authorized the correct Jira site during OAuth flow

### API Connection Issues

**Problem**: "Failed to create Jira issue" or API errors

**Solution**:
- Verify OAuth access token is valid (try reconnecting)
- Check that the OAuth app has the required scopes (`write:jira-work`)
- Ensure you have permission to create issues in the selected project
- Check network connectivity to Jira API

### Session Issues

**Problem**: OAuth connection is lost after restarting the application

**Solution**:
- This is expected behavior when using memory-based session storage
- Users need to reconnect after server restart
- For production, consider using Redis or database-backed session storage

**Problem**: "Session expired" errors

**Solution**:
- Sessions expire after 24 hours by default
- Users need to reconnect if session expires
- Check `SESSION_SECRET` is set correctly

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use `.env.example` files with placeholder values
   - Use secure secret management in production

2. **OAuth Credentials**
   - Rotate client secrets periodically
   - Use different OAuth apps for development and production
   - Limit OAuth app scopes to minimum required permissions

3. **Session Management**
   - Use strong, unique `SESSION_SECRET` values
   - Enable secure cookies in production (HTTPS only)
   - Set appropriate session expiration times

4. **Network Security**
   - Use HTTPS in production
   - Validate OAuth state parameter (CSRF protection is built-in)
   - Implement rate limiting for API endpoints

## Additional Resources

- [Atlassian OAuth 2.1 Documentation](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/)
- [Atlassian REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)

## Support

If you encounter issues not covered in this guide:

1. Check the application logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test OAuth flow manually using the Atlassian Developer Console
4. Review the [API Documentation](API_DOCUMENTATION.md) for endpoint details
5. Open an issue on the GitHub repository with:
   - Error messages from logs
   - Steps to reproduce
   - Your configuration (without sensitive values)
