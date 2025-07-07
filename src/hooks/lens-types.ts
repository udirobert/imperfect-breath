// Type definitions to avoid importing directly from JSX files

export interface LensAccount {
  id: string;
  handle: string;
  address: string;
  // Add other properties as needed
}

export interface LensAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TimelineItem {
  id?: string;
  profileId?: string | number;
  pubId?: string | number;
  contentURI?: string;
  content?: string;
  createdAt?: string;
  profile?: {
    id?: string;
    name?: string;
    handle?: string;
    picture?: string;
  };
  stats?: {
    comments?: number;
    mirrors?: number;
    reactions?: number;
  };
}

export interface LensContextType {
  // Authentication
  isAuthenticated: boolean;
  currentAccount: LensAccount | null;
  availableAccounts: LensAccount[];
  authTokens: LensAuthTokens | null;
  isLoading: boolean;
  error: string | null;

  // Timeline
  timeline: TimelineItem[];
  highlights: any[];
  fetchTimeline: (filters?: { contentFocus?: string[]; tags?: string[] }) => Promise<void>;
  fetchHighlights: () => Promise<void>;
  fetchBreathingContent: () => Promise<void>;

  // Other props and methods as needed
  clearError: () => void;
}