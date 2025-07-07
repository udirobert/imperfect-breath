import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Users,
  MessageCircle,
  Share,
  Heart,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  Send,
} from "lucide-react";
import { useLensContext } from "../../providers/LensProvider";
import { useAccount } from "wagmi";
import { toast } from "../../hooks/use-toast";

export const LensSocialHub: React.FC = () => {
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [postContent, setPostContent] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("");

  const { address } = useAccount();
  const {
    isAuthenticated,
    currentAccount,
    availableAccounts,
    isLoading,
    error,
    authenticate,
    logout,
    loadAvailableAccounts,
    postBreathingSession,
    shareBreathingPattern,
    commentOnPost,
    timeline,
    highlights,
    fetchBreathingContent,
    isPosting,
    isCommenting,
    clearError,
  } = useLensContext();

  const handleAuthenticate = async () => {
    if (!selectedAccount) {
      toast({
        title: "No account selected",
        description: "Please select a Lens account to authenticate with.",
        variant: "destructive",
      });
      return;
    }

    try {
      await authenticate(selectedAccount);
      toast({
        title: "Connected to Lens!",
        description: "You can now share your breathing sessions socially.",
      });
    } catch (err) {
      toast({
        title: "Authentication failed",
        description:
          err instanceof Error ? err.message : "Failed to connect to Lens",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Lens.",
      });
    } catch (err) {
      toast({
        title: "Logout failed",
        description: "Failed to disconnect from Lens",
        variant: "destructive",
      });
    }
  };

  const handlePostSession = async () => {
    if (!postContent.trim()) {
      toast({
        title: "Empty post",
        description:
          "Please enter some content for your breathing session post.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a sample breathing session post
      const sessionData = {
        patternName: "4-7-8 Relaxation",
        duration: 300, // 5 minutes
        score: 85,
        insights: [
          "Improved focus during the session",
          "Felt more relaxed afterwards",
          "Breathing rhythm became more natural",
        ],
      };

      const postHash = await postBreathingSession(sessionData);
      setPostContent("");

      toast({
        title: "Session shared!",
        description: `Your breathing session has been posted to Lens. Hash: ${postHash.slice(
          0,
          10
        )}...`,
      });

      // Refresh timeline
      await fetchBreathingContent();
    } catch (err) {
      toast({
        title: "Post failed",
        description:
          err instanceof Error ? err.message : "Failed to share session",
        variant: "destructive",
      });
    }
  };

  const handleSharePattern = async () => {
    try {
      const patternData = {
        name: "Custom Box Breathing",
        description:
          "A personalized 4-4-4-4 breathing pattern for focus and calm",
        nftId: "123456",
        contractAddress: "0x1234567890abcdef",
        imageUri: "https://example.com/pattern-image.png",
      };

      const postHash = await shareBreathingPattern(patternData);

      toast({
        title: "Pattern shared!",
        description: `Your breathing pattern NFT has been shared on Lens. Hash: ${postHash.slice(
          0,
          10
        )}...`,
      });

      // Refresh timeline
      await fetchBreathingContent();
    } catch (err) {
      toast({
        title: "Share failed",
        description:
          err instanceof Error ? err.message : "Failed to share pattern",
        variant: "destructive",
      });
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim() || !selectedPostId) {
      toast({
        title: "Missing information",
        description: "Please select a post and enter a comment.",
        variant: "destructive",
      });
      return;
    }

    try {
      const commentHash = await commentOnPost(selectedPostId, commentContent);
      setCommentContent("");
      setSelectedPostId("");

      toast({
        title: "Comment posted!",
        description: `Your comment has been added. Hash: ${commentHash.slice(
          0,
          10
        )}...`,
      });
    } catch (err) {
      toast({
        title: "Comment failed",
        description:
          err instanceof Error ? err.message : "Failed to post comment",
        variant: "destructive",
      });
    }
  };

  if (!address) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lens Social Hub
          </CardTitle>
          <CardDescription>
            Connect your wallet to access Lens Protocol social features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Wallet connection required for Lens social features
            </p>
            <Badge variant="outline">Connect Wallet to Continue</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Lens Social Hub
          </CardTitle>
          <CardDescription>
            Share your breathing journey and connect with the wellness community
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Authentication Section */}
      <Card>
        <CardHeader>
          <CardTitle>Lens Authentication</CardTitle>
          <CardDescription>
            Connect your Lens account to share breathing sessions socially
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAuthenticated ? (
            <div className="space-y-4">
              {availableAccounts.length > 0 ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Select Lens Account
                    </label>
                    <div className="grid gap-2">
                      {availableAccounts.map((account) => (
                        <div
                          key={account.address}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedAccount === account.address
                              ? "border-green-500 bg-green-50 dark:bg-green-950"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedAccount(account.address)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={account.picture} />
                              <AvatarFallback>
                                {account.name?.charAt(0) ||
                                  account.address.slice(2, 4).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {account.name ||
                                  account.username ||
                                  "Unnamed Account"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {account.address.slice(0, 8)}...
                                {account.address.slice(-6)}
                              </p>
                            </div>
                            {selectedAccount === account.address && (
                              <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handleAuthenticate}
                    disabled={!selectedAccount || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      "Connect to Lens"
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    No Lens accounts found for this wallet
                  </p>
                  <Button
                    onClick={loadAvailableAccounts}
                    disabled={isLoading}
                    variant="outline"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Refresh Accounts"
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={currentAccount?.picture} />
                  <AvatarFallback>
                    {currentAccount?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {currentAccount?.name ||
                      currentAccount?.username ||
                      "Connected Account"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentAccount?.address.slice(0, 8)}...
                    {currentAccount?.address.slice(-6)}
                  </p>
                </div>
                <Badge variant="default">Connected</Badge>
              </div>
              <Button onClick={handleLogout} variant="outline">
                Disconnect
              </Button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <Button
                onClick={clearError}
                variant="ghost"
                size="sm"
                className="ml-auto"
              >
                Dismiss
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Features */}
      {isAuthenticated && (
        <Tabs defaultValue="post" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="post">Share Session</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="interact">Interact</TabsTrigger>
          </TabsList>

          <TabsContent value="post" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share className="h-4 w-4" />
                  Share Your Breathing Journey
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={handlePostSession}
                    disabled={isPosting}
                    className="h-20 flex-col"
                  >
                    {isPosting ? (
                      <Loader2 className="h-6 w-6 animate-spin mb-2" />
                    ) : (
                      <MessageCircle className="h-6 w-6 mb-2" />
                    )}
                    Share Breathing Session
                  </Button>

                  <Button
                    onClick={handleSharePattern}
                    disabled={isPosting}
                    variant="outline"
                    className="h-20 flex-col"
                  >
                    {isPosting ? (
                      <Loader2 className="h-6 w-6 animate-spin mb-2" />
                    ) : (
                      <Heart className="h-6 w-6 mb-2" />
                    )}
                    Share Pattern NFT
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Breathing Community Timeline
                </CardTitle>
                <CardDescription>
                  See what the wellness community is sharing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={fetchBreathingContent}
                  disabled={isLoading}
                  className="mb-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Refresh Timeline"
                  )}
                </Button>

                {timeline.length > 0 ? (
                  <div className="space-y-4">
                    {timeline.slice(0, 5).map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Timeline item {index + 1} - Content would be displayed
                          here
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No timeline content available. Share your first breathing
                    session!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Engage with Community
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Post ID to Comment On
                  </label>
                  <input
                    type="text"
                    value={selectedPostId}
                    onChange={(e) => setSelectedPostId(e.target.value)}
                    placeholder="Enter post ID..."
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Your Comment
                  </label>
                  <Textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Share your thoughts on this breathing session..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleComment}
                  disabled={
                    isCommenting || !commentContent.trim() || !selectedPostId
                  }
                  className="w-full"
                >
                  {isCommenting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting Comment...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Post Comment
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default LensSocialHub;
