#!/bin/bash

# =================================================================
# Simple script to start the Story Aeneid server
# =================================================================

# Navigate to the project root
cd "$(dirname "$0")"

# Handle server .env file
if [ ! -f .env ]; then
  echo "Creating .env file from .env.aeneid.example..."
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
  fi
fi

# Create client .env file if it doesn't exist
if [ ! -f ".env.local" ]; then
  echo "Creating client .env file..."
  echo "VITE_API_URL=http://localhost:3001/api" > .env.local
  echo "Client .env file created."
fi

# Check if the server dependencies are installed
if [ ! -d "server/node_modules/express" ] || [ ! -d "server/node_modules/@story-protocol" ]; then
  echo "Dependencies missing. Installing server dependencies..."
  cd server
  npm install
  
  # If installation fails, the user should run the full setup script
  if [ $? -ne 0 ]; then
    echo "Error installing dependencies. Please run the full setup script instead:"
    echo "./setup-and-run.sh"
    exit 1
  fi
  cd ..
fi

# Display pre-run information
echo ""
echo "========================================================"
echo "IMPORTANT: Server Configuration"
echo "========================================================"
echo "Ensure your .env file contains valid values for:"
echo "  - PRIVATE_KEY: Your Ethereum private key"
echo "  - RPC_URL: https://aeneid.storyrpc.io"
echo "  - CHAIN_ID: 1315 (Story Aeneid Testnet)"
echo ""
echo "If the server fails to start, check these values."
echo "========================================================"
echo ""

# Start the server directly with node
echo "Starting server on port 3001..."
echo "The server is running in this terminal window."
echo "Open a new terminal window and run 'npm run dev' to start the frontend."
echo ""
echo "Press Ctrl+C to stop the server when you're done."
echo "------------------------------------------------------------"
node server/server.js