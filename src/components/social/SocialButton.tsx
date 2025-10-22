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
  Share2,
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
  | "share";

interface SocialButtonProps {
  actionType: SocialActionType;
  targetId: string; // postId, userId, patternId, etc.
  actionParams?: {
    shareData?: ShareData;
    [key: string]: unknown;
  };
  className?: string;
  variant?: "default" | "ghost" | "outline" | "destructive";
  size?: "sm" | "default" | "lg";
  showCount?: boolean;
  count?: number;
  isActive?: boolean; // for liked, followed states
  disabled?: boolean;
  compact?: boolean;
  onSuccess?: (result: unknown) => void;
  onError?: (error: unknown) => void;
}

// Narrow type for Web Share API payload
interface ShareData {
  title?: string;
  text?: string;
  url?: string;
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
  const { isAuthenticated, authenticate, createComment, likePost, mirrorPost, followUser, unfollowUser, isPosting } = useLens();
  const { executeAction, isActing } = useAction();
  
  const [localIsActive, setLocalIsActive] = useState(isActive);
  const [showDialog, setShowDialog] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const config = ACTION_CONFIG[actionType];
  const Icon = config.icon;
  
  const isProcessing = isLoading || isActing || isPosting;
  const currentVariant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" = localIsActive ? "default" : (variant as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link");

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
          
        case "like":
          // Use Lens like action
          result = await likePost(targetId);
          if (result?.success) {
            setLocalIsActive(!localIsActive);
          }
          break;
          
        case "follow":
          result = await followUser(targetId);
          if (result?.success) {
            setLocalIsActive(true);
          }
          break;
        case "unfollow":
          result = await unfollowUser(targetId);
          if (result?.success) {
            setLocalIsActive(false);
          }
          break;

        case "repost":
          // Mirror publication via Lens
          result = await mirrorPost(targetId);
          break;

        case "share":
          // Native share fallback (non-Lens)
          try {
            const shareData: ShareData = (actionParams && 'shareData' in actionParams ? actionParams.shareData as ShareData : undefined) ?? {
              title: "Imperfect Breath",
              text: "Check this out",
              url: window.location.href,
            };
            if (navigator.share) {
              await navigator.share(shareData);
            } else {
              await navigator.clipboard.writeText(shareData.url ?? window.location.href);
              toast.success("Link copied to clipboard");
            }
            result = { success: true };
          } catch (err) {
            result = { success: false, error: err instanceof Error ? err.message : String(err) };
          }
          break;

        case "collect":
        case "react":
          // Unified action execution (supported types)
          result = await executeAction(targetId, actionType, actionParams);
          break;
         default:
           throw new Error(`Unsupported action type: ${actionType}`);
       }
 
       if (result?.success) {
         toast.success(config.successMessage);
         onSuccess?.(result);
       } else if (result && 'error' in result && result.error) {
         toast.error(String(result.error));
         onError?.(result.error);
       }

    } catch (error) {
      console.error("Action error:", error);
      toast.error("Something went wrong. Please try again.");
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`inline-flex items-center ${compact ? 'gap-1' : 'gap-2'} ${className}`}>
      <Button
        variant={currentVariant}
        size={size as "default" | "sm" | "lg" | "icon"}
        disabled={disabled || isProcessing}
        onClick={() => {
          if (actionType === "comment") {
            setShowDialog(true);
          } else {
            executeActionWithAuth();
          }
        }}
      >
        <Icon className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} mr-2`} />
        {compact ? null : (localIsActive ? ACTION_CONFIG[actionType].activeText : ACTION_CONFIG[actionType].inactiveText)}
        {showCount && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {count}
          </Badge>
        )}
      </Button>

      {/* Comment dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a comment</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Share your thoughts..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="default"
              onClick={executeActionWithAuth}
              disabled={isProcessing || !commentText.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {ACTION_CONFIG.comment.loadingText}
                </>
              ) : (
                ACTION_CONFIG.comment.inactiveText
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

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

// Removed unsupported actions: Bookmark and Report
export const ReactButton = (props: Omit<SocialButtonProps, "actionType">) => (
  <SocialButton {...props} actionType="react" />
);