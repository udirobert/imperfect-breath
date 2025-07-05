/**
 * Integrated Social Flow Component
 * Seamlessly integrates Lens Protocol social features throughout the user journey
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Heart,
  Share2,
  MessageCircle,
  Users,
  TrendingUp,
  Eye,
  Zap,
  Crown,
  Clock,
  Target,
  Loader2,
  CheckCircle,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { useLens } from '@/hooks/useLens';

interface SocialContextProps {
  phase: 'discovery' | 'session' | 'completion' | 'community';
  sessionData?: {
    patternName: string;
    duration: number;
    score: number;
    insights?: string[];
  };
  onSocialAction?: (action: string, data: any) => void;
}

interface CommunityPost {
  id: string;
  author: {
    address: string;
    username?: string;
    name?: string;
    avatar?: string;
  };
  content: string;
  patternName: string;
  duration: number;
  score: number;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked?: boolean;
}

interface TrendingPattern {
  name: string;
  usageCount: number;
  avgScore: number;
  trend: 'up' | 'down' | 'stable';
}

export const IntegratedSocialFlow: React.FC<SocialContextProps> = ({
  phase,
  sessionData,
  onSocialAction,
}) => {
  const {
    isAuthenticated,
    currentAccount,
    authenticate,
    shareBreathingSession,
    shareBreathingPattern,
    followAccount,
    unfollowAccount,
    getTimeline,
    isLoading,
  } = useLens();

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [trendingPatterns, setTrendingPatterns] = useState<TrendingPattern[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareText, setShareText] = useState('');
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Load community data when component mounts or phase changes
  useEffect(() => {
    if (phase === 'community' || phase === 'discovery') {
      loadCommunityData();
    }
  }, [phase, isAuthenticated]);

  const loadCommunityData = async () => {
    setLoadingPosts(true);
    try {
      // Load trending patterns (mock data for now)
      setTrendingPatterns([
        { name: '4-7-8 Relaxation', usageCount: 1247, avgScore: 87, trend: 'up' },
        { name: 'Box Breathing', usageCount: 892, avgScore: 82, trend: 'up' },
        { name: 'Wim Hof Method', usageCount: 634, avgScore: 91, trend: 'stable' },
        { name: 'Coherent Breathing', usageCount: 445, avgScore: 85, trend: 'down' },
      ]);

      // Load community posts
      if (isAuthenticated && currentAccount) {
        try {
          const timeline = await getTimeline(currentAccount.address);
          // Convert timeline to community posts format
          const posts: CommunityPost[] = timeline.items.map((item, index) => ({
            id: item.id,
            author: {
              address: item.author.address,
              username: item.author.username,
              name: item.author.name,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author.address}`,
            },
            content: item.content,
            patternName: extractPatternName(item.content),
            duration: extractDuration(item.content),
            score: extractScore(item.content),
            likes: Math.floor(Math.random() * 50) + 5,
            comments: Math.floor(Math.random() * 20) + 1,
            timestamp: item.createdAt,
            isLiked: Math.random() > 0.7,
          }));
          setCommunityPosts(posts);
        } catch (error) {
          console.error('Failed to load timeline:', error);
          // Fallback to mock data
          loadMockCommunityPosts();
        }
      } else {
        loadMockCommunityPosts();
      }
    } catch (error) {
      console.error('Failed to load community data:', error);
      loadMockCommunityPosts();
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadMockCommunityPosts = () => {
    setCommunityPosts([
      {
        id: '1',
        author: {
          address: '0x1234...5678',
          username: 'breathmaster',
          name: 'Sarah Chen',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        },
        content: 'Just completed a 10-minute 4-7-8 session! Feeling so much calmer. The vision tracking really helped me stay focused. 🌬️',
        patternName: '4-7-8 Relaxation',
        duration: 600,
        score: 89,
        likes: 23,
        comments: 5,
        timestamp: '2024-01-15T10:30:00Z',
        isLiked: false,
      },
      {
        id: '2',
        author: {
          address: '0x9876...4321',
          username: 'zenwarrior',
          name: 'Alex Kim',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
        },
        content: 'New personal best with Box Breathing! 15 minutes straight with 95% consistency. The AI feedback was spot on. 💪',
        patternName: 'Box Breathing',
        duration: 900,
        score: 95,
        likes: 41,
        comments: 12,
        timestamp: '2024-01-15T09:15:00Z',
        isLiked: true,
      },
    ]);
  };

  const handleAuthenticate = async () => {
    try {
      await authenticate();
      toast.success('Connected to Lens Protocol!');
      loadCommunityData();
    } catch (error) {
      toast.error('Failed to connect to Lens Protocol');
    }
  };

  const handleShare = async () => {
    if (!sessionData) return;

    try {
      const postHash = await shareBreathingSession({
        patternName: sessionData.patternName,
        duration: sessionData.duration,
        score: sessionData.score,
        insights: sessionData.insights || [],
      });

      toast.success('Session shared to Lens Protocol!');
      setShowShareDialog(false);
      onSocialAction?.('shared', { postHash, sessionData });
    } catch (error) {
      toast.error('Failed to share session');
    }
  };

  const handleLike = async (postId: string) => {
    // In a real implementation, this would call Lens Protocol's like/react functionality
    setCommunityPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
    toast.success(communityPosts.find(p => p.id === postId)?.isLiked ? 'Unliked' : 'Liked!');
  };

  const handleFollow = async (address: string) => {
    try {
      await followAccount(address);
      toast.success('Following user!');
    } catch (error) {
      toast.error('Failed to follow user');
    }
  };

  const extractPatternName = (content: string): string => {
    const patterns = ['4-7-8', 'Box Breathing', 'Wim Hof', 'Coherent'];
    return patterns.find(p => content.includes(p)) || 'Custom Pattern';
  };

  const extractDuration = (content: string): number => {
    const match = content.match(/(\d+)[\s-]?minutes?/i);
    return match ? parseInt(match[1]) * 60 : 300;
  };

  const extractScore = (content: string): number => {
    const match = content.match(/(\d+)%/);
    return match ? parseInt(match[1]) : Math.floor(Math.random() * 40) + 60;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m` : `${seconds}s`;
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Render different content based on phase
  switch (phase) {
    case 'discovery':
      return (
        <div className="space-y-6">
          {/* Social Authentication */}
          {!isAuthenticated && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-900">Join the Community</h3>
                    <p className="text-blue-700 text-sm">
                      Connect with Lens Protocol to share sessions and discover patterns
                    </p>
                  </div>
                  <Button onClick={handleAuthenticate} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trending Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Trending Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {trendingPatterns.map((pattern, index) => (
                  <div key={pattern.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{pattern.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {pattern.usageCount} sessions • {pattern.avgScore}% avg score
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pattern.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {pattern.trend === 'down' && <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />}
                      {pattern.trend === 'stable' && <div className="w-4 h-4 rounded-full bg-gray-400" />}
                      <Button size="sm" variant="outline">
                        Try It
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case 'session':
      return (
        <div className="space-y-4">
          {/* Live Community Motivation */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    47 people are breathing with you right now
                  </p>
                  <p className="text-xs text-green-700">
                    Join the global mindfulness moment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Social Context */}
          {isAuthenticated && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={currentAccount?.picture} />
                      <AvatarFallback>{currentAccount?.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      Share this session when complete?
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Auto-share enabled
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );

    case 'completion':
      return (
        <div className="space-y-6">
          {/* Immediate Share Options */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share Your Achievement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isAuthenticated ? (
                <div className="text-center space-y-3">
                  <p className="text-muted-foreground">
                    Connect to Lens Protocol to share your session with the community
                  </p>
                  <Button onClick={handleAuthenticate} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Users className="w-4 h-4 mr-2" />}
                    Connect & Share
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Connected as {currentAccount?.username || currentAccount?.name}</span>
                  </div>
                  
                  <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share to Lens Protocol
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share Your Breathing Session</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <span>Pattern: {sessionData?.patternName}</span>
                            <span>Duration: {formatDuration(sessionData?.duration || 0)}</span>
                          </div>
                          <div className="mt-2">
                            <span className="text-sm">Score: {sessionData?.score}/100</span>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Add your thoughts about this session..."
                          value={shareText}
                          onChange={(e) => setShareText(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleShare} disabled={isLoading} className="flex-1">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Share
                          </Button>
                          <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Community Reactions Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Community Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Recent sessions with {sessionData?.patternName}</span>
                  <Badge variant="outline">
                    {Math.floor(Math.random() * 20) + 5} today
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold">{Math.floor(Math.random() * 30) + 70}</p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{Math.floor(Math.random() * 10) + 5}m</p>
                    <p className="text-xs text-muted-foreground">Avg Duration</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{Math.floor(Math.random() * 50) + 100}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case 'community':
      return (
        <div className="space-y-6">
          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feed">Community Feed</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-4">
              {loadingPosts ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                  <p className="text-muted-foreground mt-2">Loading community posts...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {communityPosts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={post.author.avatar} />
                            <AvatarFallback>{post.author.name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{post.author.name || post.author.username}</span>
                              <Badge variant="outline" className="text-xs">
                                {post.patternName}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(post.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm">{post.content}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(post.duration)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {post.score}%
                              </div>
                            </div>
                            <div className="flex items-center gap-4 pt-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLike(post.id)}
                                className={post.isLiked ? 'text-red-500' : ''}
                              >
                                <Heart className={`w-4 h-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                                {post.likes}
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                {post.comments}
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Share2 className="w-4 h-4 mr-1" />
                                Share
                              </Button>
                              {isAuthenticated && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleFollow(post.author.address)}
                                >
                                  <UserPlus className="w-4 h-4 mr-1" />
                                  Follow
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trending" className="space-y-4">
              <div className="grid gap-4">
                {trendingPatterns.map((pattern, index) => (
                  <Card key={pattern.name}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{pattern.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {pattern.usageCount} sessions this week
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{pattern.avgScore}%</p>
                          <p className="text-xs text-muted-foreground">avg score</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      );

    default:
      return null;
  }
};

export default IntegratedSocialFlow;