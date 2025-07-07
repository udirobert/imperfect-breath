import { useState } from "react";
import { Button } from "./ui/button";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useComment } from "../hooks/useComment";
import { useLens } from "../hooks/useLens";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";

interface CommentButtonProps {
  publicationId: string; // The ID of the publication to comment on
}

export const CommentButton = ({ publicationId }: CommentButtonProps) => {
  const [open, setOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const { isAuthenticated, authenticate } = useLens();
  const { comment, isCommenting, commentError } = useComment();

  const handleOpenComment = async () => {
    if (!isAuthenticated) {
      toast.info("Please connect your Lens profile to comment.");
      try {
        await authenticate();
      } catch (error) {
        console.error("Authentication error:", error);
        return;
      }
    }
    setOpen(true);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      toast.error("Please enter a comment.");
      return;
    }

    try {
      await comment(publicationId, commentText);
      setCommentText("");
      setOpen(false);
      toast.success("Comment submitted successfully!");
    } catch (error) {
      console.error("Error submitting comment:", error);
      // Error is already handled in the hook with toast
    }
  };

  return (
    <>
      <Button onClick={handleOpenComment} variant="ghost" size="sm">
        <MessageSquare className="w-4 h-4 mr-2" />
        Comment
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
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
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitComment}
              disabled={isCommenting || !commentText.trim()}
            >
              {isCommenting ? "Submitting..." : "Submit Comment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
