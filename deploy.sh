#!/bin/bash

# Exit on any error
set -e

echo "======================================"
echo " Deploying Textile Maintenance System"
echo "======================================"

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Determine compose command
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

echo "-> Building and starting containers..."
$COMPOSE_CMD up -d --build

echo "-> Deployment complete!"
echo ""
echo "The application is now running."
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:8000"
echo ""
echo "NOTE: If this is your first time deploying and you want to populate"
echo "the fresh PostgreSQL database with your initial machines and services,"
echo "run the following command:"
echo "  $COMPOSE_CMD exec backend python seed.py"
echo "======================================"
