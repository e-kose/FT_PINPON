#!/bin/bash

# ft_transcendence Monitoring Setup Script
# This script sets up the monitoring system for all services

set -e

echo "=========================================="
echo "ft_transcendence Monitoring Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${NC}ℹ $1${NC}"
}

# Check if running from Backend directory
if [ ! -f "docker-compose.yml" ]; then
    print_error "Please run this script from the Backend directory"
    exit 1
fi

print_info "Step 1: Creating monitoring environment file..."
if [ ! -f "monitoring/.env" ]; then
    cp monitoring/.env.example monitoring/.env
    print_success "Created monitoring/.env from template"
    print_warning "Please update monitoring/.env with secure passwords!"
else
    print_warning "monitoring/.env already exists, skipping..."
fi

print_info ""
print_info "Step 2: Installing prom-client in all services..."

services=("api-gateway" "auth-service" "user-service" "chat-service" "notification-service")

for service in "${services[@]}"; do
    if [ -d "$service" ]; then
        print_info "Installing prom-client in $service..."
        cd "$service"
        if [ -f "package.json" ]; then
            npm install prom-client --save 2>/dev/null && print_success "$service: prom-client installed" || print_warning "$service: Installation may have failed"
        else
            print_warning "$service: package.json not found"
        fi
        cd ..
    else
        print_warning "$service directory not found"
    fi
done

print_info ""
print_info "Step 3: Checking Docker and Docker Compose..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_success "Docker is installed"

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
print_success "Docker Compose is installed"

print_info ""
print_info "Step 4: Creating necessary directories..."
mkdir -p monitoring/prometheus monitoring/grafana/provisioning/{dashboards,datasources} monitoring/alertmanager
print_success "Directories created"

print_info ""
print_info "Step 5: Validating docker-compose configuration..."
if docker-compose config > /dev/null 2>&1; then
    print_success "Docker Compose configuration is valid"
else
    print_error "Docker Compose configuration has errors. Please check docker-compose.yml"
    exit 1
fi

print_info ""
print_info "=========================================="
print_success "Monitoring setup completed successfully!"
print_info "=========================================="
echo ""
print_info "Next steps:"
echo "  1. Update monitoring/.env with secure passwords"
echo "  2. Register metrics plugin in each service's app.ts:"
echo "     import metricsPlugin from './plugins/metrics.plugin';"
echo "     await app.register(metricsPlugin);"
echo "  3. Start monitoring stack:"
echo "     docker-compose up -d prometheus grafana alertmanager"
echo "  4. Start all services:"
echo "     docker-compose up -d"
echo "  5. Access Grafana: http://localhost:3030"
echo "  6. Access Prometheus: http://localhost:9090"
echo ""
print_info "For detailed instructions, see Backend/monitoring/README.md"
echo ""
