#!/bin/bash
# Build verification script for CI/CD pipeline

set -e

echo "================================"
echo "Build Verification Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node version
echo "Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "✓ Node.js version: $NODE_VERSION"
echo ""

# Check npm version
echo "Checking npm version..."
NPM_VERSION=$(npm -v)
echo "✓ npm version: $NPM_VERSION"
echo ""

# Set CI environment variables
export CI=true
export GENERATE_SOURCEMAP=false
export REACT_APP_API_URL=/api
export SKIP_PREFLIGHT_CHECK=true

echo "Environment variables:"
echo "  CI: $CI"
echo "  GENERATE_SOURCEMAP: $GENERATE_SOURCEMAP"
echo "  REACT_APP_API_URL: $REACT_APP_API_URL"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm ci --prefer-offline --no-audit
echo "✓ Dependencies installed"
echo ""

# Run build
echo "Building application..."
npm run build
echo "✓ Build completed successfully"
echo ""

# Verify build output
echo "Verifying build output..."

if [ ! -d "build" ]; then
    echo -e "${RED}✗ Build directory not found${NC}"
    exit 1
fi

if [ ! -f "build/index.html" ]; then
    echo -e "${RED}✗ index.html not found in build directory${NC}"
    exit 1
fi

if [ ! -d "build/static" ]; then
    echo -e "${RED}✗ Static directory not found in build${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All build artifacts verified${NC}"
echo ""

# Check build size
BUILD_SIZE=$(du -sh build | cut -f1)
echo "Build size: $BUILD_SIZE"
echo ""

# List build contents
echo "Build directory structure:"
ls -lh build/
echo ""

if [ -d "build/static/js" ]; then
    echo "JavaScript bundles:"
    ls -lh build/static/js/*.js 2>/dev/null || echo "No JS files found"
    echo ""
fi

if [ -d "build/static/css" ]; then
    echo "CSS files:"
    ls -lh build/static/css/*.css 2>/dev/null || echo "No CSS files found"
    echo ""
fi

# Check for source maps (should not be present in CI builds)
if [ "$GENERATE_SOURCEMAP" = "false" ]; then
    SOURCEMAPS=$(find build -name "*.map" 2>/dev/null | wc -l)
    if [ "$SOURCEMAPS" -gt 0 ]; then
        echo -e "${YELLOW}⚠ Warning: Found $SOURCEMAPS source map files (GENERATE_SOURCEMAP=false)${NC}"
    else
        echo -e "${GREEN}✓ No source maps found (as expected)${NC}"
    fi
    echo ""
fi

echo "================================"
echo -e "${GREEN}Build verification completed!${NC}"
echo "================================"
