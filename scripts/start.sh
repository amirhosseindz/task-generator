#!/bin/bash

# Task Generator - Unified Startup Script
# This script handles both development and production environment startup
# Usage: ./scripts/start.sh [dev|prod]

set -e

# Get environment from argument or default to dev
ENV=${1:-dev}

# Validate environment
if [[ ! "$ENV" =~ ^(dev|prod)$ ]]; then
    echo "❌ Error: Invalid environment. Use 'dev' or 'prod'"
    exit 1
fi

# Set environment-specific variables
if [ "$ENV" = "dev" ]; then
    ENV_TYPE="development"
    COMPOSE_FILE="docker-compose.dev.yml"
    BACKEND_ENV_FILE="backend/.env.development"
    FRONTEND_ENV_FILE="frontend/.env.development"
    DETACHED_MODE=""
    HEALTH_CHECK=false
else
    ENV_TYPE="production"
    COMPOSE_FILE="docker-compose.prod.yml"
    BACKEND_ENV_FILE="backend/.env.production"
    FRONTEND_ENV_FILE="frontend/.env.production"
    DETACHED_MODE="-d"
    HEALTH_CHECK=true
fi

echo "🚀 Starting Task Generator ($ENV_TYPE environment)..."
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose is not installed"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Error: Docker is not running"
    exit 1
fi

# Function to setup environment file
setup_env_file() {
    local env_file=$1
    local env_type=$2
    
    if [ ! -f "$env_file" ]; then
        echo "📝 Creating $env_file from .env.example..."
        if [ ! -f "backend/.env.example" ]; then
            echo "❌ Error: backend/.env.example not found"
            exit 1
        fi
        
        # Copy .env.example to the target file
        cp backend/.env.example "$env_file"
        
        # Update NODE_ENV based on environment type
        if [ "$env_type" = "development" ]; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i.bak 's/^NODE_ENV=.*/NODE_ENV=development/' "$env_file"
                sed -i.bak 's|^CORS_ORIGIN=.*|CORS_ORIGIN=http://localhost:3000|' "$env_file"
                rm -f "${env_file}.bak"
            else
                sed -i 's/^NODE_ENV=.*/NODE_ENV=development/' "$env_file"
                sed -i 's|^CORS_ORIGIN=.*|CORS_ORIGIN=http://localhost:3000|' "$env_file"
            fi
        elif [ "$env_type" = "production" ]; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i.bak 's/^NODE_ENV=.*/NODE_ENV=production/' "$env_file"
                rm -f "${env_file}.bak"
            else
                sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' "$env_file"
            fi
            # Check if CORS origin is already set (not a placeholder)
            CURRENT_CORS=$(grep "^CORS_ORIGIN=" "$env_file" | cut -d '=' -f2- | tr -d '"' || echo "")
            if [ -z "$CURRENT_CORS" ] || [ "$CURRENT_CORS" = "https://your-frontend-domain.com" ]; then
                # Prompt for production CORS origin
                echo ""
                read -p "Enter production frontend URL for CORS [default: https://your-frontend-domain.com]: " PROD_CORS_ORIGIN
                PROD_CORS_ORIGIN=${PROD_CORS_ORIGIN:-https://your-frontend-domain.com}
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    sed -i.bak "s|^CORS_ORIGIN=.*|CORS_ORIGIN=$PROD_CORS_ORIGIN|" "$env_file"
                    rm -f "${env_file}.bak"
                else
                    sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=$PROD_CORS_ORIGIN|" "$env_file"
                fi
                echo "✅ CORS origin configured: $PROD_CORS_ORIGIN"
            else
                echo "✅ CORS origin already configured in $env_file: $CURRENT_CORS (skipping prompt)"
            fi
        fi
    fi
}

# Setup backend environment file
setup_env_file "$BACKEND_ENV_FILE" "$ENV_TYPE"

# Setup frontend environment file
if [ ! -f "$FRONTEND_ENV_FILE" ]; then
    echo "📝 Creating $FRONTEND_ENV_FILE..."
    mkdir -p frontend
    if [ "$ENV" = "dev" ]; then
        cat > "$FRONTEND_ENV_FILE" << 'EOF'
# Frontend Development Environment Variables
# This file is used when running `npm run dev` or in development Docker containers

# Backend API URL for development
# Default: http://localhost:5000
VITE_API_URL=http://localhost:5000
EOF
    else
        cat > "$FRONTEND_ENV_FILE" << 'EOF'
# Frontend Production Environment Variables
# This file is used when building the production frontend

# Backend API URL for production
# Update this with your production backend URL
VITE_API_URL=http://localhost:5000
EOF
        echo "   ⚠️  Please update VITE_API_URL with your production backend URL"
        echo ""
    fi
else
    echo "✅ $FRONTEND_ENV_FILE already exists"
fi

# Check and prompt for OpenAI API key if not already set
CURRENT_API_KEY=$(grep "^OPENAI_API_KEY=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' || echo "")
if [ -z "$CURRENT_API_KEY" ] || [ "$CURRENT_API_KEY" = "your_openai_api_key_here" ] || [ "$CURRENT_API_KEY" = "\${OPENAI_API_KEY}" ]; then
    echo ""
    echo "🔑 OpenAI API Configuration"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    read -p "Enter your OpenAI API Key: " OPENAI_API_KEY
    
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "❌ Error: OpenAI API Key is required"
        exit 1
    fi
    
    # Update the API key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i.bak "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_API_KEY|" "$BACKEND_ENV_FILE"
        rm -f "${BACKEND_ENV_FILE}.bak"
    else
        sed -i "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_API_KEY|" "$BACKEND_ENV_FILE"
    fi
    echo "✅ OpenAI API Key configured"
else
    echo ""
    echo "✅ OpenAI API Key already configured in $BACKEND_ENV_FILE (skipping prompt)"
    OPENAI_API_KEY="$CURRENT_API_KEY"
fi

# Check and prompt for OpenAI model if not already set
CURRENT_MODEL=$(grep "^OPENAI_MODEL=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' || echo "")
if [ -z "$CURRENT_MODEL" ]; then
    echo ""
    read -p "Enter OpenAI Model [default: gpt-4o-mini]: " OPENAI_MODEL
    OPENAI_MODEL=${OPENAI_MODEL:-gpt-4o-mini}
    
    # Update the model
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i.bak "s|^OPENAI_MODEL=.*|OPENAI_MODEL=$OPENAI_MODEL|" "$BACKEND_ENV_FILE"
        rm -f "${BACKEND_ENV_FILE}.bak"
    else
        sed -i "s|^OPENAI_MODEL=.*|OPENAI_MODEL=$OPENAI_MODEL|" "$BACKEND_ENV_FILE"
    fi
    echo "✅ OpenAI Model configured: $OPENAI_MODEL"
else
    echo "✅ OpenAI Model already configured in $BACKEND_ENV_FILE: $CURRENT_MODEL (skipping prompt)"
fi

# Helper function to set or update an environment variable in the env file
# Usage: set_env_var "VAR_NAME" "value" "$BACKEND_ENV_FILE"
set_env_var() {
    local var_name=$1
    local var_value=$2
    local env_file=$3
    
    # Check if variable exists in file
    if grep -q "^${var_name}=" "$env_file" 2>/dev/null; then
        # Variable exists, replace it
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i.bak "s|^${var_name}=.*|${var_name}=${var_value}|" "$env_file"
            rm -f "${env_file}.bak"
        else
            sed -i "s|^${var_name}=.*|${var_name}=${var_value}|" "$env_file"
        fi
    else
        # Variable doesn't exist, append it
        echo "${var_name}=${var_value}" >> "$env_file"
    fi
}

# Check and prompt for Jira OAuth configuration if not already set
# Note: All Jira environment variables will be written to $BACKEND_ENV_FILE
# which is set based on the environment (backend/.env.development for dev, backend/.env.production for prod)
echo ""
echo "🔐 Jira OAuth Configuration (optional - skip if not using Jira integration)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Configuring: $BACKEND_ENV_FILE"

# Check ATLASSIAN_CLIENT_ID
CURRENT_CLIENT_ID=$(grep "^ATLASSIAN_CLIENT_ID=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' || echo "")
if [ -z "$CURRENT_CLIENT_ID" ] || [ "$CURRENT_CLIENT_ID" = "your-atlassian-client-id" ]; then
    read -p "Enter Atlassian Client ID (or press Enter to skip): " ATLASSIAN_CLIENT_ID
    if [ -n "$ATLASSIAN_CLIENT_ID" ]; then
        set_env_var "ATLASSIAN_CLIENT_ID" "$ATLASSIAN_CLIENT_ID" "$BACKEND_ENV_FILE"
        echo "✅ Atlassian Client ID configured"
    fi
else
    echo "✅ Atlassian Client ID already configured (skipping prompt)"
fi

# Check ATLASSIAN_CLIENT_SECRET
CURRENT_CLIENT_SECRET=$(grep "^ATLASSIAN_CLIENT_SECRET=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' || echo "")
if [ -z "$CURRENT_CLIENT_SECRET" ] || [ "$CURRENT_CLIENT_SECRET" = "your-atlassian-client-secret" ]; then
    read -p "Enter Atlassian Client Secret (or press Enter to skip): " ATLASSIAN_CLIENT_SECRET
    if [ -n "$ATLASSIAN_CLIENT_SECRET" ]; then
        set_env_var "ATLASSIAN_CLIENT_SECRET" "$ATLASSIAN_CLIENT_SECRET" "$BACKEND_ENV_FILE"
        echo "✅ Atlassian Client Secret configured"
    fi
else
    echo "✅ Atlassian Client Secret already configured (skipping prompt)"
fi

# Check OAUTH_REDIRECT_URI
CURRENT_REDIRECT_URI=$(grep "^OAUTH_REDIRECT_URI=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' || echo "")
if [ -z "$CURRENT_REDIRECT_URI" ] || [ "$CURRENT_REDIRECT_URI" = "http://localhost:5000/api/jira/oauth/callback" ]; then
    if [ "$ENV" = "prod" ]; then
        read -p "Enter OAuth Redirect URI [default: http://localhost:5000/api/jira/oauth/callback]: " OAUTH_REDIRECT_URI
        OAUTH_REDIRECT_URI=${OAUTH_REDIRECT_URI:-http://localhost:5000/api/jira/oauth/callback}
        set_env_var "OAUTH_REDIRECT_URI" "$OAUTH_REDIRECT_URI" "$BACKEND_ENV_FILE"
        echo "✅ OAuth Redirect URI configured: $OAUTH_REDIRECT_URI"
    else
        # For development, set default value if not present
        if [ -z "$CURRENT_REDIRECT_URI" ]; then
            set_env_var "OAUTH_REDIRECT_URI" "http://localhost:5000/api/jira/oauth/callback" "$BACKEND_ENV_FILE"
        fi
        echo "✅ OAuth Redirect URI using default for development (skipping prompt)"
    fi
else
    echo "✅ OAuth Redirect URI already configured: $CURRENT_REDIRECT_URI (skipping prompt)"
fi

# Check SESSION_SECRET
CURRENT_SESSION_SECRET=$(grep "^SESSION_SECRET=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' || echo "")
if [ -z "$CURRENT_SESSION_SECRET" ] || [ "$CURRENT_SESSION_SECRET" = "your-session-secret-key-change-in-production" ]; then
    echo ""
    read -p "Enter Session Secret (or press Enter to generate one): " SESSION_SECRET
    if [ -z "$SESSION_SECRET" ]; then
        # Generate a random session secret
        if command -v openssl &> /dev/null; then
            SESSION_SECRET=$(openssl rand -hex 32)
        elif command -v node &> /dev/null; then
            SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        else
            # Fallback to a simple random string
            SESSION_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
        fi
        echo "   Generated Session Secret"
    fi
    set_env_var "SESSION_SECRET" "$SESSION_SECRET" "$BACKEND_ENV_FILE"
    echo "✅ Session Secret configured"
else
    echo "✅ Session Secret already configured (skipping prompt)"
fi

# Check CREDENTIAL_ENCRYPTION_KEY
CURRENT_ENCRYPTION_KEY=$(grep "^CREDENTIAL_ENCRYPTION_KEY=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' || echo "")
if [ -z "$CURRENT_ENCRYPTION_KEY" ] || [ "$CURRENT_ENCRYPTION_KEY" = "your-encryption-key-change-in-production" ]; then
    read -p "Enter Credential Encryption Key (or press Enter to use Session Secret): " CREDENTIAL_ENCRYPTION_KEY
    if [ -z "$CREDENTIAL_ENCRYPTION_KEY" ]; then
        # Get SESSION_SECRET from file (it was just set or already exists)
        CURRENT_SESSION_SECRET=$(grep "^SESSION_SECRET=" "$BACKEND_ENV_FILE" | cut -d '=' -f2- | tr -d '"' || echo "")
        if [ -n "$CURRENT_SESSION_SECRET" ] && [ "$CURRENT_SESSION_SECRET" != "your-session-secret-key-change-in-production" ]; then
            CREDENTIAL_ENCRYPTION_KEY="$CURRENT_SESSION_SECRET"
            echo "   Using Session Secret for Credential Encryption Key"
        else
            # Generate a new encryption key
            if command -v openssl &> /dev/null; then
                CREDENTIAL_ENCRYPTION_KEY=$(openssl rand -hex 32)
            elif command -v node &> /dev/null; then
                CREDENTIAL_ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
            else
                CREDENTIAL_ENCRYPTION_KEY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
            fi
            echo "   Generated Credential Encryption Key"
        fi
    fi
    set_env_var "CREDENTIAL_ENCRYPTION_KEY" "$CREDENTIAL_ENCRYPTION_KEY" "$BACKEND_ENV_FILE"
    echo "✅ Credential Encryption Key configured"
else
    echo "✅ Credential Encryption Key already configured (skipping prompt)"
fi

echo ""
echo "✅ Environment configuration complete!"
echo ""

# Setup docker.env file if it doesn't exist
if [ ! -f "docker.env" ]; then
    echo "📝 Creating docker.env from docker.env.example..."
    if [ -f "docker.env.example" ]; then
        cp docker.env.example docker.env
        echo "✅ Created docker.env (you can customize BACKEND_PORT and FRONTEND_PORT if needed)"
    else
        echo "⚠️  docker.env.example not found, creating basic docker.env..."
        cat > docker.env << 'EOF'
# Docker Compose Environment Variables
BACKEND_PORT=5000
FRONTEND_PORT=3000
FRONTEND_PORT_PROD=80
EOF
        echo "✅ Created docker.env with default port 5000"
    fi
    echo ""
else
    echo "✅ docker.env already exists"
    echo ""
fi

# Load docker.env file to make BACKEND_PORT available to docker-compose
if [ -f "docker.env" ]; then
    set -a  # Automatically export all variables
    source docker.env
    set +a  # Turn off automatic export
fi

# Check if docker-compose.override.yml exists (user can manually create it for customizations)
OVERRIDE_FILE="docker-compose.override.yml"

# Build and start services
# Include override file if it exists (user can manually create it for customizations)
echo "📦 Building Docker images..."
if [ -f "$OVERRIDE_FILE" ]; then
    echo "   ✅ Using override file: $OVERRIDE_FILE"
    docker-compose -f "$COMPOSE_FILE" -f "$OVERRIDE_FILE" build
else
    docker-compose -f "$COMPOSE_FILE" build
fi

echo ""
if [ "$ENV" = "dev" ]; then
    echo "🔧 Starting services..."
    BACKEND_PORT_DISPLAY=${BACKEND_PORT:-5000}
    FRONTEND_PORT_DISPLAY=${FRONTEND_PORT:-3000}
    echo "   Backend will be available at: http://localhost:$BACKEND_PORT_DISPLAY"
    echo "   Frontend will be available at: http://localhost:$FRONTEND_PORT_DISPLAY"
    echo ""
    if [ -f "$OVERRIDE_FILE" ]; then
        echo "   ✅ Starting with override file: $OVERRIDE_FILE"
        docker-compose -f "$COMPOSE_FILE" -f "$OVERRIDE_FILE" up
    else
        docker-compose -f "$COMPOSE_FILE" up
    fi
else
    echo "🔧 Starting services in detached mode..."
    # ALWAYS include override file if it exists
    if [ -f "$OVERRIDE_FILE" ]; then
        echo "   ✅ Starting with override file: $OVERRIDE_FILE"
        docker-compose -f "$COMPOSE_FILE" -f "$OVERRIDE_FILE" up $DETACHED_MODE
    else
        echo "   ℹ️  Starting without override file (using default port 5000)"
        docker-compose -f "$COMPOSE_FILE" up $DETACHED_MODE
    fi
    
    echo ""
    echo "⏳ Waiting for services to be healthy..."
    sleep 5
    
    # Health check function
    check_health() {
        local service=$1
        local url=$2
        local max_attempts=30
        local attempt=1
        
        echo "🔍 Checking health of $service..."
        
        while [ $attempt -le $max_attempts ]; do
            if curl -f -s "$url" > /dev/null 2>&1; then
                echo "✅ $service is healthy!"
                return 0
            fi
            
            echo "   Attempt $attempt/$max_attempts - Waiting for $service..."
            sleep 2
            attempt=$((attempt + 1))
        done
        
        echo "❌ $service health check failed after $max_attempts attempts"
        return 1
    }
    
    # Check backend health
    BACKEND_PORT_HEALTH=${BACKEND_PORT:-5000}
    if check_health "Backend" "http://localhost:$BACKEND_PORT_HEALTH/api/tasks/health"; then
        echo ""
    else
        echo "❌ Backend health check failed"
        echo "📋 Showing backend logs:"
        if [ -f "$OVERRIDE_FILE" ]; then
            docker-compose -f "$COMPOSE_FILE" -f "$OVERRIDE_FILE" logs backend
        else
            docker-compose -f "$COMPOSE_FILE" logs backend
        fi
        exit 1
    fi
    
    # Check frontend health
    FRONTEND_PORT_HEALTH=${FRONTEND_PORT_PROD:-80}
    if check_health "Frontend" "http://localhost:$FRONTEND_PORT_HEALTH/"; then
        echo ""
    else
        echo "❌ Frontend health check failed"
        echo "📋 Showing frontend logs:"
        if [ -f "$OVERRIDE_FILE" ]; then
            docker-compose -f "$COMPOSE_FILE" -f "$OVERRIDE_FILE" logs frontend
        else
            docker-compose -f "$COMPOSE_FILE" logs frontend
        fi
        exit 1
    fi
    
    echo ""
    echo "✅ All services are healthy and running!"
    echo ""
    echo "📊 Service Status:"
    if [ -f "$OVERRIDE_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" -f "$OVERRIDE_FILE" ps
    else
        docker-compose -f "$COMPOSE_FILE" ps
    fi
    
    echo ""
    echo "🌐 Services available at:"
    BACKEND_PORT_DISPLAY=${BACKEND_PORT:-5000}
    echo "   Backend:  http://localhost:$BACKEND_PORT_DISPLAY"
    echo "   Frontend: http://localhost:80"
    echo ""
    if [ -f "$OVERRIDE_FILE" ]; then
        echo "📋 To view logs: docker-compose -f $COMPOSE_FILE -f $OVERRIDE_FILE logs -f"
        echo "🛑 To stop: docker-compose -f $COMPOSE_FILE -f $OVERRIDE_FILE down"
    else
        echo "📋 To view logs: docker-compose -f $COMPOSE_FILE logs -f"
        echo "🛑 To stop: docker-compose -f $COMPOSE_FILE down"
    fi
fi
