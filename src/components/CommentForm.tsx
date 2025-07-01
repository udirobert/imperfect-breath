import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { useLens } from "@/hooks/useLens";
import { usePost } from "@lens-protocol/react";
import { textOnly } from "@lens-protocol/metadata";
import { uploadToGrove } from "@/lib/lens/uploadToGrove";
import { postId } from "@lens-protocol/client";

interface CommentFormProps {
  postId: string; // The ID of the post to comment on
  onCommentPosted: () => void;
}

export const CommentForm = ({
  postId: parentPostId,
  onCommentPosted,
}: CommentFormProps) => {
  const [commentText, setCommentText] = useState("");
  const { lensLoggedIn, loginLens } = useLens();
  const { execute: postOnLens, loading: isCommenting } = usePost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }

    if (!lensLoggedIn) {
      toast.info("Please connect your Lens profile to comment.");
      loginLens();
      return;
    }

    try {
      toast.info("Posting comment...");

      // 1. Create comment metadata
      const metadata = textOnly({
        content: commentText,
        // You can add other metadata fields here if needed
      });

      // 2. Upload metadata to Grove
      const contentURI = await uploadToGrove(metadata);

      if (!contentURI) {
        toast.error("Failed to upload comment metadata.");
        return;
      }

      // 3. Post the comment on Lens
      const result = await postOnLens({
        contentURI: contentURI,
        commentOn: {
          post: postId(parentPostId),
        },
      });

      if (result.isFailure()) {
        toast.error(`Failed to post comment: ${result.error.message}`);
        console.error("Lens comment error:", result.error);
        return;
      }

      toast.success("Comment posted successfully!");
      setCommentText("");
      onCommentPosted();
    } catch (error) {
      toast.error("An error occurred while posting comment.");
      console.error("Error posting comment:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2">
      <Textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder="Write a comment..."
        disabled={isCommenting}
      />
      <Button type="submit" disabled={isCommenting} size="sm">
        {isCommenting ? "Posting..." : "Post Comment"}
      </Button>
    </form>
  );
};