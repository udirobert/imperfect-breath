# Lens Protocol v3 Content Curation Strategy

## Overview

This document outlines our comprehensive content curation strategy for the Imperfect Breath community feed, leveraging Lens Protocol v3's advanced features including Groups, Feeds, Rules, and keyword-based filtering.

## Content Sources & Prioritization

### 1. **Primary Source: Our App Content** (Weight: 1.0)
- **Source**: Posts created through Imperfect Breath app
- **App ID**: `imperfect-breath`
- **Priority**: Highest - these appear first in the feed
- **Content Types**:
  - Breathing session completions
  - Achievement unlocks
  - Challenge participation
  - User-generated breathing patterns
  - Community milestones

### 2. **Secondary Source: Wellness Groups** (Weight: 0.8)
- **Lens v3 Groups**: Curated communities focused on wellness
- **Target Groups**:
  - `wellness-breathwork-community` - Main wellness group
  - `breathwork-practitioners` - Professional practitioners
  - `meditation-daily` - Daily meditation community
  - `mindfulness-community` - General mindfulness content
  - `wellness-journey` - Personal wellness stories

### 3. **Tertiary Source: Curated Feeds** (Weight: 0.6)
- **Lens v3 Feeds**: Algorithm-curated wellness content
- **Target Feeds**:
  - `mindfulness-feed` - General mindfulness content
  - `daily-wellness` - Daily wellness tips
  - `breathwork-feed` - Specific to breathing exercises
  - `meditation-insights` - Meditation teachings and insights

### 4. **Quaternary Source: Keyword Filtering** (Weight: 0.4)
- **Global Timeline Search**: Wellness-related content from entire Lens network
- **Method**: Keyword matching with quality filters

## Keyword Strategy

### Included Keywords (Wellness Focus)
```javascript
const WELLNESS_KEYWORDS = [
  // Core breathing terms
  "breathing", "breathwork", "pranayama", "breath hold",
  
  // Specific techniques
  "wim hof", "box breathing", "4-7-8", "coherent breathing",
  "triangle breathing", "alternate nostril", "tactical breathing",
  
  // Wellness concepts
  "meditation", "mindfulness", "wellness", "yoga", "zen",
  "calm", "relaxation", "stress relief", "anxiety relief",
  
  // Mental health
  "focus", "concentration", "peace", "tranquil", "self-care",
  "mental health", "healing", "therapeutic", "holistic"
];
```

### Excluded Keywords (Content Filtering)
```javascript
const EXCLUDED_KEYWORDS = [
  "crypto", "trading", "financial", "politics", 
  "controversial", "gambling", "adult content"
];
```

## Quality Filters

### Engagement Thresholds
- **Minimum Reactions**: 2 (prevents spam)
- **Minimum Content Length**: 50 characters (avoids low-effort posts)
- **Maximum Content Length**: 2000 characters (prevents excessive posts)

### Content Quality Indicators
- **High Quality**: Posts with comments and meaningful engagement
- **Community Interaction**: Posts that spark discussion about wellness
- **Educational Value**: Posts that teach breathing techniques or wellness concepts

## Lens v3 Integration Architecture

### Groups Integration
```typescript
// Fetch from wellness-focused Lens Groups
const groupPosts = await lensClient.fetchGroupPosts({
  groupIds: WELLNESS_GROUPS,
  rules: {
    contentFilter: WELLNESS_KEYWORDS,
    qualityThreshold: MIN_ENGAGEMENT
  }
});
```

### Feeds Integration  
```typescript
// Fetch from curated wellness feeds
const feedPosts = await lensClient.fetchFeedPosts({
  feedIds: WELLNESS_FEEDS,
  rules: {
    excludeKeywords: EXCLUDED_KEYWORDS,
    timeWindow: "24h"
  }
});
```

### Rules Implementation
- **Content Rules**: Filter based on wellness keywords
- **Quality Rules**: Minimum engagement requirements
- **Time Rules**: Prioritize recent content (within 24-48 hours)
- **Community Rules**: Boost content from verified wellness practitioners

## Feed Algorithm Logic

### Content Ranking Formula
```
Final Score = (Content Type Weight × 0.4) + 
              (Engagement Score × 0.3) + 
              (Recency Score × 0.2) + 
              (Quality Score × 0.1)
```

### Scoring Breakdown

1. **Content Type Weight**:
   - Our App Content: 1.0
   - Wellness Groups: 0.8  
   - Curated Feeds: 0.6
   - Keyword Filtered: 0.4

2. **Engagement Score**:
   - Reactions × 1
   - Comments × 2 (higher value for discussion)
   - Reposts × 1.5

3. **Recency Score**:
   - < 1 hour: 1.0
   - 1-6 hours: 0.8
   - 6-24 hours: 0.6
   - 1-7 days: 0.4

4. **Quality Score**:
   - Has wellness keywords: +0.3
   - Proper hashtags: +0.2
   - Good length (100-500 chars): +0.2
   - Educational content: +0.3

## Implementation Features

### Real-Time Curation
- **Live Updates**: New content appears in feed within minutes
- **Smart Deduplication**: Prevents same content from appearing multiple times
- **Dynamic Filtering**: Adjusts based on user engagement patterns

### Personalization (Future)
- **User Preferences**: Learn from user interactions
- **Breathing Pattern Affinity**: Show content related to user's preferred patterns
- **Skill Level Matching**: Beginner vs advanced content

### Community Safety
- **Spam Prevention**: Multiple quality filters
- **Content Moderation**: Community reporting system
- **Wellness Focus**: Strict keyword filtering to maintain focus

## Technical Implementation

### API Integration Points
```typescript
// 1. Group Posts
await lensClient.groups.fetchPosts(groupId, filters);

// 2. Feed Posts  
await lensClient.feeds.fetchPosts(feedId, rules);

// 3. Global Search
await lensClient.search.posts(keywords, qualityFilters);

// 4. App-Specific Content
await lensClient.posts.fetchByApp(appId, pagination);
```

### Caching Strategy
- **Group Content**: Cache for 5 minutes (semi-static)
- **Feed Content**: Cache for 2 minutes (more dynamic)
- **Keyword Results**: Cache for 10 minutes (less frequent updates)
- **Own Content**: Real-time (no caching)

### Error Handling
- **Fallback Content**: Show community welcome message if curation fails
- **Graceful Degradation**: Fall back to less specific sources if primary fails
- **User Feedback**: Clear indicators when content is limited

## Future Enhancements

### Advanced Features (Phase 2)
- **AI Content Scoring**: Use ML to better identify quality wellness content
- **Community Voting**: Let users vote on content relevance
- **Expert Verification**: Verified badges for wellness professionals
- **Seasonal Content**: Adjust for wellness trends (New Year resolutions, etc.)

### Lens v3 Feature Adoption
- **Rules Engine**: Custom rules for content filtering
- **Actions**: Interactive breathing challenges within posts
- **Sponsorships**: Promote verified wellness content creators
- **Groups Management**: Create app-specific breathing communities

## Monitoring & Analytics

### Key Metrics
- **Content Relevance**: User engagement with curated content
- **Source Distribution**: Balance between different content sources
- **Quality Score**: Average quality of curated content
- **User Retention**: Users returning to community feed

### Success Indicators
- **90%+ Wellness Content**: Maintain focus on wellness topics
- **Average 5+ Reactions**: Quality engagement threshold
- **<5% Spam Reports**: Effective content filtering
- **60%+ Daily Active Users**: Strong community engagement

## Content Guidelines for Community

### Encouraged Content
- ✅ Personal breathing session achievements
- ✅ Helpful breathing techniques and tutorials  
- ✅ Mindfulness and meditation insights
- ✅ Wellness challenges and progress updates
- ✅ Scientific articles about breathing and health
- ✅ Community support and encouragement

### Discouraged Content  
- ❌ Off-topic discussions (crypto, politics, etc.)
- ❌ Promotional content without wellness value
- ❌ Negative or controversial topics
- ❌ Spam or low-effort posts
- ❌ Medical advice without proper credentials

This curation strategy ensures our community feed remains focused, high-quality, and valuable for users on their wellness journey while leveraging the full power of Lens Protocol v3's social infrastructure.