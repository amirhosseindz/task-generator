#!/bin/bash

# Task Generator - Production Environment Startup Script
# This script builds and starts the production environment in detached mode with health checks

set -e

echo "🚀 Starting Task Generator Production Environment..."
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
            sed -i.bak 's/^NODE_ENV=.*/NODE_ENV=development/' "$env_file"
            sed -i.bak 's|^CORS_ORIGIN=.*|CORS_ORIGIN=http://localhost:3000|' "$env_file"
        elif [ "$env_type" = "production" ]; then
            sed -i.bak 's/^NODE_ENV=.*/NODE_ENV=production/' "$env_file"
            # Prompt for production CORS origin
            echo ""
            read -p "Enter production frontend URL for CORS [default: https://your-frontend-domain.com]: " PROD_CORS_ORIGIN
            PROD_CORS_ORIGIN=${PROD_CORS_ORIGIN:-https://your-frontend-domain.com}
            sed -i.bak "s|^CORS_ORIGIN=.*|CORS_ORIGIN=$PROD_CORS_ORIGIN|" "$env_file"
        fi
        
        # Remove backup file created by sed on macOS
        rm -f "${env_file}.bak"
    fi
}

# Setup backend .env.production file
setup_env_file "backend/.env.production" "production"

# Prompt for OpenAI API key if not already set
CURRENT_API_KEY=$(grep "^OPENAI_API_KEY=" backend/.env.production | cut -d '=' -f2- | tr -d '"' || echo "")
if [ -z "$CURRENT_API_KEY" ] || [ "$CURRENT_API_KEY" = "your_openai_api_key_here" ] || [ "$CURRENT_API_KEY" = "\${OPENAI_API_KEY}" ]; then
    echo ""
    echo "🔑 OpenAI API Configuration"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    read -p "Enter your OpenAI API Key: " OPENAI_API_KEY
    
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "❌ Error: OpenAI API Key is required"
        exit 1
    fi
    
    # Update the API key in .env.production
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i.bak "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_API_KEY|" backend/.env.production
        rm -f backend/.env.production.bak
    else
        # Linux
        sed -i "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_API_KEY|" backend/.env.production
    fi
else
    echo "✅ Using existing OpenAI API Key from backend/.env.production"
    OPENAI_API_KEY="$CURRENT_API_KEY"
fi

# Prompt for OpenAI model
CURRENT_MODEL=$(grep "^OPENAI_MODEL=" backend/.env.production | cut -d '=' -f2- | tr -d '"' || echo "gpt-4o-mini")
echo ""
read -p "Enter OpenAI Model [default: gpt-4o-mini]: " OPENAI_MODEL
OPENAI_MODEL=${OPENAI_MODEL:-gpt-4o-mini}

# Update the model in .env.production
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i.bak "s|^OPENAI_MODEL=.*|OPENAI_MODEL=$OPENAI_MODEL|" backend/.env.production
    rm -f backend/.env.production.bak
else
    # Linux
    sed -i "s|^OPENAI_MODEL=.*|OPENAI_MODEL=$OPENAI_MODEL|" backend/.env.production
fi

echo ""
echo "✅ Environment configuration complete!"
echo ""

# Build and start services in detached mode
echo "📦 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo ""
echo "🔧 Starting services in detached mode..."
docker-compose -f docker-compose.prod.yml up -d

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
if check_health "Backend" "http://localhost:5000/api/tasks/health"; then
    echo ""
else
    echo "❌ Backend health check failed"
    echo "📋 Showing backend logs:"
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# Check frontend health
if check_health "Frontend" "http://localhost:80/"; then
    echo ""
else
    echo "❌ Frontend health check failed"
    echo "📋 Showing frontend logs:"
    docker-compose -f docker-compose.prod.yml logs frontend
    exit 1
fi

echo ""
echo "✅ All services are healthy and running!"
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🌐 Services available at:"
echo "   Backend:  http://localhost:5000"
echo "   Frontend: http://localhost:80"
echo ""
echo "📋 To view logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "🛑 To stop: docker-compose -f docker-compose.prod.yml down"
