import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useLensService } from '@/hooks/useLensService';
import { useLensFeed } from '@/hooks/useLensFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Clock, 
  Activity, 
  Users, 
  TrendingUp,
  Search,
  Filter,
  Loader2,
  Wind,
  Star,
  Calendar,
  User
} from 'lucide-react';
import { WalletConnection } from '@/components/wallet/WalletConnection';
import { BreathingSessionPost } from '@/components/social/BreathingSessionPost';
import { SocialActions } from '@/components/social/SocialActions';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface CommunityStats {
  totalSessions: number;
  activeUsers: number;
  totalMinutes: number;
  topPattern: string;
}

const CommunityFeed: React.FC = () => {
  const { isConnected } = useAccount();
  const { isAuthenticated, profile, authenticate } = useLensService();
  const { posts, isLoading, error, refreshFeed } = useLensFeed();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [communityStats, setCommunityStats] = useState<CommunityStats>({
    totalSessions: 1247,
    activeUsers: 89,
    totalMinutes: 15680,
    topPattern: '4-7-8 Breathing'
  });

  useEffect(() => {
    if (isAuthenticated) {
      refreshFeed();
    }
  }, [isAuthenticated, refreshFeed]);

  const handleConnect = async () => {
    try {
      await authenticate();
      toast.success('Connected to Lens Protocol!');
    } catch (error) {
      toast.error('Failed to connect to Lens Protocol');
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery === '' || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'following' && post.isFollowing) ||
      (selectedFilter === 'trending' && post.likes > 10);
    
    return matchesSearch && matchesFilter;
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <Wind className="w-16 h-16 mx-auto text-primary" />
            <h1 className="text-3xl font-bold">Community Feed</h1>
            <p className="text-muted-foreground">
              Connect your wallet to join the breathing community and share your mindfulness journey.
            </p>
          </div>
          <WalletConnection />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <Users className="w-16 h-16 mx-auto text-primary" />
            <h1 className="text-3xl font-bold">Join the Community</h1>
            <p className="text-muted-foreground">
              Authenticate with Lens Protocol to share your breathing sessions and connect with other practitioners.
            </p>
          </div>
          <Button onClick={handleConnect} size="lg">
            Connect to Lens Protocol
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Community Feed</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Share your mindfulness journey and discover breathing sessions from practitioners around the world.
        </p>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{communityStats.totalSessions.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{communityStats.activeUsers}</div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{(communityStats.totalMinutes / 60).toFixed(0)}h</div>
            <div className="text-sm text-muted-foreground">Mindful Hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary truncate">{communityStats.topPattern}</div>
            <div className="text-sm text-muted-foreground">Top Pattern</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search sessions, users, or patterns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={selectedFilter} onValueChange={setSelectedFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Feed Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading community feed...</p>
            </div>
          ) : error ? (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <Wind className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No sessions found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search terms' : 'Be the first to share a breathing session!'}
                </p>
              </div>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <BreathingSessionPost
                key={post.id}
                post={post}
                onLike={() => {/* Handle like */}}
                onComment={() => {/* Handle comment */}}
                onShare={() => {/* Handle share */}}
              />
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Profile Card */}
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback>{profile.displayName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{profile.displayName || 'Anonymous'}</div>
                    <div className="text-sm text-muted-foreground">@{profile.username}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold">12</div>
                    <div className="text-xs text-muted-foreground">Sessions</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">45</div>
                    <div className="text-xs text-muted-foreground">Followers</div>
                  </div>
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
            <CardContent className="space-y-3">
              {[
                { name: '4-7-8 Breathing', sessions: 234, trend: '+12%' },
                { name: 'Box Breathing', sessions: 189, trend: '+8%' },
                { name: 'Wim Hof Method', sessions: 156, trend: '+15%' },
                { name: 'Coherent Breathing', sessions: 98, trend: '+5%' }
              ].map((pattern, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{pattern.name}</div>
                    <div className="text-xs text-muted-foreground">{pattern.sessions} sessions</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {pattern.trend}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { user: 'Sarah M.', action: 'completed a 15-minute session', time: '2 hours ago' },
                { user: 'Alex K.', action: 'shared their breathing journey', time: '4 hours ago' },
                { user: 'Maya P.', action: 'reached a 7-day streak', time: '6 hours ago' },
                { user: 'David L.', action: 'created a custom pattern', time: '8 hours ago' }
              ].map((activity, index) => (
                <div key={index} className="text-sm space-y-1">
                  <div>
                    <span className="font-medium">{activity.user}</span> {activity.action}
                  </div>
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommunityFeed;