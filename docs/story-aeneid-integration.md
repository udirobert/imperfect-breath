# Story Aeneid Testnet Integration Guide

This guide explains how to use the Story Protocol Aeneid Testnet with the Imperfect Breath application.

## Overview

The Story Protocol Aeneid Testnet (Chain ID: 1315) is a test network for Story Protocol's IP management system. It allows developers to test IP registration, licensing, and derivative works functionality without using real assets.

## Key Changes

We've updated the application to work with the Aeneid testnet:

1. The server now connects to the Aeneid testnet (Chain ID: 1315) by default
2. Frontend components use the server API instead of direct SDK integration
3. Environment files have been updated with proper Aeneid testnet configuration

## Environment Setup

### Server Setup

1. Copy `.env.aeneid.example` to `.env` in your project root:

   ```bash
   cp .env.aeneid.example .env
   ```

2. Edit the `.env` file to add:

   - Your private key
   - A strong API key for server authentication
   - Any custom configuration

3. Key server environment variables:
   - `RPC_URL`: Set to `https://aeneid.storyrpc.io`
   - `CHAIN_ID`: Set to `1315` for Story Aeneid Testnet
   - `PRIVATE_KEY`: Your wallet private key (keep this secret!)

### Frontend Setup

1. Copy `.env.client.example` to `.env` in your project root:

   ```bash
   cp .env.client.example .env
   ```

2. Set `VITE_API_URL` to point to your running server API (default: `http://localhost:3001/api`)

## Running the Application

### Starting the Server

```bash
# Install dependencies if needed
npm install

# Start the server
node server/server.js
```

You should see output confirming connection to the Story Aeneid Testnet:

```
Server running on port 3001
Health check available at http://localhost:3001/api/health
Network: Story Aeneid Testnet (Chain ID: 1315)
RPC URL: https://aeneid.storyrpc.io
Block Explorer: https://aeneid.storyscan.io
IP Explorer: https://aeneid.explorer.story.foundation
Story Protocol client initialized successfully
```

### Starting the Frontend

```bash
# Install dependencies if needed
npm install

# Start the development server
npm run dev
```

## Using the Integration

### IP Asset Registration

1. Navigate to the IP Asset Registration page
2. Fill out the breathing pattern details
3. Click "Register IP Asset"
4. The registration will be processed through the server API
5. You'll receive a transaction ID that can be viewed on the Aeneid Explorer

### Viewing IP Assets

You can view registered IP assets at:

- Block Explorer: https://aeneid.storyscan.io
- IP Explorer: https://aeneid.explorer.story.foundation

## Troubleshooting

### Server Connection Issues

If you encounter "Story Protocol client not initialized" errors:

1. Verify your `.env` file has the correct:

   - `RPC_URL` (https://aeneid.storyrpc.io)
   - `CHAIN_ID` (1315)
   - `PRIVATE_KEY` (valid private key)

2. Check server logs for specific errors

### Browser Compatibility Issues

The Story Protocol SDK uses Node.js features that don't work in browsers. Our implementation:

1. Keeps all blockchain interactions on the server
2. Exposes a REST API for the frontend
3. Avoids using the SDK directly in browser code

If you see errors like:

- "Module 'path' has been externalized for browser compatibility"
- "process.cwd is not a function"

Make sure you're using the server API approach rather than trying to use the SDK directly in the browser.

### Getting Testnet Tokens

To get Story Aeneid Testnet tokens:

1. Visit the [Official Faucet](https://aeneid.explorer.story.foundation/faucet)
2. Use the [Google Cloud Faucet](https://faucet.storyrpc.io)

## Resources

- [Story Aeneid Block Explorer](https://aeneid.storyscan.io)
- [Story Aeneid IP Explorer](https://aeneid.explorer.story.foundation)
- [Story Protocol Documentation](https://docs.story.xyz)
