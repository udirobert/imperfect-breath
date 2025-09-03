/**
 * Unified Social Button Component
 * 
 * AGGRESSIVE CONSOLIDATION: Replaces ActionButton, CommentButton, FollowButton, RepostButton
 * DRY: Single source of truth for all social interactions
 * MODULAR: Composable with different action types
 * CLEAN: Clear separation of concerns with explicit dependencies
 */

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import {
  ThumbsUp,
  Star,
  CircleDollarSign,
  MessageSquare,
  Plus,
  X,
  Repeat2,
  Heart,
  Share2,
  Bookmark,
  Flag,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useLens } from "../../hooks/useLens";
import { useAction } from "../../hooks/useAction";

// Unified action types
export type SocialActionType = 
  | "collect" 
  | "like" 
  | "react" 
  | "comment" 
  | "follow" 
  | "unfollow" 
  | "repost"
  | "share"
  | "bookmark"
  | "report";

interface SocialButtonProps {
  actionType: SocialActionType;
  targetId: string; // postId, userId, patternId, etc.
  actionParams?: any;
  className?: string;
  variant?: "default" | "ghost" | "outline" | "destructive";
  size?: "sm" | "default" | "lg";
  showCount?: boolean;
  count?: number;
  isActive?: boolean; // for liked, bookmarked, followed states
  disabled?: boolean;
  compact?: boolean;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}

const ACTION_CONFIG = {
  collect: {
    icon: CircleDollarSign,
    activeText: "Collected",
    inactiveText: "Collect",
    loadingText: "Collecting...",
    successMessage: "Item collected successfully!",
    authMessage: "Please connect your Lens profile to collect.",
  },
  like: {
    icon: ThumbsUp,
    activeText: "Liked",
    inactiveText: "Like", 
    loadingText: "Liking...",
    successMessage: "Added to likes!",
    authMessage: "Please connect your Lens profile to like.",
  },
  react: {
    icon: Star,
    activeText: "Reacted",
    inactiveText: "React",
    loadingText: "Reacting...",
    successMessage: "Reaction added!",
    authMessage: "Please connect your Lens profile to react.",
  },
  comment: {
    icon: MessageSquare,
    activeText: "Commented",
    inactiveText: "Comment",
    loadingText: "Commenting...",
    successMessage: "Comment posted successfully!",
    authMessage: "Please connect your Lens profile to comment.",
  },
  follow: {
    icon: Plus,
    activeText: "Following",
    inactiveText: "Follow",
    loadingText: "Following...",
    successMessage: "Now following user!",
    authMessage: "Please connect your Lens profile to follow.",
  },
  unfollow: {
    icon: X,
    activeText: "Unfollowed",
    inactiveText: "Unfollow",
    loadingText: "Unfollowing...",
    successMessage: "Unfollowed user.",
    authMessage: "Please connect your Lens profile to unfollow.",
  },
  repost: {
    icon: Repeat2,
    activeText: "Reposted",
    inactiveText: "Repost",
    loadingText: "Reposting...",
    successMessage: "Post reposted successfully!",
    authMessage: "Please connect your Lens profile to repost.",
  },
  share: {
    icon: Share2,
    activeText: "Shared",
    inactiveText: "Share",
    loadingText: "Sharing...",
    successMessage: "Shared successfully!",
    authMessage: "Please connect to share.",
  },
  bookmark: {
    icon: Bookmark,
    activeText: "Bookmarked",
    inactiveText: "Bookmark",
    loadingText: "Bookmarking...",
    successMessage: "Added to bookmarks!",
    authMessage: "Please connect to bookmark.",
  },
  report: {
    icon: Flag,
    activeText: "Reported",
    inactiveText: "Report",
    loadingText: "Reporting...",
    successMessage: "Report submitted. Thank you!",
    authMessage: "Please connect to report.",
  },
};

export const SocialButton: React.FC<SocialButtonProps> = ({
  actionType,
  targetId,
  actionParams = {},
  className = "",
  variant = "ghost",
  size = "sm",
  showCount = false,
  count = 0,
  isActive = false,
  disabled = false,
  compact = false,
  onSuccess,
  onError,
}) => {
  const { isAuthenticated, authenticate, createComment, isPosting } = useLens();
  const { executeAction, isActing, actionError } = useAction();
  
  const [localIsActive, setLocalIsActive] = useState(isActive);
  const [showDialog, setShowDialog] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const config = ACTION_CONFIG[actionType];
  const Icon = config.icon;
  
  const isProcessing = isLoading || isActing || isPosting;
  const currentVariant = localIsActive ? "default" : variant;

  const handleAuthentication = async () => {
    if (!isAuthenticated) {
      toast.info(config.authMessage);
      try {
        await authenticate();
        return true;
      } catch (error) {
        console.error("Authentication error:", error);
        onError?.(error);
        return false;
      }
    }
    return true;
  };

  const executeActionWithAuth = async () => {
    const authenticated = await handleAuthentication();
    if (!authenticated) return;

    setIsLoading(true);
    try {
      let result;
      
      // Handle different action types
      switch (actionType) {
        case "comment":
          if (!commentText.trim()) {
            toast.error("Please enter a comment.");
            return;
          }
          result = await createComment(targetId, commentText);
          setCommentText("");
          setShowDialog(false);
          break;
          
        case "follow":
        case "unfollow":
          // Handle follow/unfollow logic
          result = await executeAction(targetId, actionType, actionParams);
          setLocalIsActive(!localIsActive);
          break;
          
        case "repost":
          result = await createPost(`Reposting: ${targetId}`, ["repost", "imperfect-breath"]);
          break;
          
        default:
          result = await executeAction(targetId, actionType, actionParams);
          if (["like", "bookmark", "react"].includes(actionType)) {
            setLocalIsActive(!localIsActive);
          }
      }

      toast.success(config.successMessage);
      onSuccess?.(result);
      
    } catch (error) {
      console.error(`Error performing ${actionType}:`, error);
      toast.error(`Failed to ${actionType}. Please try again.`);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (actionType === "comment") {
      setShowDialog(true);
    } else {
      executeActionWithAuth();
    }
  };

  const getButtonText = () => {
    if (isProcessing) return config.loadingText;
    if (localIsActive) return config.activeText;
    return config.inactiveText;
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        variant={currentVariant}
        size={size}
        className={`flex items-center gap-1 ${className}`}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className={`w-4 h-4 ${localIsActive && actionType === "like" ? "fill-current" : ""}`} />
        )}
        {!compact && <span>{getButtonText()}</span>}
        {showCount && count > 0 && (
          <Badge variant="secondary" className="ml-1 text-xs">
            {count}
          </Badge>
        )}
      </Button>

      {/* Comment Dialog */}
      {actionType === "comment" && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Comment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Textarea
                placeholder="Write your comment here..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={executeActionWithAuth}
                disabled={isProcessing || !commentText.trim()}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Comment"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

// Convenience components for backward compatibility and ease of use
export const CollectButton = (props: Omit<SocialButtonProps, "actionType">) => (
  <SocialButton {...props} actionType="collect" />
);

export const LikeButton = (props: Omit<SocialButtonProps, "actionType">) => (
  <SocialButton {...props} actionType="like" />
);

export const CommentButton = (props: Omit<SocialButtonProps, "actionType">) => (
  <SocialButton {...props} actionType="comment" />
);

export const FollowButton = (props: Omit<SocialButtonProps, "actionType" | "targetId"> & { address: string; isFollowed?: boolean }) => (
  <SocialButton 
    {...props} 
    actionType={props.isFollowed ? "unfollow" : "follow"} 
    targetId={props.address}
    isActive={props.isFollowed}
  />
);

export const RepostButton = (props: Omit<SocialButtonProps, "actionType" | "targetId"> & { postId: string }) => (
  <SocialButton {...props} actionType="repost" targetId={props.postId} />
);

export const ShareButton = (props: Omit<SocialButtonProps, "actionType">) => (
  <SocialButton {...props} actionType="share" />
);

export const BookmarkButton = (props: Omit<SocialButtonProps, "actionType">) => (
  <SocialButton {...props} actionType="bookmark" />
);

export const ReportButton = (props: Omit<SocialButtonProps, "actionType">) => (
  <SocialButton {...props} actionType="report" />
);