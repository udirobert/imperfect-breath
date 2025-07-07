#!/bin/bash

# =================================================================
# Complete setup and run script for Story Aeneid Testnet
# =================================================================

echo "============================================================"
echo "Setting up and running Story Aeneid Testnet integration"
echo "============================================================"

# Navigate to the project root
cd "$(dirname "$0")"

# Step 1: Install dependencies
echo ""
echo "Step 1: Installing dependencies..."
echo "------------------------------------------------------------"

# Install root project dependencies
npm install

# Update package.json with correct SDK version
echo "Updating Story Protocol SDK version in package.json..."
cd server
if [ -f "package.json" ]; then
  # Backup the original package.json
  cp package.json package.json.bak
  
  # Update the Story Protocol SDK version to latest available
  sed -i '' 's/"@story-protocol\/core-sdk": "\^0.1.0"/"@story-protocol\/core-sdk": "latest"/g' package.json
  
  echo "Installing server dependencies..."
  npm install
  
  # If installation fails, try alternative versions
  if [ $? -ne 0 ]; then
    echo "Failed with latest version, trying version 0.2.x..."
    sed -i '' 's/"@story-protocol\/core-sdk": "latest"/"@story-protocol\/core-sdk": "^0.2.0"/g' package.json
    npm install
    
    # If still failing, try without version constraint
    if [ $? -ne 0 ]; then
      echo "Trying without version constraint..."
      sed -i '' 's/"@story-protocol\/core-sdk": "\^0.2.0"/"@story-protocol\/core-sdk": "*"/g' package.json
      npm install
    fi
  fi
  cd ..
else
  echo "Error: server/package.json not found!"
  cd ..
  exit 1
fi

# Step 2: Set up environment files
echo ""
echo "Step 2: Setting up environment files..."
echo "------------------------------------------------------------"

# Handle server .env file
if [ ! -f ".env" ]; then
  echo "Creating server .env file from .env.aeneid.example..."
  cp .env.aeneid.example .env
  echo "⚠️  Please edit .env file to add your private key! ⚠️"
  echo "Press Enter to continue once you've added your private key..."
  read
else
  # Check if required variables are set properly
  PRIVATE_KEY_SET=$(grep "PRIVATE_KEY=" .env | grep -v "your_private_key_here" | wc -l)
  RPC_URL_SET=$(grep "RPC_URL=" .env | grep -v "your_" | wc -l)
  
  if [ "$PRIVATE_KEY_SET" -eq "0" ] || [ "$RPC_URL_SET" -eq "0" ]; then
    echo "⚠️  WARNING: Required environment variables not properly set in .env file!"
    echo "Opening .env file for editing..."
    echo "Please update the following values:"
    echo "  - PRIVATE_KEY: Set to your private key"
    echo "  - RPC_URL: Set to https://aeneid.storyrpc.io (should be already set)"
    echo ""
    
    # Open the file with the default editor if possible
    if command -v nano &> /dev/null; then
      nano .env
    elif command -v vi &> /dev/null; then
      vi .env
    else
      echo "Please edit the .env file manually with your text editor."
      echo "Press Enter to continue once you've edited the file..."
      read
    fi
  else
    echo "Server .env file already exists and appears to be configured."
  fi
fi

# Create client .env file if it doesn't exist
if [ ! -f ".env.local" ]; then
  echo "Creating client .env file..."
  echo "VITE_API_URL=http://localhost:3001/api" > .env.local
  echo "Client .env file created."
else
  echo "Client .env file already exists."
fi

# Step 3: Start the server
echo ""
echo "Step 3: Starting the server..."
echo "------------------------------------------------------------"
echo "Starting server on port 3001..."
echo "The server is running in this terminal window."
echo "Open a new terminal window and run 'npm run dev' to start the frontend."
echo ""
echo "Press Ctrl+C to stop the server when you're done."
echo "------------------------------------------------------------"

# Check if dependencies were successfully installed
if [ -d "server/node_modules/express" ] && [ -d "server/node_modules/@story-protocol" ]; then
  echo "Dependencies successfully installed."
  # Run the server directly with node
  node server/server.js
else
  echo "Error: Dependencies were not properly installed."
  echo "Please check your internet connection and try again."
  echo "You can also try installing dependencies manually with:"
  echo "  cd server"
  echo "  npm install"
  exit 1
fi