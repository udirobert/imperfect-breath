// Demo data showcasing the instructor ecosystem
// This demonstrates how instructors create content and users consume it

export interface DemoInstructor {
  id: string;
  name: string;
  avatar?: string;
  bio: string;
  verified: boolean;
  specializations: string[];
  credentials: string[];
  yearsExperience: number;
  
  // Platform stats
  joinedDate: string;
  totalPatterns: number;
  totalStudents: number;
  totalEarnings: number; // in ETH
  monthlyEarnings: number;
  avgRating: number;
  
  // Success metrics
  successStories: string[];
  testimonials: DemoTestimonial[];
}

export interface DemoTestimonial {
  id: string;
  studentName: string;
  rating: number;
  text: string;
  benefit: string;
  timeToResult: number; // days
}

export interface DemoPattern {
  id: string;
  instructorId: string;
  name: string;
  description: string;
  category: 'stress' | 'sleep' | 'focus' | 'energy' | 'performance';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // Content
  hasVideo: boolean;
  hasAudio: boolean;
  videoUrl?: string;
  audioUrl?: string;
  duration: number; // seconds
  expectedSessionDuration: number; // minutes
  
  // Pricing & IP
  price: number;
  currency: 'ETH' | 'USDC';
  isFree: boolean;
  ipRegistered: boolean;
  ipAssetId?: string;
  
  // Performance
  totalSessions: number;
  uniqueUsers: number;
  rating: number;
  reviews: number;
  completionRate: number;
  
  // Benefits
  primaryBenefits: string[];
  successRate: number;
  avgImprovementTime: number; // days
  
  // Social
  favorites: number;
  shares: number;
  
  createdAt: string;
}

export interface DemoUserJourney {
  userId: string;
  userName: string;
  goal: string;
  patternsLicensed: string[];
  totalSpent: number;
  daysActive: number;
  benefitsAchieved: string[];
  favoriteInstructor: string;
}

// Mock Instructors
export const demoInstructors: DemoInstructor[] = [
  {
    id: "instructor_sarah",
    name: "Dr. Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b422?w=150&h=150&fit=crop&crop=face",
    bio: "Licensed therapist specializing in trauma-informed breathwork. 15+ years helping clients heal through conscious breathing.",
    verified: true,
    specializations: ["trauma-recovery", "stress-relief", "therapeutic"],
    credentials: [
      "Licensed Clinical Social Worker (LCSW)",
      "Certified Breathwork Facilitator", 
      "Trauma-Informed Yoga Instructor (200hr)"
    ],
    yearsExperience: 15,
    joinedDate: "2023-08-15",
    totalPatterns: 12,
    totalStudents: 8940,
    totalEarnings: 18.45,
    monthlyEarnings: 3.21,
    avgRating: 4.9,
    successStories: [
      "Helped 500+ clients overcome PTSD symptoms",
      "94% of students report reduced anxiety within 2 weeks",
      "Featured in Mindfulness Magazine for innovative techniques"
    ],
    testimonials: [
      {
        id: "t1",
        studentName: "Maria K.",
        rating: 5,
        text: "Dr. Chen's trauma recovery pattern literally saved my life. I've been dealing with PTSD for years and this is the first thing that actually helped.",
        benefit: "PTSD symptom reduction",
        timeToResult: 14
      }
    ]
  },
  
  {
    id: "instructor_marcus",
    name: "Marcus Torres",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    bio: "Former Navy SEAL turned performance coach. I teach the exact breathing techniques used by elite military units for peak performance.",
    verified: true,
    specializations: ["performance", "military-grade", "stress-management"],
    credentials: [
      "Former Navy SEAL (8 years active duty)",
      "Certified Performance Coach",
      "Wim Hof Method Instructor Level 2"
    ],
    yearsExperience: 12,
    joinedDate: "2023-09-02",
    totalPatterns: 8,
    totalStudents: 12340,
    totalEarnings: 24.67,
    monthlyEarnings: 4.89,
    avgRating: 4.8,
    successStories: [
      "Trained over 10,000 military personnel",
      "Techniques used by 3 Olympic teams",
      "85% improvement in stress response among corporate executives"
    ],
    testimonials: [
      {
        id: "t2",
        studentName: "Jake R.",
        rating: 5,
        text: "As a first responder, I deal with high-stress situations daily. Marcus's box breathing technique has been a game-changer for my mental resilience.",
        benefit: "Stress management",
        timeToResult: 3
      }
    ]
  },

  {
    id: "instructor_luna",
    name: "Luna Rodriguez",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face", 
    bio: "Yoga instructor and sleep specialist. I create gentle, nurturing breathing patterns that help thousands fall asleep naturally.",
    verified: true,
    specializations: ["sleep", "relaxation", "gentle-healing"],
    credentials: [
      "Yoga Teacher Training (500hr)",
      "Certified Sleep Coach",
      "Reiki Master Level II"
    ],
    yearsExperience: 10,
    joinedDate: "2023-07-20",
    totalPatterns: 15,
    totalStudents: 15620,
    totalEarnings: 15.23,
    monthlyEarnings: 2.84,
    avgRating: 4.9,
    successStories: [
      "Helped 2000+ people overcome insomnia",
      "Sleep quality improved by 85% on average",
      "Featured speaker at International Sleep Conference"
    ],
    testimonials: [
      {
        id: "t3",
        studentName: "Emily S.",
        rating: 5,
        text: "I haven't slept well in years due to anxiety. Luna's Sleep Sanctuary pattern has me falling asleep in minutes. It's incredible.",
        benefit: "Better sleep quality",
        timeToResult: 7
      }
    ]
  }
];

// Mock Patterns
export const demoPatterns: DemoPattern[] = [
  {
    id: "pattern_trauma_release",
    instructorId: "instructor_sarah",
    name: "Therapeutic Trauma Release",
    description: "A gentle, trauma-informed breathing technique developed from 15 years of clinical practice. Safely process difficult emotions and reduce PTSD symptoms.",
    category: "stress",
    difficulty: "beginner",
    hasVideo: true,
    hasAudio: true,
    videoUrl: "https://www.youtube.com/watch?v=example1",
    duration: 20000,
    expectedSessionDuration: 20,
    price: 0.15,
    currency: 'ETH',
    isFree: false,
    ipRegistered: true,
    ipAssetId: "ip_trauma_release_001",
    totalSessions: 45230,
    uniqueUsers: 3240,
    rating: 4.9,
    reviews: 1876,
    completionRate: 87,
    primaryBenefits: [
      "Reduce PTSD symptoms by 60%",
      "Process trauma safely",
      "Build emotional regulation skills"
    ],
    successRate: 89,
    avgImprovementTime: 14,
    favorites: 2341,
    shares: 567,
    createdAt: "2023-10-15T10:30:00Z"
  },

  {
    id: "pattern_seal_box",
    instructorId: "instructor_marcus",
    name: "Navy SEAL Box Breathing",
    description: "The exact 4-count breathing technique used by Navy SEALs for stress management and peak performance. Master mental resilience under pressure.",
    category: "performance",
    difficulty: "intermediate", 
    hasVideo: true,
    hasAudio: true,
    videoUrl: "https://www.youtube.com/watch?v=example2",
    duration: 16000,
    expectedSessionDuration: 10,
    price: 0.08,
    currency: 'ETH',
    isFree: false,
    ipRegistered: true,
    ipAssetId: "ip_seal_box_002",
    totalSessions: 89450,
    uniqueUsers: 8420,
    rating: 4.8,
    reviews: 3421,
    completionRate: 91,
    primaryBenefits: [
      "Reduce anxiety by 70%",
      "Improve focus within 2 minutes", 
      "Build mental resilience"
    ],
    successRate: 85,
    avgImprovementTime: 3,
    favorites: 5634,
    shares: 1245,
    createdAt: "2023-11-02T14:20:00Z"
  },

  {
    id: "pattern_sleep_sanctuary",
    instructorId: "instructor_luna",
    name: "Sleep Sanctuary Waves",
    description: "Gentle ocean-inspired breathing that mimics natural sleep rhythms. Fall asleep 3x faster with this science-backed technique.",
    category: "sleep",
    difficulty: "beginner",
    hasVideo: false,
    hasAudio: true,
    audioUrl: "https://soundcloud.com/example/sleep-sanctuary",
    duration: 24000,
    expectedSessionDuration: 15,
    price: 0.06,
    currency: 'ETH',
    isFree: false,
    ipRegistered: true,
    ipAssetId: "ip_sleep_sanctuary_003",
    totalSessions: 67890,
    uniqueUsers: 5670,
    rating: 4.9,
    reviews: 2340,
    completionRate: 95,
    primaryBenefits: [
      "Fall asleep 3x faster",
      "Improve sleep quality by 85%",
      "Reduce nighttime anxiety"
    ],
    successRate: 92,
    avgImprovementTime: 7,
    favorites: 4567,
    shares: 890,
    createdAt: "2023-09-28T20:15:00Z"
  },

  {
    id: "pattern_free_intro",
    instructorId: "instructor_sarah", 
    name: "Free Stress Relief Basics",
    description: "Perfect introduction to therapeutic breathwork. Learn the fundamentals that have helped thousands manage stress and anxiety.",
    category: "stress",
    difficulty: "beginner",
    hasVideo: true,
    hasAudio: false,
    videoUrl: "https://www.youtube.com/watch?v=free_intro",
    duration: 12000,
    expectedSessionDuration: 5,
    price: 0,
    currency: 'ETH',
    isFree: true,
    ipRegistered: false,
    totalSessions: 234560,
    uniqueUsers: 45670,
    rating: 4.6,
    reviews: 8940,
    completionRate: 88,
    primaryBenefits: [
      "Learn breathwork basics",
      "Immediate stress relief",
      "Gateway to advanced techniques"
    ],
    successRate: 78,
    avgImprovementTime: 1,
    favorites: 12340,
    shares: 3456,
    createdAt: "2023-08-20T12:00:00Z"
  }
];

// Mock User Journeys
export const demoUserJourneys: DemoUserJourney[] = [
  {
    userId: "user_001",
    userName: "Alex Chen",
    goal: "Manage work stress and anxiety",
    patternsLicensed: ["pattern_trauma_release", "pattern_seal_box"],
    totalSpent: 0.23,
    daysActive: 45,
    benefitsAchieved: [
      "Reduced daily anxiety by 60%",
      "Better stress management at work",
      "Improved sleep quality"
    ],
    favoriteInstructor: "instructor_sarah"
  },
  
  {
    userId: "user_002", 
    userName: "Maria Gonzalez",
    goal: "Overcome insomnia and sleep better",
    patternsLicensed: ["pattern_sleep_sanctuary", "pattern_free_intro"],
    totalSpent: 0.06,
    daysActive: 28,
    benefitsAchieved: [
      "Fall asleep 2x faster",
      "Wake up less during night",
      "Feel more rested in morning"
    ],
    favoriteInstructor: "instructor_luna"
  }
];

// Demo ecosystem stats
export const ecosystemStats = {
  totalInstructors: 247,
  totalPatterns: 1240,
  totalUsers: 45670,
  totalSessions: 2340000,
  totalEarnings: 156.78, // ETH
  avgSuccessRate: 86.4,
  topCategories: ["stress", "sleep", "performance", "focus"],
  monthlyGrowth: {
    instructors: 12.3,
    patterns: 18.7,
    users: 24.5,
    sessions: 31.2
  }
};

import { SimpleCache } from '../utils/cache-utils';

// Cache for instructor data
const instructorCache = SimpleCache.getInstance(100); // Use singleton cache with 100 max entries

// Real data API functions with advanced error handling, caching, and retry mechanisms
export const getInstructorById = async (id: string): Promise<DemoInstructor | undefined> => {
  // Check cache first
  const cacheKey = `instructor-${id}`;
  const cachedInstructor = instructorCache.get<DemoInstructor>(cacheKey);
  if (cachedInstructor) {
    return cachedInstructor;
  }
  
  try {
    // Try to fetch from API with retry mechanism
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/instructors/${id}`);
        
        if (response.ok) {
          const instructor = await response.json();
          // Store in cache
          instructorCache.set(cacheKey, instructor);
          return instructor;
        }
        
        // If rate limited, wait and retry
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          attempts++;
          continue;
        }
        
        // For other errors, throw
        throw new Error(`Failed to fetch instructor: ${response.statusText}`);
      } catch (attemptError) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw attemptError;
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
    
    throw new Error(`Failed to fetch instructor after ${maxAttempts} attempts`);
  } catch (error) {
    console.error(`Error fetching instructor ${id}:`, error);
    // Properly propagate the error instead of silently falling back
    throw new Error(`Failed to fetch instructor with ID ${id}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getPatternsByInstructor = async (instructorId: string): Promise<DemoPattern[]> => {
  // Check cache
  const cacheKey = `patterns-by-instructor-${instructorId}`;
  const cachedPatterns = instructorCache.get<DemoPattern[]>(cacheKey);
  if (cachedPatterns) {
    return cachedPatterns;
  }
  
  try {
    // Fetch with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/instructors/${instructorId}/patterns`);
        
        if (response.ok) {
          const patterns = await response.json();
          // Store in cache
          instructorCache.set(cacheKey, patterns);
          return patterns;
        }
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          attempts++;
          continue;
        }
        
        throw new Error(`Failed to fetch patterns: ${response.statusText}`);
      } catch (attemptError) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw attemptError;
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
    
    throw new Error(`Failed to fetch patterns after ${maxAttempts} attempts`);
  } catch (error) {
    console.error(`Error fetching patterns for instructor ${instructorId}:`, error);
    // Properly propagate the error instead of silently falling back
    throw new Error(`Failed to fetch patterns for instructor ${instructorId}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getTopPatterns = async (limit: number = 5): Promise<DemoPattern[]> => {
  // Check cache
  const cacheKey = `top-patterns-${limit}`;
  const cachedPatterns = instructorCache.get<DemoPattern[]>(cacheKey);
  if (cachedPatterns) {
    return cachedPatterns;
  }
  
  try {
    // Fetch with retry mechanism
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/patterns/top?limit=${limit}`);
        
        if (response.ok) {
          const patterns = await response.json();
          // Store in cache
          instructorCache.set(cacheKey, patterns);
          return patterns;
        }
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          attempts++;
          continue;
        }
        
        throw new Error(`Failed to fetch top patterns: ${response.statusText}`);
      } catch (attemptError) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw attemptError;
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
    
    throw new Error(`Failed to fetch top patterns after ${maxAttempts} attempts`);
  } catch (error) {
    console.error(`Error fetching top patterns:`, error);
    // Properly propagate the error instead of silently falling back
    throw new Error(`Failed to fetch top patterns: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const calculateInstructorStats = async (instructorId: string) => {
  // Check cache
  const cacheKey = `instructor-stats-${instructorId}`;
  const cachedStats = instructorCache.get(cacheKey);
  if (cachedStats) {
    return cachedStats;
  }
  
  try {
    // Fetch with retry mechanism
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/instructors/${instructorId}/stats`);
        
        if (response.ok) {
          const stats = await response.json();
          // Store in cache
          instructorCache.set(cacheKey, stats);
          return stats;
        }
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          attempts++;
          continue;
        }
        
        throw new Error(`Failed to fetch instructor stats: ${response.statusText}`);
      } catch (attemptError) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw attemptError;
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
    
    throw new Error(`Failed to fetch instructor stats after ${maxAttempts} attempts`);
  } catch (error) {
    console.error(`Error calculating instructor stats for ${instructorId}:`, error);
    // Properly propagate the error instead of silently falling back
    throw new Error(`Failed to calculate instructor stats for ${instructorId}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// New API functions to support additional features

export const searchPatterns = async (query: string, filters?: {
  category?: string;
  difficulty?: string;
  minRating?: number;
}): Promise<DemoPattern[]> => {
  const cacheKey = `search-patterns-${query}-${JSON.stringify(filters || {})}`;
  const cachedResults = instructorCache.get<DemoPattern[]>(cacheKey);
  
  if (cachedResults) {
    return cachedResults;
  }
  
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams({
      q: query
    });
    
    if (filters) {
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.difficulty) queryParams.append('difficulty', filters.difficulty);
      if (filters.minRating) queryParams.append('minRating', filters.minRating.toString());
    }
    
    const response = await fetch(`/api/patterns/search?${queryParams.toString()}`);
    
    if (response.ok) {
      const results = await response.json();
      instructorCache.set(cacheKey, results, 300); // 5 minutes
      return results;
    }
    
    throw new Error(`Search failed: ${response.statusText}`);
  } catch (error) {
    console.error(`Error searching patterns:`, error);
    // Properly propagate the error instead of silently falling back
    throw new Error(`Failed to search patterns with query '${query}': ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getEcosystemStats = async (): Promise<typeof ecosystemStats> => {
  const cacheKey = 'ecosystem-stats';
  const cachedStats = instructorCache.get<typeof ecosystemStats>(cacheKey);
  
  if (cachedStats) {
    return cachedStats;
  }
  
  try {
    const response = await fetch('/api/ecosystem/stats');
    
    if (response.ok) {
      const stats = await response.json();
      instructorCache.set(cacheKey, stats, 600); // 10 minutes
      return stats;
    }
    
    throw new Error(`Failed to fetch ecosystem stats: ${response.statusText}`);
  } catch (error) {
    console.error('Error fetching ecosystem stats:', error);
    // Properly propagate the error instead of silently falling back
    throw new Error(`Failed to fetch ecosystem stats: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getUserJourneys = async (limit: number = 5): Promise<DemoUserJourney[]> => {
  const cacheKey = `user-journeys-${limit}`;
  const cachedJourneys = instructorCache.get<DemoUserJourney[]>(cacheKey);
  
  if (cachedJourneys) {
    return cachedJourneys;
  }
  
  try {
    const response = await fetch(`/api/user-journeys?limit=${limit}`);
    
    if (response.ok) {
      const journeys = await response.json();
      instructorCache.set(cacheKey, journeys, 300); // 5 minutes
      return journeys;
    }
    
    throw new Error(`Failed to fetch user journeys: ${response.statusText}`);
  } catch (error) {
    console.error('Error fetching user journeys:', error);
    // Properly propagate the error instead of silently falling back
    throw new Error(`Failed to fetch user journeys: ${error instanceof Error ? error.message : String(error)}`);
  }
};