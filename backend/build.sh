#!/usr/bin/env bash
# Render build script for backend

set -e

echo "Starting build process..."

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

echo "Running database migrations..."
alembic upgrade head

echo "Build completed successfully!"
