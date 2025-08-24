/**
 * Desktop Social Create - Enhanced Social Post Creation for Desktop
 * 
 * ENHANCEMENT FIRST: Builds on MobileSocialCreate with desktop-specific optimizations
 * CLEAN: Separates desktop layout logic from mobile touch logic
 * MODULAR: Reuses PersonalizedTemplates and social logic
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Share2, 
  Camera, 
  Image, 
  Heart, 
  Target, 
  Clock, 
  Zap,
  Users,
  Trophy,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Calendar,
  TrendingUp,
  Download,
  Copy,
  ExternalLink,
  Palette,
  Edit3,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Maximize2,
  Calendar as CalendarIcon,
  Send,
  FileImage,
  Type,
  Hash,
  AtSign,
  Link2,
  BarChart,
  Settings2
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useSessionHistory } from "../../hooks/useSessionHistory";
import { PersonalizedTemplates } from "../../lib/social/PersonalizedTemplates";

interface SessionStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  favoritePattern: string;
  lastSessionScore: number;
  weeklyGoalProgress: number;
}

interface DesktopSocialCreateProps {
  onClose?: () => void;
  prefilledStats?: Partial<SessionStats>;
  mode?: "modal" | "page";
}

export const DesktopSocialCreate: React.FC<DesktopSocialCreateProps> = ({
  onClose,
  prefilledStats,
  mode = "modal"
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { history } = useSessionHistory();
  const [postText, setPostText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [activeTab, setActiveTab] = useState("templates");
  const [isSharing, setIsSharing] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["lens"]);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [postSettings, setPostSettings] = useState({
    includeStats: true,
    includeImage: false,
    autoHashtags: true,
    crossPost: false
  });

  // Calculate user stats (DRY: reuse mobile logic)
  const stats: SessionStats = {
    totalSessions: history.length,
    totalMinutes: Math.round(history.reduce((sum, session) => sum + (session.duration || 0), 0) / 60),
    currentStreak: calculateStreak(),
    favoritePattern: getMostUsedPattern(),
    lastSessionScore: history[0]?.score || 0,
    weeklyGoalProgress: calculateWeeklyProgress(),
    ...prefilledStats
  };

  function calculateStreak(): number {
    const today = new Date().toDateString();
    let streak = 0;
    const sortedHistory = [...history].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    for (let i = 0; i < sortedHistory.length; i++) {
      const sessionDate = new Date(sortedHistory[i].timestamp).toDateString();
      const expectedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toDateString();
      if (sessionDate === expectedDate) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  function getMostUsedPattern(): string {
    const patternCounts = history.reduce((counts, session) => {
      const pattern = session.patternName || "Box Breathing";
      counts[pattern] = (counts[pattern] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return Object.entries(patternCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || "Box Breathing";
  }

  function calculateWeeklyProgress(): number {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekSessions = history.filter(session => 
      new Date(session.timestamp).getTime() > weekAgo
    );
    return Math.min(100, (weekSessions.length / 7) * 100);
  }

  // MODULAR: Reuse PersonalizedTemplates service
  const personalizedTemplates = PersonalizedTemplates.generateTemplates(stats);

  const platformOptions = [
    { id: "lens", name: "Lens Protocol", icon: Users, color: "bg-green-50 border-green-200" },
    { id: "twitter", name: "Twitter/X", icon: Share2, color: "bg-blue-50 border-blue-200" },
    { id: "linkedin", name: "LinkedIn", icon: Users, color: "bg-blue-50 border-blue-200" },
    { id: "instagram", name: "Instagram", icon: Camera, color: "bg-pink-50 border-pink-200" }
  ];

  const handleTemplateSelect = (templateId: string) => {
    const template = personalizedTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setPostText(template.template);
    }
  };

  const handleShare = async () => {
    if (!user) {
      navigate("/auth?context=social");
      return;
    }

    setIsSharing(true);
    try {
      // Desktop-specific sharing logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onClose) {
        onClose();
      } else {
        navigate("/community");
      }
    } catch (error) {
      console.error("Sharing failed:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(postText);
  };

  const handleDownloadImage = () => {
    // Desktop-specific: Generate and download stat card image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#f0f9ff');
    gradient.addColorStop(1, '#e0e7ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Add stats text
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('My Breathing Journey', 50, 80);

    ctx.font = '24px Arial';
    ctx.fillText(`${stats.totalSessions} Sessions Completed`, 50, 150);
    ctx.fillText(`${stats.totalMinutes} Minutes of Practice`, 50, 200);
    ctx.fillText(`${stats.currentStreak} Day Streak`, 50, 250);
    ctx.fillText(`Favorite: ${stats.favoritePattern}`, 50, 300);

    // Download the image
    const link = document.createElement('a');
    link.download = 'breathing-stats.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleSchedulePost = () => {
    // Desktop-specific: Schedule post for later
    console.log("Scheduling post for later...");
  };

  const handleAdvancedEdit = () => {
    // Desktop-specific: Open advanced editor
    console.log("Opening advanced editor...");
  };

  const containerClass = mode === "modal"
    ? "max-w-6xl mx-auto"
    : "min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8";

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Share Your Wellness Journey</h1>
          <p className="text-muted-foreground">Create engaging posts about your breathing practice</p>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Stats & Templates */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stats Overview */}
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">{stats.totalSessions}</div>
                  <div className="text-sm text-green-600">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">{stats.totalMinutes}min</div>
                  <div className="text-sm text-blue-600">Practice Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-700">{stats.currentStreak}</div>
                  <div className="text-sm text-orange-600">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-700">{Math.round(stats.weeklyGoalProgress)}%</div>
                  <div className="text-sm text-purple-600">Weekly Goal</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Smart Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {personalizedTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate === template.id ? template.color : "bg-white"
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${template.color} flex items-center justify-center`}>
                        {template.icon === "Trophy" && <Trophy className="h-5 w-5" />}
                        {template.icon === "Sparkles" && <Sparkles className="h-5 w-5" />}
                        {template.icon === "TrendingUp" && <TrendingUp className="h-5 w-5" />}
                        {template.icon === "Heart" && <Heart className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{template.title}</h4>
                        <Badge variant="outline" className="text-xs mt-1">
                          {template.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Editor & Sharing */}
        <div className="lg:col-span-2 space-y-6">
          {/* Advanced Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={isAdvancedMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
              >
                <Settings2 className="h-4 w-4 mr-2" />
                Advanced Mode
              </Button>
              <Button
                variant={showPreview ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? "Hide" : "Show"} Preview
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyText}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadImage}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className={`grid w-full ${isAdvancedMode ? 'grid-cols-5' : 'grid-cols-3'}`}>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="platforms">Platforms</TabsTrigger>
              {isAdvancedMode && (
                <>
                  <TabsTrigger value="scheduling">Schedule</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg min-h-[200px]">
                    {selectedTemplate ? (
                      <div className="whitespace-pre-wrap text-sm">
                        {personalizedTemplates.find(t => t.id === selectedTemplate)?.template}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        Select a template to preview
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="editor" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Customize Your Post</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyText}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownloadImage}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Card
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Share your breathing journey..."
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                  
                  {/* Media options */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Add Photo
                    </Button>
                    <Button variant="outline" size="sm">
                      <Image className="h-4 w-4 mr-2" />
                      Stats Card
                    </Button>
                    <Button variant="outline" size="sm">
                      <Palette className="h-4 w-4 mr-2" />
                      Custom Design
                    </Button>
                  </div>

                  {/* Character count */}
                  <div className="text-right text-sm text-muted-foreground">
                    {postText.length} characters
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="platforms" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Choose Platforms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {platformOptions.map((platform) => {
                      const Icon = platform.icon;
                      const isSelected = selectedPlatforms.includes(platform.id);
                      
                      return (
                        <Card 
                          key={platform.id}
                          className={`cursor-pointer transition-all ${
                            isSelected ? platform.color : "bg-white hover:bg-gray-50"
                          }`}
                          onClick={() => {
                            setSelectedPlatforms(prev => 
                              isSelected 
                                ? prev.filter(p => p !== platform.id)
                                : [...prev, platform.id]
                            );
                          }}
                        >
                          <CardContent className="p-4 text-center">
                            <Icon className="h-8 w-8 mx-auto mb-2" />
                            <h4 className="font-medium">{platform.name}</h4>
                            {isSelected && (
                              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mt-2" />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Platform Tips</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Lens Protocol: Best for wellness community engagement</li>
                      <li>• Twitter/X: Great for quick updates and tips</li>
                      <li>• LinkedIn: Professional wellness content</li>
                      <li>• Instagram: Visual stories and progress photos</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Mode: Scheduling Tab */}
            {isAdvancedMode && (
              <TabsContent value="scheduling" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Schedule Post
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Schedule Date</label>
                        <input
                          type="datetime-local"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Time Zone</label>
                        <select className="w-full px-3 py-2 border rounded-md">
                          <option>Local Time</option>
                          <option>UTC</option>
                          <option>EST</option>
                          <option>PST</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Optimal Posting Times</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                        <div>
                          <p className="font-medium">Weekdays</p>
                          <p>7-9 AM, 12-1 PM, 5-7 PM</p>
                        </div>
                        <div>
                          <p className="font-medium">Weekends</p>
                          <p>9-11 AM, 2-4 PM</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleSchedulePost}>
                        <Timer className="h-4 w-4 mr-2" />
                        Schedule for Later
                      </Button>
                      <Button variant="outline">
                        <Send className="h-4 w-4 mr-2" />
                        Send Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Advanced Mode: Analytics Tab */}
            {isAdvancedMode && (
              <TabsContent value="analytics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      Post Analytics & Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">85%</p>
                        <p className="text-sm text-green-700">Engagement Score</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">12</p>
                        <p className="text-sm text-blue-700">Optimal Hashtags</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">3.2k</p>
                        <p className="text-sm text-purple-700">Est. Reach</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Content Optimization Suggestions</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Good use of personal stats</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Optimal post length</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span>Consider adding 2-3 more hashtags</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Info className="h-4 w-4 text-blue-500" />
                          <span>Add a call-to-action for better engagement</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Trending Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {["#MindfulBreathing", "#StressRelief", "#WellnessJourney", "#Meditation", "#SelfCare"].map((tag) => (
                          <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-blue-50">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Share Actions */}
          <div className="flex gap-4">
            <Button 
              onClick={handleShare}
              disabled={isSharing || !postText.trim() || selectedPlatforms.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {isSharing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sharing to {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share to {selectedPlatforms.length} Platform{selectedPlatforms.length > 1 ? 's' : ''}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            <Button variant="outline" size="lg">
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>

          {!user && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4 text-center">
                <h4 className="font-medium text-yellow-800 mb-2">Sign in to share</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Connect your account to share with the wellness community
                </p>
                <Button onClick={() => navigate("/auth?context=social")}>
                  Sign In
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Community Preview */}
      <Card className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-purple-800 mb-2">Join the Wellness Community</h3>
          <p className="text-purple-700 mb-4">
            Connect with {Math.floor(Math.random() * 5000 + 15000).toLocaleString()}+ mindful breathers worldwide
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              variant="outline" 
              onClick={() => navigate("/community")}
              className="border-purple-300 text-purple-700"
            >
              Explore Community
            </Button>
            <Button 
              onClick={() => navigate("/instructor-onboarding")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Become Instructor
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesktopSocialCreate;