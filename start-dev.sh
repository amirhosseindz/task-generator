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

# Build and start services
echo "📦 Building Docker images..."
docker-compose -f docker-compose.dev.yml build

echo ""
echo "🔧 Starting services..."
docker-compose -f docker-compose.dev.yml up

# Note: Health checks will be performed manually or via docker-compose ps
# The services are running in foreground mode for development
