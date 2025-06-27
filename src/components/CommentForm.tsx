import { useState } from "react";
import { useComment } from "@/hooks/useComment";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

interface CommentFormProps {
  profileIdPointed: bigint;
  pubIdPointed: bigint;
  onCommentPosted: () => void;
}

export const CommentForm = ({
  profileIdPointed,
  pubIdPointed,
  onCommentPosted,
}: CommentFormProps) => {
  const [commentText, setCommentText] = useState("");
  const { comment, isCommenting } = useComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }

    // In a real application, you would upload the comment metadata to a decentralized
    // storage solution like IPFS and get a contentURI.
    // For this example, we'll simulate it with a placeholder.
    const simulatedContentURI = `data:application/json,${JSON.stringify({
      name: "Comment",
      description: commentText,
      attributes: [],
    })}`;

    const tx = await comment(
      profileIdPointed,
      pubIdPointed,
      simulatedContentURI
    );
    if (tx) {
      setCommentText("");
      onCommentPosted();
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
