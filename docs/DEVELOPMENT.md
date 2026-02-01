# Development Guide

Complete guide for developing and working with the Task Generator application.

## Makefile Commands Reference

The project uses a Makefile to provide a unified interface for all operations. All commands support an optional `ENV` parameter to specify the environment (`dev` or `prod`), with `dev` being the default.

### Basic Commands

#### `make help`
Display help message with all available commands and usage examples.

```bash
make help
```

#### `make start [ENV=dev|prod]`
Start the application. Defaults to development environment.

**Development:**
```bash
make start          # Start development environment
make start ENV=dev  # Explicitly start development environment
```

**Production:**
```bash
make start ENV=prod # Start production environment
```

**What it does:**
- Checks Docker and Docker Compose availability
- Creates environment files from `.env.example` if missing
- Creates `docker.env` from `docker.env.example` for port configuration if missing
- Prompts for OpenAI API key and model if not configured
- Builds Docker images
- Starts services (foreground for dev, detached for prod)
- Performs health checks for production environment

#### `make stop [ENV=dev|prod]`
Stop the application. Defaults to development environment.

```bash
make stop           # Stop development environment
make stop ENV=prod  # Stop production environment
```

#### `make restart [ENV=dev|prod]`
Restart the application (stop then start). Defaults to development environment.

```bash
make restart         # Restart development environment
make restart ENV=prod # Restart production environment
```

### Monitoring Commands

#### `make status [ENV=dev|prod]`
Show status of running containers. Defaults to development environment.

```bash
make status          # Show development environment status
make status ENV=prod # Show production environment status
```

#### `make logs [ENV=dev|prod]`
Show logs from all running containers (follows logs in real-time). Defaults to development environment.

```bash
make logs            # Show all logs for development
make logs ENV=prod   # Show all logs for production
```

Press `Ctrl+C` to exit log viewing.

#### `make logs-backend [ENV=dev|prod]`
Show logs from backend container only. Defaults to development environment.

```bash
make logs-backend         # Backend logs for development
make logs-backend ENV=prod # Backend logs for production
```

#### `make logs-frontend [ENV=dev|prod]`
Show logs from frontend container only. Defaults to development environment.

```bash
make logs-frontend         # Frontend logs for development
make logs-frontend ENV=prod # Frontend logs for production
```

### Build Commands

#### `make build [ENV=dev|prod]`
Build Docker images without starting containers. Defaults to development environment.

```bash
make build          # Build development images
make build ENV=prod # Build production images
```

### Utility Commands

#### `make shell-backend [ENV=dev|prod]`
Open an interactive shell in the backend container. Defaults to development environment.

```bash
make shell-backend         # Shell in development backend
make shell-backend ENV=prod # Shell in production backend
```

#### `make shell-frontend [ENV=dev|prod]`
Open an interactive shell in the frontend container. Defaults to development environment.

```bash
make shell-frontend         # Shell in development frontend
make shell-frontend ENV=prod # Shell in production frontend
```

### Cleanup Commands

#### `make clean [ENV=dev|prod]`
Stop and remove containers, networks, and volumes for the specified environment. Defaults to development environment.

```bash
make clean          # Clean up development environment
make clean ENV=prod # Clean up production environment
```

**Warning:** This removes all volumes, which may delete persistent data.

#### `make clean-all`
Remove all containers, networks, volumes, and images for both development and production environments.

```bash
make clean-all
```

**Warning:** This removes all resources for both environments.

### Command Examples

**Development workflow:**
```bash
# Start development environment
make start

# View logs in another terminal
make logs

# Check status
make status

# Restart after configuration changes
make restart

# Stop when done
make stop
```

**Production workflow:**
```bash
# Start production environment
make start ENV=prod

# Monitor logs
make logs ENV=prod

# Check service health
make status ENV=prod

# View only backend logs if issues occur
make logs-backend ENV=prod

# Stop production
make stop ENV=prod
```

**Debugging:**
```bash
# Access backend container shell
make shell-backend

# Access frontend container shell
make shell-frontend

# View specific service logs
make logs-backend
make logs-frontend
```

## Local Development (Without Docker)

### Backend

1. Navigate to `backend/` directory
2. Ensure `.env` file is configured with your OpenAI API key
3. Start the development server:
```bash
npm run dev
```

The backend will be available at `http://localhost:5000`

### Frontend

1. Navigate to `frontend/` directory
2. Ensure `.env.development` is configured with the backend API URL
3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Testing

### Backend Tests

Run backend tests:
```bash
cd backend
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Frontend Tests

Run frontend tests:
```bash
cd frontend
npm test
```

### Integration Tests

With the development environment running via Docker Compose, you can run the backend and frontend test suites:
```bash
docker-compose -f docker-compose.dev.yml up -d
cd backend && npm test
cd frontend && npm test
docker-compose -f docker-compose.dev.yml down
```
