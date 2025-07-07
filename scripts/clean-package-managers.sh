#!/bin/bash

# Clean Package Managers Script
# This script standardizes the project to use npm only and fixes dependency issues

# Stop on any error
set -e

echo "===== Standardizing Package Management ====="

# 1. Remove bun lockfile if it exists
if [ -f "bun.lockb" ]; then
  echo "Removing bun.lockb..."
  rm bun.lockb
  echo "✓ bun.lockb removed"
fi

# 2. Remove node_modules to ensure clean install
echo "Removing node_modules..."
rm -rf node_modules
echo "✓ node_modules removed"

# 3. Clean npm cache to avoid any cached issues
echo "Cleaning npm cache..."
npm cache clean --force
echo "✓ npm cache cleaned"

# 4. Install dependencies with npm
echo "Installing dependencies with npm..."
npm install
echo "✓ Dependencies installed with npm"

# 5. Install specific versions of critical dependencies
echo "Installing exact versions of critical dependencies..."
npm install @vitejs/plugin-react@4.6.0 vite-plugin-node-polyfills@0.24.0 esbuild@0.25.0 --save-exact --save-dev
echo "✓ Critical dependencies installed"

# 6. Ensure scripts are executable
echo "Making build scripts executable..."
chmod +x scripts/rebuild-production.sh
echo "✓ Build scripts are executable"

echo ""
echo "===== Package Management Standardization Complete ====="
echo ""
echo "Your project is now standardized to use npm only."
echo "To build for production, run:"
echo "  ./scripts/rebuild-production.sh"
echo ""
echo "This resolves the package manager conflicts that were contributing to build issues."