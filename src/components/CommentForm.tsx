import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useLens } from "../hooks/useLens";

interface CommentFormProps {
  publicationId: string;
  onCommentPosted?: (commentId: string) => void;
}

export const CommentForm = ({
  publicationId,
  onCommentPosted,
}: CommentFormProps) => {
  const [commentText, setCommentText] = useState("");
  const { address } = useAccount();
  const { isAuthenticated, authenticate, isAuthenticating, createComment } =
    useLens();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }

    if (!isAuthenticated) {
      toast.info("Please connect your Lens profile to comment.");
      try {
        await authenticate(address || "");
      } catch (error) {
        toast.error("Failed to authenticate with Lens.");
        return;
      }
    }

    try {
      toast.info("Posting comment...");

      // Use the Lens Client to post a comment
      const result = await createComment(publicationId, commentText);

      if (!result.success) {
        throw new Error(result.error || "Failed to post comment");
      }

      setCommentText("");
      onCommentPosted?.(
        result.hash || result.id || "comment-posted",
      );
      toast.success("Comment posted successfully!");
    } catch (error) {
      console.error("Comment posting failed:", error);
      toast.error("Failed to post comment. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder="Write a comment..."
        className="min-h-[80px] resize-none"
        disabled={isAuthenticating}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isAuthenticating || !commentText.trim()}
          size="sm"
        >
          {isAuthenticating ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  );
};
