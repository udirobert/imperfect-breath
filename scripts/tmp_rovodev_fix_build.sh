#!/bin/bash

echo "🔍 Checking for missing exports by running build and capturing errors..."

# Run build and capture the error output
npm run build 2>&1 | grep -E "is not exported by|imported by" | head -10 > tmp_rovodev_build_errors.txt

echo "📋 Found these export issues:"
cat tmp_rovodev_build_errors.txt

echo ""
echo "🔧 Let's fix them systematically..."