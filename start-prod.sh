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
