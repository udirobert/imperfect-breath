# API Documentation

Comprehensive API documentation for Imperfect Breath services.

## Overview

The API provides integration endpoints for:
- Lens Protocol v3 integration
- Flow Forte integration
- RevenueCat configuration
- Cross-network coordination

## Authentication

All API endpoints require authentication using Supabase JWT tokens:

```bash
Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN
```

## Endpoints

### Lens Protocol v3 Integration

#### POST /api/integration/lens-v3

Integrate with Lens Protocol v3 features.

**Request Body:**
```json
{
  "action": "authenticate|createPost|follow",
  "data": {
    // Action-specific data
  }
}
```

**Actions:**
- `authenticate`: Authenticate with Lens Protocol v3
- `createPost`: Create a post using Lens Protocol v3
- `follow`: Follow an account using Lens Protocol v3

**Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

### Flow Forte Integration

#### POST /api/integration/flow-forte

Integrate with Flow Forte features.

**Request Body:**
```json
{
  "action": "scheduleTransaction|getScheduledTransactions|cancelScheduledTransaction|getCapabilities",
  "data": {
    // Action-specific data
  }
}
```

**Actions:**
- `scheduleTransaction`: Schedule a transaction for future execution
- `getScheduledTransactions`: Get all scheduled transactions for the user
- `cancelScheduledTransaction`: Cancel a scheduled transaction
- `getCapabilities`: Get Flow Forte capabilities

**Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

### RevenueCat Integration

#### POST /api/integration/revenuecat

Integrate with RevenueCat features.

**Request Body:**
```json
{
  "action": "identifyUser|setDeveloperOverride|clearDeveloperOverride",
  "data": {
    // Action-specific data
  }
}
```

**Actions:**
- `identifyUser`: Identify user with RevenueCat
- `setDeveloperOverride`: Set developer override for testing
- `clearDeveloperOverride`: Clear developer override

**Response:**
```json
{
  "success": true,
  "message": "Success message"
}
```

### Cross-Network Integration

#### POST /api/cross-network/mint

Coordinate activities between Flow Forte and Lens Protocol.

**Request Body:**
```json
{
  "action": "mintWithSocial|purchaseWithSocial|createChallenge",
  "data": {
    // Action-specific data
  }
}
```

**Actions:**
- `mintWithSocial`: Mint an NFT and share on social networks
- `purchaseWithSocial`: Purchase an NFT and share on social networks
- `createChallenge`: Create a breathing challenge with cross-network rewards

**Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

### Common Error Codes

- `METHOD_NOT_ALLOWED`: Invalid HTTP method
- `UNAUTHORIZED`: Missing or invalid authentication
- `MISSING_PARAMS`: Required parameters missing
- `INVALID_ACTION`: Invalid action specified
- `INVALID_TOKEN`: Invalid or expired authentication token
- `FORBIDDEN`: Insufficient permissions

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user

## Security

- All endpoints use HTTPS
- CORS protection enabled
- Input validation and sanitization
- Content Security Policy enforcement
- Rate limiting to prevent abuse