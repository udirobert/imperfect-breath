import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
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
  const { isAuthenticated, authenticate, isLoading } = useLens();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }

    if (!isAuthenticated) {
      toast.info("Please connect your Lens profile to comment.");
      try {
        await authenticate();
      } catch (error) {
        toast.error("Failed to authenticate with Lens.");
        return;
      }
    }

    try {
      toast.info("Posting comment...");

      // Use the Lens Client to post a comment
      const { commentOnPost } = useLens();
      const result = await commentOnPost(publicationId, commentText);

      if (!result.success) {
        throw new Error(result.error || "Failed to post comment");
      }

      setCommentText("");
      onCommentPosted?.(result.hash);
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
        disabled={isLoading}
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isLoading || !commentText.trim()}
          size="sm"
        >
          {isLoading ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  );
};
