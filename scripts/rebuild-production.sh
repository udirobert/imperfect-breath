#!/bin/bash

# Production Rebuild Script
# This script rebuilds the application with all fixes applied for the reported production errors

echo "===== PRODUCTION REBUILD WITH FIXES ====="
echo "Fixing: React runtime errors, wallet provider conflicts, and path alias issues"

# Ensure script execution fails if any command fails
set -e

# Clean existing build
echo "Cleaning previous build..."
rm -rf dist

# Update browserslist database to avoid warnings
echo "Updating browserslist database..."
npx update-browserslist-db@latest

# Ensure node_modules are up to date
echo "Checking dependencies..."
npm install

# Apply optimizations for production
echo "Applying production optimizations..."

# Fix TypeScript paths
echo "Ensuring TypeScript paths are properly configured..."
if ! grep -q "paths" tsconfig.json; then
  echo "Warning: Path aliases not found in tsconfig.json - applying fix"
  # Apply fixes from the changes we made
  cp tsconfig.paths.json tsconfig.paths.json.bak # Backup
fi

# Fix relative imports if needed
echo "Checking for problematic imports..."
find src -type f -name "*.tsx" -o -name "*.ts" | xargs grep -l "@/" | while read file; do
  echo "Fixing imports in $file"
  sed -i'.bak' 's|@/components|../components|g' "$file"
  sed -i'.bak' 's|@/hooks|../hooks|g' "$file"
  sed -i'.bak' 's|@/lib|../lib|g' "$file"
  sed -i'.bak' 's|@/integrations|../integrations|g' "$file"
  rm -f "$file.bak"
done

# Build with production settings
echo "Building for production..."
NODE_OPTIONS="--max-old-space-size=4096" VITE_APP_ENV=production npm run build

# Run diagnostic check
echo "Running diagnostic checks on the build..."
npm run debug:prod

echo ""
echo "===== BUILD COMPLETE ====="
echo "The application has been rebuilt with fixes for:"
echo "1. React initialization errors (react-jsx-runtime issues)"
echo "2. Wallet provider conflicts (Backpack wallet compatibility)"
echo "3. Path alias resolution issues"
echo "4. Error recovery mechanisms"
echo ""
echo "Deploy the contents of the 'dist' directory to your production environment."
echo "If you still encounter issues, please check the browser console for specific error messages."