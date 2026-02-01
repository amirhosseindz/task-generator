# Configuration Guide

Complete guide for configuring the Task Generator application, including environment variables and port settings.

## Docker Environment Variables

Port configuration for Docker Compose is managed through the `docker.env` file. This file is automatically created from `docker.env.example` when you run `make start` for the first time.

**Create `docker.env` file:**
```bash
cp docker.env.example docker.env
```

**Configure ports in `docker.env`:**
```env
# Backend port mapping (host:container)
# Format: "HOST_PORT:5000" where 5000 is the container's internal port
# Default: 5000
BACKEND_PORT=5000

# Frontend port mapping for development (host:container)
# Format: "HOST_PORT:3000" where 3000 is the container's internal port
# Default: 3000
FRONTEND_PORT=3000

# Frontend port mapping for production (host:container)
# Format: "HOST_PORT:80" where 80 is the container's internal port
# Default: 80
FRONTEND_PORT_PROD=80
```

**Example - Using alternative ports:**
If port 5000 is already in use (e.g., macOS AirPlay Receiver), you can configure alternative ports:

```env
BACKEND_PORT=5001
FRONTEND_PORT=3001
FRONTEND_PORT_PROD=8080
```

**Important Notes:**
- The `docker.env` file is git-ignored and will not be committed to version control
- After changing ports in `docker.env`, restart services: `make restart`
- If you change the backend port, update `frontend/.env.development` or `frontend/.env.production` to match the new backend URL
- The make commands automatically load `docker.env` when starting services

## Backend Environment Variables

The make commands automatically create environment files from `.env.example`, but you can also create them manually.

### Development Environment

**Create `backend/.env.development`:**
```bash
cp backend/.env.example backend/.env.development
```

**Configuration:**
```env
# Node Environment
NODE_ENV=development

# Server Configuration
PORT=5000

# CORS Configuration
# Development: http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# OpenAI Configuration
# Required: Your OpenAI API key
OPENAI_API_KEY=sk-your-api-key-here

# Optional: OpenAI model to use (default: gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
```

### Production Environment

**Create `backend/.env.production`:**
```bash
cp backend/.env.example backend/.env.production
```

**Configuration:**
```env
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=5000

# CORS Configuration
# Production: https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com

# OpenAI Configuration
# Required: Your OpenAI API key
OPENAI_API_KEY=sk-your-api-key-here

# Optional: OpenAI model to use (default: gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
```

**Note:** The make commands will prompt you for the OpenAI API key and model if they're not already configured, making the setup process interactive and user-friendly.

## Frontend Environment Variables

### Development Environment

**Create `frontend/.env.development`:**
```bash
cp frontend/.env.example frontend/.env.development
```

**Configuration:**
```env
# Backend API URL for development
VITE_API_URL=http://localhost:5000
```

**Note:** If you change the backend port in `docker.env`, you should update `VITE_API_URL` in this file to match the new backend port.

### Production Environment

**Create `frontend/.env.production`:**
```bash
cp frontend/.env.example frontend/.env.production
```

**Configuration:**
```env
# Backend API URL for production
VITE_API_URL=https://api.your-domain.com
```

**Note:** If you change the backend port in `docker.env`, you should update `VITE_API_URL` in this file to match the new backend port.

## Jira Integration Environment Variables

For Jira integration functionality, additional environment variables need to be configured in your backend environment files (`backend/.env.development` or `backend/.env.production`):

```env
# Atlassian OAuth Configuration (required for Jira export)
ATLASSIAN_CLIENT_ID=your-client-id-here
ATLASSIAN_CLIENT_SECRET=your-client-secret-here

# OAuth Redirect URI (must match your OAuth app configuration)
OAUTH_REDIRECT_URI=http://localhost:5000/api/jira/oauth/callback

# Session Secret (required for secure session management)
SESSION_SECRET=your-session-secret-here

# Credential Encryption Key (optional, falls back to SESSION_SECRET)
CREDENTIAL_ENCRYPTION_KEY=your-encryption-key-here
```

**Important Notes:**
- `SESSION_SECRET` and `CREDENTIAL_ENCRYPTION_KEY` should be strong random strings
- Generate secrets using: `openssl rand -hex 32`
- Use different secrets for development and production environments
- The `OAUTH_REDIRECT_URI` must exactly match the redirect URI configured in your Atlassian OAuth app

For detailed Jira setup instructions, see [JIRA_SETUP.md](JIRA_SETUP.md).
