import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useLens } from '../hooks/useLens';
import type { Post, Account, SocialActionResult } from '../lib/lens/types';

// Define the TimelineItem interface that useLensFeed expects
export interface TimelineItem {
  id: string;
  contentURI?: string;
  profileId?: string;
  pubId?: string;
  content?: string;
  createdAt?: string;
  profile?: {
    id: string;
    name?: string;
    handle: string;
    picture?: string;
  };
  stats?: {
    comments: number;
    mirrors: number;
    reactions: number;
  };
}

// Define the context interface that useLensFeed expects
interface LensContextType {
  isAuthenticated: boolean;
  timeline: TimelineItem[];
  fetchTimeline: (options?: {
    contentFocus?: string[];
    tags?: string[];
  }) => Promise<void>;
  fetchBreathingContent: () => Promise<void>;
  isLoading: boolean;
  currentAccount: Account | null;
  authenticate: (address?: string) => Promise<SocialActionResult>;
  logout: () => Promise<void>;
}

const LensContext = createContext<LensContextType | undefined>(undefined);

interface LensProviderProps {
  children: ReactNode;
}

export const LensProvider: React.FC<LensProviderProps> = ({ children }) => {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use the existing useLens hook for core functionality
  const {
    isAuthenticated,
    currentAccount,
    authenticate,
    logout,
    timeline: lensTimeline,
    loadTimeline,
    isLoadingTimeline,
  } = useLens();

  // Convert Lens Post objects to TimelineItem format
  const convertPostsToTimelineItems = useCallback((posts: Post[]): TimelineItem[] => {
    return posts.map(post => ({
      id: post.id,
      contentURI: post.content || '',
      profileId: post.author?.id || '',
      pubId: post.id,
      content: post.metadata?.content || post.content || '',
      createdAt: post.timestamp || new Date().toISOString(),
      profile: {
        id: post.author?.id || '',
        name: post.author?.metadata?.name,
        handle: post.author?.username?.fullHandle || 'unknown',
        picture: post.author?.metadata?.picture,
      },
      stats: {
        comments: post.stats?.comments || 0,
        mirrors: post.stats?.reposts || 0,
        reactions: post.stats?.reactions || 0,
      },
    }));
  }, []);

  // Fetch timeline with optional filtering
  const fetchTimeline = useCallback(async (options?: {
    contentFocus?: string[];
    tags?: string[];
  }) => {
    setIsLoading(true);
    try {
      await loadTimeline(true); // Refresh timeline
      // The timeline will be updated via the effect below
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadTimeline]);

  // Fetch breathing-specific content
  const fetchBreathingContent = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadTimeline(true); // For now, use the same timeline loading
      // In a real implementation, this would filter for breathing-specific content
    } catch (error) {
      console.error('Failed to fetch breathing content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadTimeline]);

  // Update timeline when lensTimeline changes
  useEffect(() => {
    if (lensTimeline && lensTimeline.length > 0) {
      const timelineItems = convertPostsToTimelineItems(lensTimeline);
      setTimeline(timelineItems);
    } else {
      setTimeline([]);
    }
  }, [lensTimeline, convertPostsToTimelineItems]);

  // Update loading state when lens loading state changes
  useEffect(() => {
    setIsLoading(isLoadingTimeline);
  }, [isLoadingTimeline]);

  const contextValue: LensContextType = {
    isAuthenticated,
    timeline,
    fetchTimeline,
    fetchBreathingContent,
    isLoading,
    currentAccount,
    authenticate,
    logout,
  };

  return (
    <LensContext.Provider value={contextValue}>
      {children}
    </LensContext.Provider>
  );
};

export const useLensContext = (): LensContextType => {
  const context = useContext(LensContext);
  if (context === undefined) {
    throw new Error('useLensContext must be used within a LensProvider');
  }
  return context;
};

export default LensProvider;