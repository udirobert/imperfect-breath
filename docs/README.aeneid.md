# Story Aeneid Testnet Integration Guide

This project has been updated to support the Story Aeneid Testnet (Chain ID 1315). The following guide will help you set up and run the application with the Story Protocol integration.

## Quick Setup (Recommended)

We've created an automated setup script that handles the installation and configuration process:

```bash
# Make the script executable (if not already)
chmod +x setup-and-run.sh

# Run the setup script
./setup-and-run.sh    # correct way
# or
bash setup-and-run.sh # alternative way

# DO NOT run using node:
# ❌ node setup-and-run.sh  # this will not work!
```

This script:

1. Installs all dependencies
2. Sets up environment files
3. Starts the server

Once the server is running, open a new terminal and start the frontend:

```bash
npm run dev
```

## What's Fixed in This Update

- Updated SDK version handling to use the latest available version of `@story-protocol/core-sdk`
- Fixed dependency installation issues
- Added error checking to prevent "module not found" errors
- Created helper scripts for easier setup and running

## Important: How to Run Shell Scripts

The scripts in this project are **shell scripts** (bash), not JavaScript files. They must be executed directly, not with Node.js.

### Correct ways to run:

- ✅ `./script-name.sh` (after making executable with `chmod +x script-name.sh`)
- ✅ `bash script-name.sh`
- ✅ `sh script-name.sh`

### Incorrect ways to run:

- ❌ `node script-name.sh`
- ❌ `npx script-name.sh`

For more details, see [HOW_TO_RUN.md](./HOW_TO_RUN.md).

## Manual Setup (If Needed)

If the automated script doesn't work for you, follow these manual steps:

1. **Update and install server dependencies**:

   ```bash
   cd server
   # Edit package.json to change "@story-protocol/core-sdk": "^0.1.0" to "@story-protocol/core-sdk": "latest"
   npm install
   cd ..
   ```

2. **Set up environment files**:

   ```bash
   # Server environment
   cp .env.aeneid.example .env

   # Client environment
   echo "VITE_API_URL=http://localhost:3001/api" > .env.local
   ```

3. **Edit `.env` to add your private key**

4. **Start the server and frontend**:

   ```bash
   # Terminal 1: Start the server
   node server/server.js

   # Terminal 2: Start the frontend
   npm run dev
   ```

## Troubleshooting

### Common Issues:

1. **SDK Version Problems**:

   - The `@story-protocol/core-sdk` package version `0.1.0` is no longer available
   - Our setup script automatically tries different versions to find one that works

2. **"Cannot find module" Errors**:

   - Make sure all dependencies are properly installed in both the root and server directories
   - Try running `npm install` in both the root directory and the `server` directory

3. **Connection Issues**:

   - If the frontend can't connect to the server, check that:
     - The server is running on port 3001
     - Your `.env.local` file contains `VITE_API_URL=http://localhost:3001/api`
     - No CORS errors appear in the browser console

4. **Story Protocol SDK Initialization Errors**:
   - Check that your `.env` file has valid values for:
     - `PRIVATE_KEY` (a valid Ethereum private key)
     - `RPC_URL` (should be `https://aeneid.storyrpc.io`)
     - `CHAIN_ID` (should be `1315` for the Aeneid testnet)

## Network Details

- **Network Name**: Story Aeneid Testnet
- **Chain ID**: 1315
- **RPC URL**: https://aeneid.storyrpc.io
- **Block Explorer**: https://aeneid.storyscan.io
- **IP Explorer**: https://aeneid.explorer.story.foundation
