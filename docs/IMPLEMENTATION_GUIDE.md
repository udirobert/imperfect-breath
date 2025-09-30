# Lens Protocol v3 Implementation Guide

## Quick Start for Developers

This guide helps you understand and work with our Lens Protocol v3 integration in Imperfect Breath.

## 🚀 Getting Started

### 1. Understanding the Architecture

Our Lens integration follows a **three-layer architecture**:

```
┌─────────────────┐
│   React Hooks   │  ← useLens() - High-level React integration
├─────────────────┤
│   API Client    │  ← LensV3API - Core business logic
├─────────────────┤
│   Lens Protocol │  ← Real Lens v3 APIs (currently mocked)
└─────────────────┘
```

### 2. Basic Usage Pattern

```typescript
// 1. Import the hook
import { useLens } from '@/hooks/useLens';

// 2. Use in your component
const MyComponent = () => {
  const {
    isAuthenticated,
    authenticate,
    shareBreathingSession,
    timeline,
    loadTimeline
  } = useLens();

  // 3. Handle authentication
  const handleConnect = async () => {
    const result = await authenticate(walletAddress);
    if (result.success) {
      await loadTimeline(); // Load curated content
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <Feed posts={timeline} />
      ) : (
        <button onClick={handleConnect}>Connect to Lens</button>
      )}
    </div>
  );
};
```

## 📱 Integration with Main App Auth

### Consolidated Authentication

Use our unified auth system that handles both wallet and Lens authentication:

```typescript
import { useAuth } from '@/auth/useAuth';

const CommunityComponent = () => {
  // Enable blockchain + lens features
  const auth = useAuth({ blockchain: true, lens: true });
  
  const {
    hasWallet,          // Wallet connected
    isFullyConnected,   // Wallet + Lens connected
    wallet,             // Wallet info
    connectWallet,      // Connect wallet
  } = auth;

  // Then use useLens for Lens-specific operations
  const { authenticate } = useLens();

  const handleLensConnect = async () => {
    if (!hasWallet) {
      await connectWallet();
    }
    await authenticate(wallet.address);
  };
};
```

## 🎯 Content Curation System

### Understanding Content Sources

Our feed combines content from four sources, weighted by relevance:

```typescript
const CONTENT_SOURCES = {
  // 1. Our app content (highest priority)
  ourApp: {
    weight: 1.0,
    source: 'imperfect-breath app posts'
  },
  
  // 2. Wellness groups
  groups: {
    weight: 0.8,
    source: 'breathwork-practitioners, meditation-daily, etc.'
  },
  
  // 3. Curated feeds
  feeds: {
    weight: 0.6, 
    source: 'mindfulness-feed, daily-wellness, etc.'
  },
  
  // 4. Keyword filtered
  keywords: {
    weight: 0.4,
    source: 'global posts with wellness keywords'
  }
};
```

### Creating Quality Content

To ensure your posts appear in the feed, follow these guidelines:

```typescript
// ✅ Good breathing session post
const goodPost = {
  content: `🌬️ Just completed a 4-7-8 breathing session!
  
  ⏱️ Duration: 10 minutes
  📊 Score: 85/100
  🔄 Cycles: 8
  
  The pattern really helped me focus before my presentation.
  
  #breathing #478breathing #mindfulness #focus`,
  
  // Will score high because:
  // - Contains wellness keywords
  // - Good length (100-500 chars ideal)
  // - Includes helpful details
  // - Uses relevant hashtags
};

// ❌ Poor post (will be filtered out)
const poorPost = {
  content: "gm", // Too short, no value
  // Will be filtered because:
  // - Below 50 character minimum
  // - No wellness keywords
  // - Low engagement expected
};
```

## 🔧 Common Development Tasks

### 1. Sharing Breathing Sessions

```typescript
const shareSession = async () => {
  const session: BreathingSession = {
    patternName: '4-7-8 Breathing',
    duration: 600, // seconds
    score: 85,
    cycles: 8,
    breathHoldTime: 45, // optional
    completedAt: new Date().toISOString()
  };

  const result = await shareBreathingSession(session);
  
  if (result.success) {
    // Session shared successfully
    // Will appear in community feed
    await loadTimeline(true); // Refresh feed
  }
};
```

### 2. Creating Custom Posts

```typescript
const createPost = async (content: string) => {
  // Add wellness-focused tags for better curation
  const tags = ['breathing', 'wellness', 'mindfulness'];
  
  const result = await lensAPI.createPost(content, tags);
  
  if (result.success) {
    console.log('Post created:', result.id);
  }
};
```

### 3. Loading Timeline with Pagination

```typescript
const [cursor, setCursor] = useState<string>();

const loadMore = async () => {
  const result = await lensAPI.getTimeline(cursor);
  
  if (result.success && result.data) {
    const newPosts = result.data.items;
    setCursor(result.data.pageInfo.next);
    
    // Append to existing timeline
    setTimeline(prev => [...prev, ...newPosts]);
  }
};
```

## 🧪 Testing Your Integration

### 1. Mock Data Testing

The current implementation uses sophisticated mock data that mimics real Lens v3 behavior:

```typescript
// Test authentication flow
const testAuth = async () => {
  console.log('Testing Lens authentication...');
  
  const result = await authenticate('0x1234...');
  console.log('Auth result:', result);
  
  if (result.success) {
    console.log('✅ Authentication works');
    
    // Test timeline loading
    await loadTimeline();
    console.log('✅ Timeline loads');
  }
};
```

### 2. Content Curation Testing

```typescript
// Test content appears correctly
const testCuration = async () => {
  await loadTimeline();
  
  // Check content sources
  timeline.forEach(post => {
    console.log(`Post ${post.id}:`);
    console.log(`- Source: ${post.feedReason?.context}`);
    console.log(`- Reason: ${post.feedReason?.type}`);
    console.log(`- Wellness keywords: ${hasWellnessKeywords(post.content)}`);
  });
};
```

## 🔄 Migrating to Real Lens APIs

When ready to use real Lens Protocol APIs:

### 1. Install Dependencies

```bash
npm install @lens-protocol/client @lens-protocol/metadata
```

### 2. Update Client Implementation

Replace mock implementations in `client.ts`:

```typescript
// Before (mock)
private async fetchPostsFromGroups(groupIds: string[]) {
  return mockGroupPosts;
}

// After (real API)
private async fetchPostsFromGroups(groupIds: string[]) {
  const posts = await Promise.all(
    groupIds.map(groupId => 
      lensClient.groups.fetchPosts({ groupId, limit: 10 })
    )
  );
  return posts.flat();
}
```

### 3. Environment Configuration

```typescript
// Update config.ts
export const environment = isProduction ? mainnet : testnet;

// Update client initialization
const publicClient = PublicClient.create({
  environment,
  storage: window.localStorage
});
```

## 🐛 Debugging Common Issues

### Authentication Problems

```typescript
// Check session status
const debugAuth = () => {
  console.log('Authentication state:', {
    isAuthenticated,
    currentAccount,
    hasWallet: wallet?.isConnected,
    sessionData: getCurrentSession()
  });
};
```

### Content Not Appearing

```typescript
// Debug content curation
const debugContent = async () => {
  try {
    const posts = await lensAPI.getTimeline();
    console.log('Timeline result:', posts);
    
    if (posts.data?.items.length === 0) {
      console.log('No posts found - check:');
      console.log('1. Authentication status');
      console.log('2. Content filters');
      console.log('3. API connectivity');
    }
  } catch (error) {
    console.error('Timeline error:', error);
  }
};
```

### Network Issues

```typescript
// Check Lens connectivity
const checkConnectivity = async () => {
  try {
    const result = await lensAPI.resumeSession();
    console.log('Lens connectivity:', result.success ? '✅' : '❌');
  } catch (error) {
    console.error('Connection error:', error);
  }
};
```

## 📊 Performance Best Practices

### 1. Optimize Timeline Loading

```typescript
// Use pagination effectively
const useOptimizedTimeline = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  
  const loadMore = useCallback(async () => {
    if (loading) return; // Prevent double loading
    
    setLoading(true);
    try {
      const result = await lensAPI.getTimeline(cursor);
      if (result.data) {
        setPosts(prev => [...prev, ...result.data.items]);
      }
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);
  
  return { posts, loadMore, loading };
};
```

### 2. Cache Management

```typescript
// Clear cache when needed
const refreshContent = async () => {
  // Clear any local caches
  localStorage.removeItem('lens-timeline-cache');
  
  // Reload fresh content
  await loadTimeline(true);
};
```

### 3. Error Boundaries

```typescript
// Wrap Lens components in error boundaries
const LensErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<div>Community feed temporarily unavailable</div>}
      onError={(error) => console.error('Lens error:', error)}
    >
      {children}
    </ErrorBoundary>
  );
};
```

## 🔮 Advanced Features

### Custom Content Filters

```typescript
// Add custom filtering logic
const customFilter = (posts: Post[]) => {
  return posts.filter(post => {
    // Custom business logic
    return post.content.includes('meditation') ||
           post.author.metadata?.name?.includes('Coach');
  });
};
```

### Real-time Updates

```typescript
// Listen for new content (future feature)
const useRealtimeUpdates = () => {
  useEffect(() => {
    // Will connect to Lens real-time updates
    const subscription = lensAPI.subscribeToUpdates({
      filters: WELLNESS_KEYWORDS,
      onNewPost: (post) => {
        setTimeline(prev => [post, ...prev]);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);
};
```

## 📚 Additional Resources

- [Lens Protocol v3 Docs](https://docs.lens.xyz)
- [Content Curation Strategy](./CONTENT_CURATION_STRATEGY.md)
- [TypeScript Definitions](./types.ts)
- [Error Handling Guide](./errors.ts)

## ❓ FAQ

**Q: Why do I see mock data instead of real Lens posts?**
A: The current implementation uses mock data that follows real Lens v3 patterns. This allows development and testing without depending on external APIs.

**Q: How do I know if my content will appear in the feed?**
A: Content must have wellness keywords, meet engagement thresholds, and pass quality filters. Check the curation strategy doc for details.

**Q: Can I customize the content sources?**
A: Yes! Modify the `CONTENT_CURATION_CONFIG` in `client.ts` to adjust groups, feeds, and keywords.

**Q: How do I handle authentication errors?**
A: The system provides detailed error messages. Check wallet connection, signature permissions, and network connectivity.

**Q: Is this ready for production?**
A: The architecture is production-ready. You'll need to integrate real Lens v3 APIs when they're stable for your use case.

This guide should help you effectively work with our Lens Protocol v3 integration! 🌬️✨