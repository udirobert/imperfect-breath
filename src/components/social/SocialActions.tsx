import React, { useState } from "react";
import {
  Heart,
  Share2,
  MessageCircle,
  Bookmark,
  Flag,
  Users,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { useToast } from "../../hooks/use-toast";
import type { CustomPattern } from "../../lib/patternStorage";

interface SocialActionsProps {
  pattern: CustomPattern & {
    likes?: number;
    shares?: number;
    comments?: number;
    bookmarks?: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
  };
  onLike: (patternId: string) => Promise<void>;
  onShare: (pattern: CustomPattern) => Promise<void>;
  onComment: (patternId: string, comment: string) => Promise<void>;
  onBookmark: (patternId: string) => Promise<void>;
  onReport: (patternId: string, reason: string) => Promise<void>;
  showCounts?: boolean;
  compact?: boolean;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
}

export const SocialActions: React.FC<SocialActionsProps> = ({
  pattern,
  onLike,
  onShare,
  onComment,
  onBookmark,
  onReport,
  showCounts = true,
  compact = false,
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const { toast } = useToast();

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike(pattern.id);
      toast({
        title: pattern.isLiked ? "Removed from likes" : "Added to likes",
        description: pattern.isLiked
          ? "Pattern removed from your likes"
          : "Pattern added to your likes",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      await onShare(pattern);
      setShowShareDialog(false);
      toast({
        title: "Pattern shared!",
        description: "The breathing pattern has been shared successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share pattern",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleBookmark = async () => {
    if (isBookmarking) return;
    setIsBookmarking(true);
    try {
      await onBookmark(pattern.id);
      toast({
        title: pattern.isBookmarked
          ? "Removed from bookmarks"
          : "Added to bookmarks",
        description: pattern.isBookmarked
          ? "Pattern removed from your bookmarks"
          : "Pattern saved to your bookmarks",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bookmark status",
        variant: "destructive",
      });
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      await onComment(pattern.id, newComment);

      // Refresh comments from API instead of manually adding
      setIsLoadingComments(true);
      const response = await fetch(`/api/patterns/${pattern.id}/comments`);
      if (!response.ok) {
        throw new Error("Failed to refresh comments");
      }
      const updatedComments = await response.json();
      setComments(updatedComments);

      setNewComment("");
      toast({
        title: "Comment added!",
        description: "Your comment has been posted",
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    try {
      await onReport(pattern.id, reportReason);
      setShowReportDialog(false);
      setReportReason("");
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive",
      });
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const buttonSize = compact ? "sm" : "default";
  const iconSize = compact ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex items-center gap-2">
      {/* Like Button */}
      <Button
        variant={pattern.isLiked ? "default" : "ghost"}
        size={buttonSize}
        onClick={handleLike}
        disabled={isLiking}
        className="flex items-center gap-1"
      >
        <Heart
          className={`${iconSize} ${pattern.isLiked ? "fill-current" : ""}`}
        />
        {showCounts && <span>{formatCount(pattern.likes || 0)}</span>}
      </Button>

      {/* Comment Button */}
      <Dialog
        open={showComments}
        onOpenChange={(open) => {
          setShowComments(open);
          if (open) {
            // Fetch comments when dialog opens
            setIsLoadingComments(true);
            fetch(`/api/patterns/${pattern.id}/comments`)
              .then((response) => {
                if (!response.ok) {
                  throw new Error("Failed to fetch comments");
                }
                return response.json();
              })
              .then((data) => {
                setComments(data);
              })
              .catch((error) => {
                console.error("Error fetching comments:", error);
                toast({
                  title: "Error",
                  description: "Failed to load comments",
                  variant: "destructive",
                });
              })
              .finally(() => {
                setIsLoadingComments(false);
              });
          }
        }}
      >
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size={buttonSize}
            className="flex items-center gap-1"
          >
            <MessageCircle className={iconSize} />
            {showCounts && <span>{formatCount(pattern.comments || 0)}</span>}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add Comment */}
            <div className="space-y-2">
              <Textarea
                placeholder="Share your thoughts about this pattern..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
              />
              <Button onClick={handleComment} disabled={!newComment.trim()}>
                Post Comment
              </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {isLoadingComments ? (
                <div className="text-center py-8">
                  <p>Loading comments...</p>
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="border-b pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-semibold">
                          {comment.userName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {comment.userName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                          >
                            <Heart className="h-3 w-3 mr-1" />
                            {comment.likes}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Button */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size={buttonSize}
            className="flex items-center gap-1"
          >
            <Share2 className={iconSize} />
            {showCounts && <span>{formatCount(pattern.shares || 0)}</span>}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Pattern</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold">{pattern.name}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {pattern.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: pattern.name,
                      text: pattern.description,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
              >
                Native Share
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const url = `${window.location.origin}/marketplace/${pattern.id}`;
                  navigator.clipboard.writeText(url);
                  toast({
                    title: "Link copied!",
                    description: "Pattern link copied to clipboard",
                  });
                }}
              >
                Copy Link
              </Button>
            </div>

            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full"
            >
              {isSharing ? "Sharing..." : "Share to Community"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bookmark Button */}
      <Button
        variant={pattern.isBookmarked ? "default" : "ghost"}
        size={buttonSize}
        onClick={handleBookmark}
        disabled={isBookmarking}
        className="flex items-center gap-1"
      >
        <Bookmark
          className={`${iconSize} ${
            pattern.isBookmarked ? "fill-current" : ""
          }`}
        />
        {!compact && <span>Save</span>}
      </Button>

      {/* Report Button */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogTrigger asChild>
          <Button variant="ghost" size={buttonSize}>
            <Flag className={iconSize} />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report Pattern</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Help us keep the community safe by reporting inappropriate
              content.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason for reporting:
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select a reason</option>
                <option value="spam">Spam or misleading</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="copyright">Copyright violation</option>
                <option value="safety">Safety concerns</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReportDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReport}
                disabled={!reportReason}
                variant="destructive"
                className="flex-1"
              >
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Usage Stats Badge */}
      {showCounts && !compact && (
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>
            {formatCount((pattern.likes || 0) + (pattern.shares || 0))}{" "}
            interactions
          </span>
        </div>
      )}
    </div>
  );
};
