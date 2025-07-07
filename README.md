# Story Protocol Integration for Browser Environments

This project demonstrates a solution for using the Story Protocol SDK in browser environments by implementing a server-side proxy pattern. This approach resolves the Node.js dependency issues that arise when trying to use the SDK directly in the browser.

## The Problem

The Story Protocol SDK relies on several Node.js-specific modules that are difficult to polyfill in browser environments. Attempting to directly use the SDK in a browser-based application leads to complex bundling issues and runtime errors.

## The Solution

Instead of trying to make the SDK work directly in the browser, we've implemented a server-side proxy approach:

1. **Server Component**: A Node.js Express server that interacts with the Story Protocol SDK
2. **REST API**: A set of endpoints that expose SDK functionality
3. **Frontend Client**: A TypeScript client that communicates with the server API instead of using the SDK directly

This architecture provides several advantages:

- Separates blockchain interaction logic from the frontend
- Simplifies private key management (keys stay on the server)
- Avoids complex polyfilling and bundling issues
- Provides a clean API for frontend developers

## Project Structure

```
/
├── server/                  # Server-side proxy for Story Protocol SDK
│   ├── server.js            # Express server implementation
│   ├── package.json         # Server dependencies
│   ├── .env                 # Server environment configuration
│   └── README.md            # Server documentation
│
├── src/
│   ├── lib/story/           # Story Protocol integration
│   │   ├── clients/         # Client implementations
│   │   │   ├── consolidated-client.ts  # Direct SDK client (Node.js only)
│   │   │   └── api-client.ts           # API client (browser-compatible)
│   │   ├── config.ts        # Client configuration
│   │   ├── types.ts         # Shared type definitions
│   │   └── useStoryProtocol.ts  # React hook for using Story Protocol
│   │
│   └── components/          # React components
│       └── IPAssetRegistration.tsx  # Example IP registration component
│
├── .env                     # Frontend environment configuration
├── vite.config.ts           # Vite configuration
└── index.html               # Main HTML file
```

## Setup Instructions

### Server Setup

1. Navigate to the server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Edit the `.env` file to include your private key and RPC URL:

```
PRIVATE_KEY=your_private_key_here
RPC_URL=your_rpc_url_here
```

5. Start the server:

```bash
npm run dev
```

The server will start on port 3001 by default.

### Frontend Setup

1. From the project root, install dependencies:

```bash
npm install
```

2. Create a `.env` file (if not already created):

```
VITE_STORY_API_URL=http://localhost:3001/api
VITE_STORY_NETWORK=testnet
```

3. Start the development server:

```bash
npm run dev
```

## Usage

### Using the Story Protocol Client

The integration provides two client implementations:

1. `ConsolidatedStoryClient`: Direct SDK client (Node.js environments only)
2. `StoryProtocolApiClient`: API client that communicates with the server (works in any environment)

The system automatically chooses the appropriate client based on the environment.

```typescript
import { getStoryClient } from "./lib/story/config";

// Get client instance (automatically chooses the right implementation)
const client = getStoryClient(true); // true for testnet

// Initialize client
await client.initialize();

// Use client methods
const result = await client.registerBreathingPatternIP(pattern);
```

### Using the React Hook

For React components, use the provided hook:

```typescript
import { useStoryProtocol } from './lib/story/useStoryProtocol';

function MyComponent() {
  const { state, actions } = useStoryProtocol();

  // Access state
  const { isInitialized, isConnected, error } = state;

  // Use actions
  const handleRegister = async () => {
    const result = await actions.registerBreathingPatternIP(pattern);
    console.log(result);
  };

  return (
    // Your component JSX
  );
}
```

## Available API Endpoints

The server provides the following endpoints:

- `GET /api/health` - Health check endpoint
- `GET /api/ip-assets/:id` - Get IP asset by ID
- `POST /api/ip-assets/register` - Register a new IP asset
- `GET /api/ip-assets/by-owner/:address` - Get all IP assets owned by an address
- `POST /api/ip-assets/:id/transfer` - Get instructions for transferring an IP asset
- `POST /api/ip-assets/:id/claim-revenue` - Claim revenue from derivatives
- `POST /api/license` - Create license terms
- `PUT /api/license/:ipId` - Set license terms for an IP asset
- `POST /api/derivative` - Register a derivative IP asset
- `POST /api/upload` - Upload a file (for metadata/images)

## Example Component

See the `IPAssetRegistration.tsx` component for a complete example of registering a breathing pattern as an IP asset using the Story Protocol integration.
