#!/bin/bash

# Setup Dependencies Script
# This script installs all required dependencies for the production build

# Stop on any error
set -e

echo "===== Installing Production Dependencies ====="

# Install Vite React plugin
echo "Installing Vite React plugin..."
npm install @vitejs/plugin-react --save-dev

# Install Node polyfills for Vite
echo "Installing Vite Node polyfills plugin..."
npm install vite-plugin-node-polyfills --save-dev

# Install exact esbuild version
echo "Installing exact esbuild version..."
npm install esbuild@0.25.0 --save-exact --save-dev

# Check for other critical dependencies
echo "Verifying other critical dependencies..."

# Check for React dependencies
if ! npm list react >/dev/null 2>&1; then
  echo "Installing React..."
  npm install react react-dom --save
fi

# Check for TypeScript
if ! npm list typescript >/dev/null 2>&1; then
  echo "Installing TypeScript..."
  npm install typescript --save-dev
fi

# Check for Vite
if ! npm list vite >/dev/null 2>&1; then
  echo "Installing Vite..."
  npm install vite --save-dev
fi

# Install Terser for production minification
echo "Installing Terser for production minification..."
npm install terser --save-dev

echo ""
echo "===== Dependency Installation Complete ====="
echo ""
echo "To build for production, run:"
echo "  ./scripts/rebuild-production.sh"
echo ""
echo "To test wallet compatibility in your browser console, use the script at:"
echo "  scripts/verify-wallet-compatibility.js"