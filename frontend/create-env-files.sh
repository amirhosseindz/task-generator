#!/bin/bash

# Script to create environment files for frontend

# Create .env.development
cat > .env.development << 'EOF'
# Frontend Development Environment Variables
# This file is used when running `npm run dev` or in development Docker containers

# Backend API URL for development
# Default: http://localhost:5000
VITE_API_URL=http://localhost:5000
EOF

# Create .env.production
cat > .env.production << 'EOF'
# Frontend Production Environment Variables
# This file is used when building for production or in production Docker containers

# Backend API URL for production
# Replace with your production backend URL
# Example: https://api.yourdomain.com
VITE_API_URL=
EOF

# Create .env.example (if it doesn't exist)
if [ ! -f .env.example ]; then
  cat > .env.example << 'EOF'
# Frontend Environment Variables Example
# Copy this file to .env.development or .env.production and fill in the values

# Backend API URL
# Development: http://localhost:5000
# Production: https://api.yourdomain.com
VITE_API_URL=http://localhost:5000
EOF
fi

echo "Environment files created successfully!"
