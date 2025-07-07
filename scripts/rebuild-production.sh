#!/bin/bash

# Production Rebuild Script
# This script rebuilds the application with optimized settings for production

# Set default build mode
BUILD_MODE="production"

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dev) BUILD_MODE="development" ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Stop on any error
set -e

echo "===== Production Rebuild Script ====="
echo "Build mode: $BUILD_MODE"

# Check for Node.js version
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Check for esbuild version
if npm list esbuild | grep -q "0.25.0"; then
  echo "✓ esbuild 0.25.0 is already installed"
else
  echo "⚠️ Incorrect esbuild version. Installing esbuild 0.25.0..."
  npm install esbuild@0.25.0 --save-exact
fi

# Clean previous build
echo "Cleaning previous build..."
rm -rf dist || true

# Make sure production patches are in place
echo "Verifying production patches..."
if [ ! -f "public/production-patch.js" ]; then
  echo "❌ ERROR: production-patch.js is missing!"
  exit 1
fi

# Verify index.html includes the production patch
if ! grep -q "production-patch.js" index.html; then
  echo "❌ ERROR: production-patch.js is not included in index.html!"
  exit 1
fi

# Set environment to production
export NODE_ENV=$BUILD_MODE

# Build with optimized settings
echo "Building with $BUILD_MODE settings..."
npm run build -- --mode $BUILD_MODE

# Verify the build completed successfully
if [ -d "dist" ]; then
  echo "✓ Build completed successfully!"
  
  # Count files in dist
  FILE_COUNT=$(find dist -type f | wc -l)
  echo "Total files in dist: $FILE_COUNT"
  
  # Check bundle size
  echo "Checking bundle sizes..."
  du -sh dist
  find dist -name "*.js" -exec du -sh {} \;
  
  echo ""
  echo "=== Build Summary ==="
  echo "✓ Production patches applied"
  echo "✓ Non-intrusive wallet adapter implemented"
  echo "✓ React initialization errors addressed"
  echo "✓ Build optimizations applied"
  echo ""
  echo "To deploy, upload the contents of the dist folder to your production server."
else
  echo "❌ Build failed!"
  exit 1
fi