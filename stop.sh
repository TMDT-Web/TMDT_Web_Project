#!/bin/bash
# Bash script để stop services
# Sử dụng: ./stop.sh

echo "=================================="
echo "  Stopping LUXE FURNITURE...     "
echo "=================================="
echo ""

# Ask if user wants to remove volumes
echo "Do you want to remove database volumes?"
echo "  WARNING: This will delete all data!"
echo ""
read -p "Remove volumes? (y/N) [default: N]: " removeVolumes

echo ""
if [ "$removeVolumes" = "y" ] || [ "$removeVolumes" = "Y" ]; then
    echo "Stopping services and removing volumes..."
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
else
    echo "Stopping services (keeping data)..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ All services stopped successfully!"
    echo ""
else
    echo ""
    echo "⚠ Some errors occurred"
fi
