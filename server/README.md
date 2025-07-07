# Story Protocol Server

This server acts as a proxy between the frontend application and the Story Protocol blockchain SDK. It handles all Node.js-specific code and provides a RESTful API for the frontend to consume.

## Why a server?

The Story Protocol SDK relies on several Node.js-specific modules that are difficult to polyfill in browser environments. Rather than trying to make the SDK work directly in the browser (which leads to complex bundling issues), this server approach:

1. Handles all blockchain interactions on the server side
2. Exposes a clean REST API for the frontend
3. Simplifies authentication and private key management
4. Abstracts away complex blockchain operations

## Setup

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Install dependencies:

```bash
cd server
npm install
```

2. Configure environment variables:

```bash
# Copy the example .env file
cp .env.example .env

# Edit the .env file with your configuration
# You must set at minimum:
# - PRIVATE_KEY (your Ethereum private key)
# - RPC_URL (your Ethereum RPC endpoint)
```

3. Start the server:

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on port 3001 by default (configurable in .env).

## API Endpoints

### IP Assets

- `GET /api/health` - Health check endpoint
- `GET /api/ip-assets/:id` - Get IP asset by ID
- `POST /api/ip-assets/register` - Register a new IP asset
- `GET /api/ip-assets/by-owner/:address` - Get all IP assets owned by an address
- `POST /api/ip-assets/:id/transfer` - Get instructions for transferring an IP asset
- `POST /api/ip-assets/:id/claim-revenue` - Claim revenue from derivatives

### Licenses

- `POST /api/license` - Create license terms
- `PUT /api/license/:ipId` - Set license terms for an IP asset

### Derivatives

- `POST /api/derivative` - Register a derivative IP asset

### Utilities

- `POST /api/upload` - Upload a file (for metadata/images)

## Frontend Integration

The frontend should be configured to communicate with this server using the environment variable:

```
VITE_STORY_API_URL=http://localhost:3001/api
```

See the API client in `src/lib/story/clients/api-client.ts` for implementation details.

## Authentication

The server supports API key authentication to secure the endpoints. To enable this:

1. Set the `API_KEY` environment variable in your server's `.env` file:

   ```
   API_KEY=your_secret_api_key_here
   ```

2. Configure the frontend to include this key in requests by setting:

   ```
   VITE_STORY_API_KEY=your_secret_api_key_here
   ```

3. The frontend will automatically include the API key in all requests as the `X-API-Key` header.

All API endpoints (except the `/api/health` endpoint) will require this authentication when the `API_KEY` is set in the server environment.

## Security Considerations

In a production environment, you should:

1. Always use API key authentication (now implemented)
2. Use HTTPS for all communication
3. Store private keys securely (not in .env files)
4. Implement rate limiting and other protections
5. Consider implementing more robust authentication like JWT or OAuth for user-specific operations

## Troubleshooting

If you encounter issues:

1. Check that your .env configuration is correct
2. Verify that you have the correct private key for your Ethereum account
3. Ensure your RPC endpoint is working correctly
4. Check the server logs for detailed error messages
