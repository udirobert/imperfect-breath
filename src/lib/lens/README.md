# Enhanced Lens Protocol Integration

This directory contains the enhanced Lens Protocol integration for Imperfect Breath, providing robust error handling, caching, retry mechanisms, and performance monitoring.

## Key Components

### Enhanced Lens Client (`enhanced-lens-client.ts`)

- Resilient GraphQL client with automatic retries
- Comprehensive error handling for all Lens operations
- Storage fallback strategies
- Performance monitoring for expensive operations

### Error Handling (`errors.ts`)

- Type-specific error classes for precise error handling
- Standardized error formatting
- Error classification for UI presentation

### Caching System (`lens-cache.ts`)

- Efficient caching for social graph data
- Timeline-specific caching optimizations
- Memory-efficient storage with TTL support
- Automatic invalidation on mutations

### Retry Utilities (`retry-utils.ts`)

- Exponential backoff with jitter
- Configurable retry limits
- Custom retry strategies for different operations

### Enhanced GraphQL Client (`enhanced-graphql-client.ts`)

- Resilient GraphQL requests
- Automatic token refresh
- Rate limiting protection

## Usage

### Basic Usage with Enhanced Hook

```tsx
import { useLens } from "@/hooks/useLens";

function MyComponent() {
  const {
    isAuthenticated,
    currentAccount,
    authenticate,
    shareBreathingSession,
    error,
    errorType,
  } = useLens();

  // All operations now include retries, caching, and proper error handling
}
```

### Testing

Visit the Enhanced Lens Test page at `/enhanced-lens` to test all functionality with the new resilient implementation.

## Error Types

The system provides specialized error types for different scenarios:

- `LensAuthenticationError` - Authentication failures
- `LensApiError` - Network and API connection issues
- `LensRateLimitError` - Rate limit exceeded scenarios
- `LensSocialActionError` - Failures during social actions
- `LensStorageError` - Problems with Grove storage
- `LensContentValidationError` - Invalid content issues

## Caching Strategy

The enhanced implementation uses a multi-tiered caching strategy:

1. **Session-level caching** - For timeline and profile data
2. **Memory caching** - For high-frequency operations
3. **Persistent caching** - For authentication state
4. **Smart invalidation** - Automatic cache clearing on mutations

## Benefits

- **Resilience** - Operations continue even during network instability
- **Performance** - Reduced API calls through smart caching
- **User Experience** - Graceful degradation during API issues
- **Developer Experience** - Clearer error messages and debugging
- **Maintainability** - Standardized error handling and retry logic

## Implementation Details

The enhanced implementation works by wrapping the standard Lens client with additional layers:

1. **Error handling layer** - Converts generic errors to typed errors
2. **Retry layer** - Automatically retries failed operations
3. **Caching layer** - Reduces redundant API calls
4. **Monitoring layer** - Tracks performance metrics

Each layer operates independently but cooperatively to provide a robust experience.
