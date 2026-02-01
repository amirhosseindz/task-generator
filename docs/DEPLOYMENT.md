# Deployment Guide

Complete guide for deploying the Task Generator application to production.

## Production Docker Setup

The Makefile provides a comprehensive, automated setup for the production environment with interactive configuration and automated health verification.

### Quick Start

1. Ensure Docker and Docker Compose are installed and running

2. Start the production environment:
```bash
make start ENV=prod
```

The make command will guide you through the entire setup process interactively.

### Complete Capabilities

**Pre-flight Checks:**
- ✅ Verifies Docker and Docker Compose are installed and available
- ✅ Checks if Docker daemon is running
- ✅ Validates required files exist (e.g., `backend/.env.example`)

**Environment Configuration:**
- ✅ Automatically creates `backend/.env.production` from `.env.example` if missing
- ✅ Automatically creates `frontend/.env.production` with default values if missing
- ✅ Prompts for production frontend URL for CORS configuration (with default option)
- ✅ Prompts for OpenAI API key if not configured (saves securely to `backend/.env.production`)
- ✅ Prompts for OpenAI model selection (defaults to `gpt-4o-mini`)
- ✅ Handles existing configuration gracefully (uses existing values if already set)

**Port Configuration:**
- ✅ Creates `docker.env` from `docker.env.example` if missing
- ✅ Ports are configurable via `docker.env` file (see [CONFIGURATION.md](CONFIGURATION.md))
- ✅ Default ports: Backend 5000, Frontend 3000 (dev) / 80 (prod)

**Docker Operations:**
- ✅ Builds optimized production Docker images
- ✅ Starts services in detached mode (runs in background)
- ✅ Waits for services to initialize before health checks

**Health Verification:**
- ✅ Performs automatic health checks for backend service (up to 30 attempts, 2-second intervals)
- ✅ Performs automatic health checks for frontend service (up to 30 attempts, 2-second intervals)
- ✅ Displays detailed health check progress
- ✅ Shows service logs if health checks fail
- ✅ Exits with error code if services fail to become healthy

**Post-Deployment Information:**
- ✅ Displays service status table
- ✅ Shows access URLs for all services
- ✅ Provides helpful commands for log viewing and stopping

**Error Handling:**
- ✅ Graceful error messages with actionable guidance
- ✅ Automatic cleanup on failure
- ✅ Detailed logging for troubleshooting

### Production Make Commands

**View logs:**
```bash
make logs ENV=prod
# Or view logs for specific service:
make logs-backend ENV=prod
make logs-frontend ENV=prod
```

**Check service status:**
```bash
make status ENV=prod
```

**Stop services:**
```bash
make stop ENV=prod
```

**Restart services:**
```bash
make restart ENV=prod
```

**Build images without starting:**
```bash
make build ENV=prod
```

**Open a shell in a container:**
```bash
make shell-backend ENV=prod
make shell-frontend ENV=prod
```

**Clean up (stop and remove containers, networks, volumes):**
```bash
make clean ENV=prod
```

**Clean up all environments:**
```bash
make clean-all
```

**Check health:**
```bash
curl http://localhost:5000/api/tasks/health
```

**Access the application:**
- Frontend: `http://localhost:80` (or port configured in `docker.env` via `FRONTEND_PORT_PROD`)
- Backend API: `http://localhost:5000` (or port configured in `docker.env` via `BACKEND_PORT`)
- Health Check: `http://localhost:5000/api/tasks/health` (or port configured in `docker.env`)

**Note:** Ports are configurable via the `docker.env` file. See [CONFIGURATION.md](CONFIGURATION.md) for details.

### Manual Setup (Alternative)

If you prefer to set up manually without using make, ensure environment files are configured:
- `backend/.env.production` (or `backend/config/prod.env`)
- `frontend/.env.production`
- `docker.env` (for port configuration)

Then run:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

**Note:** Manual setup requires you to:
- Create and configure all environment files yourself
- Handle port conflicts manually
- Perform health checks manually
- Monitor service startup yourself

The make commands automate all of these steps for a smoother deployment experience.

## CI/CD Pipeline

The project includes GitHub Actions workflows for automated CI/CD:

### CI Workflow (`.github/workflows/ci.yml`)

- Triggers on push to `main`/`develop` branches and pull requests
- Runs linting and tests for both backend and frontend
- Builds Docker images
- Runs integration tests

### CD Development (`.github/workflows/cd-dev.yml`)

- Triggers on push to `develop` branch
- Builds and pushes images to GitHub Container Registry with `dev` tag
- Deploys to development environment

### CD Production (`.github/workflows/cd-prod.yml`)

- Triggers on push to `main` branch or manual dispatch
- Builds and pushes images with `latest` and version tags
- Deploys to production environment
- Runs post-deployment health checks

**Required GitHub Secrets:**
- `OPENAI_API_KEY`: OpenAI API key
- `GHCR_TOKEN`: GitHub Container Registry authentication token
- `DEPLOY_DEV_HOST`: Development server host (optional)
- `DEPLOY_PROD_HOST`: Production server host (optional)
