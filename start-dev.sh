#!/bin/bash

# Task Generator - Development Environment Startup Script
# This script builds and starts the development environment with hot-reload

set -e

echo "🚀 Starting Task Generator Development Environment..."
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
        fi
        
        # Remove backup file created by sed on macOS
        rm -f "${env_file}.bak"
    fi
}

# Setup backend .env.development file
setup_env_file "backend/.env.development" "development"

# Setup frontend .env.development file
# #region agent log
LOG_FILE="/Users/amirhosseindashtizade/Projects/task-generator/.cursor/debug.log"
echo "{\"timestamp\":$(date +%s000),\"location\":\"start-dev.sh:52\",\"message\":\"Checking frontend .env.development\",\"data\":{\"file\":\"frontend/.env.development\",\"exists\":$([ -f "frontend/.env.development" ] && echo true || echo false)},\"sessionId\":\"debug-session\",\"runId\":\"pre-fix\",\"hypothesisId\":\"A,B\"}" >> "$LOG_FILE"
# #endregion
if [ ! -f "frontend/.env.development" ]; then
    # #region agent log
    echo "{\"timestamp\":$(date +%s000),\"location\":\"start-dev.sh:55\",\"message\":\"frontend .env.development not found\",\"data\":{\"action\":\"creating\"},\"sessionId\":\"debug-session\",\"runId\":\"pre-fix\",\"hypothesisId\":\"A,C\"}" >> "$LOG_FILE"
    # #endregion
    echo "📝 Creating frontend/.env.development..."
    mkdir -p frontend
    cat > frontend/.env.development << 'EOF'
# Frontend Development Environment Variables
# This file is used when running `npm run dev` or in development Docker containers

# Backend API URL for development
# Default: http://localhost:5000
VITE_API_URL=http://localhost:5000
EOF
    # #region agent log
    if [ -f "frontend/.env.development" ]; then
        echo "{\"timestamp\":$(date +%s000),\"location\":\"start-dev.sh:68\",\"message\":\"frontend .env.development created successfully\",\"data\":{\"fileSize\":$(stat -f%z "frontend/.env.development" 2>/dev/null || stat -c%s "frontend/.env.development" 2>/dev/null || echo 0)},\"sessionId\":\"debug-session\",\"runId\":\"pre-fix\",\"hypothesisId\":\"A\"}" >> "$LOG_FILE"
    else
        echo "{\"timestamp\":$(date +%s000),\"location\":\"start-dev.sh:70\",\"message\":\"ERROR: frontend .env.development creation failed\",\"data\":{},\"sessionId\":\"debug-session\",\"runId\":\"pre-fix\",\"hypothesisId\":\"A\"}" >> "$LOG_FILE"
    fi
    # #endregion
else
    # #region agent log
    echo "{\"timestamp\":$(date +%s000),\"location\":\"start-dev.sh:73\",\"message\":\"frontend .env.development already exists\",\"data\":{},\"sessionId\":\"debug-session\",\"runId\":\"pre-fix\",\"hypothesisId\":\"B\"}" >> "$LOG_FILE"
    # #endregion
    echo "✅ frontend/.env.development already exists"
fi

# Prompt for OpenAI API key if not already set
CURRENT_API_KEY=$(grep "^OPENAI_API_KEY=" backend/.env.development | cut -d '=' -f2- | tr -d '"' || echo "")
if [ -z "$CURRENT_API_KEY" ] || [ "$CURRENT_API_KEY" = "your_openai_api_key_here" ]; then
    echo ""
    echo "🔑 OpenAI API Configuration"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    read -p "Enter your OpenAI API Key: " OPENAI_API_KEY
    
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "❌ Error: OpenAI API Key is required"
        exit 1
    fi
    
    # Update the API key in .env.development
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i.bak "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_API_KEY|" backend/.env.development
        rm -f backend/.env.development.bak
    else
        # Linux
        sed -i "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_API_KEY|" backend/.env.development
    fi
else
    echo "✅ Using existing OpenAI API Key from backend/.env.development"
    OPENAI_API_KEY="$CURRENT_API_KEY"
fi

# Prompt for OpenAI model
CURRENT_MODEL=$(grep "^OPENAI_MODEL=" backend/.env.development | cut -d '=' -f2- | tr -d '"' || echo "gpt-4o-mini")
echo ""
read -p "Enter OpenAI Model [default: gpt-4o-mini]: " OPENAI_MODEL
OPENAI_MODEL=${OPENAI_MODEL:-gpt-4o-mini}

# Update the model in .env.development
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i.bak "s|^OPENAI_MODEL=.*|OPENAI_MODEL=$OPENAI_MODEL|" backend/.env.development
    rm -f backend/.env.development.bak
else
    # Linux
    sed -i "s|^OPENAI_MODEL=.*|OPENAI_MODEL=$OPENAI_MODEL|" backend/.env.development
fi

echo ""
echo "✅ Environment configuration complete!"
echo ""

# Check if port 5000 is available
BACKEND_PORT=5000
PORT_IN_USE=false

# Try multiple methods to check if port is in use
if command -v lsof &> /dev/null; then
    if lsof -i :$BACKEND_PORT &> /dev/null; then
        PORT_IN_USE=true
    fi
elif command -v nc &> /dev/null; then
    if nc -z localhost $BACKEND_PORT 2>/dev/null; then
        PORT_IN_USE=true
    fi
else
    # Fallback: try to connect to the port
    if (echo > /dev/tcp/localhost/$BACKEND_PORT) &>/dev/null 2>&1; then
        PORT_IN_USE=true
    fi
fi

if [ "$PORT_IN_USE" = true ]; then
    echo "⚠️  Port $BACKEND_PORT is already in use"
    
    # Check if it's a Docker container
    EXISTING_CONTAINER=$(docker ps --filter "publish=$BACKEND_PORT" --format "{{.Names}}" 2>/dev/null | head -1)
    if [ -n "$EXISTING_CONTAINER" ]; then
        echo "   Found Docker container using port: $EXISTING_CONTAINER"
        echo ""
        read -p "Stop the existing container and use port $BACKEND_PORT? [y/N]: " STOP_CONTAINER
        if [[ "$STOP_CONTAINER" =~ ^[Yy]$ ]]; then
            echo "🛑 Stopping container $EXISTING_CONTAINER..."
            docker stop "$EXISTING_CONTAINER" 2>/dev/null || true
            echo "✅ Container stopped"
            BACKEND_PORT=5000
        else
            BACKEND_PORT=5001
            echo "✅ Will use alternative port $BACKEND_PORT"
        fi
    else
        echo "   (Likely macOS AirPlay Receiver or another service)"
        echo ""
        read -p "Use alternative port 5001 instead? [Y/n]: " USE_ALT_PORT
        USE_ALT_PORT=${USE_ALT_PORT:-Y}
        
        if [[ "$USE_ALT_PORT" =~ ^[Yy]$ ]]; then
            BACKEND_PORT=5001
        else
            echo "❌ Cannot proceed with port $BACKEND_PORT in use."
            echo "   To disable AirPlay Receiver: System Settings > General > AirDrop & Handoff > AirPlay Receiver: Off"
            exit 1
        fi
    fi
    
    # If we're using an alternative port, update the configuration files
    if [ "$BACKEND_PORT" != "5000" ]; then
        echo "✅ Using port $BACKEND_PORT for backend"
        
        # Update docker-compose.dev.yml to use alternative port
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i.bak "s|\"5000:5000\"|\"${BACKEND_PORT}:5000\"|" docker-compose.dev.yml
            rm -f docker-compose.dev.yml.bak
        else
            sed -i "s|\"5000:5000\"|\"${BACKEND_PORT}:5000\"|" docker-compose.dev.yml
        fi
        
        # Update frontend .env.development to point to new backend port
        if [ -f "frontend/.env.development" ]; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i.bak "s|http://localhost:5000|http://localhost:${BACKEND_PORT}|" frontend/.env.development
                rm -f frontend/.env.development.bak
            else
                sed -i "s|http://localhost:5000|http://localhost:${BACKEND_PORT}|" frontend/.env.development
            fi
        fi
        
        echo "📝 Updated docker-compose.dev.yml and frontend/.env.development to use port $BACKEND_PORT"
        echo ""
    fi
fi

# Build and start services
echo "📦 Building Docker images..."
docker-compose -f docker-compose.dev.yml build

echo ""
echo "🔧 Starting services..."
echo "   Backend will be available at: http://localhost:$BACKEND_PORT"
echo "   Frontend will be available at: http://localhost:3000"
echo ""
docker-compose -f docker-compose.dev.yml up

# Note: Health checks will be performed manually or via docker-compose ps
# The services are running in foreground mode for development
