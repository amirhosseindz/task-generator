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

# Build and start services
echo "📦 Building Docker images..."
docker-compose -f docker-compose.dev.yml build

echo ""
echo "🔧 Starting services..."
docker-compose -f docker-compose.dev.yml up

# Note: Health checks will be performed manually or via docker-compose ps
# The services are running in foreground mode for development
