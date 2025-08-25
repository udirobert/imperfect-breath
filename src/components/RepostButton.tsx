import { Button } from "./ui/button";
import { Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { useLens } from "../hooks/useLens";

interface RepostButtonProps {
  postId: string; // The ID of the post to repost
}

export const RepostButton = ({ postId }: RepostButtonProps) => {
  const { isAuthenticated, authenticate, createPost, isPosting } = useLens();

  const handleRepost = async () => {
    if (!isAuthenticated) {
      toast.info("Please connect your Lens profile to repost.");
      try {
        await authenticate();
      } catch (error) {
        console.error("Authentication error:", error);
        return;
      }
      return;
    }

    try {
      // For now, we'll create a new post that references the original
      // In a full implementation, this would be a mirror/repost action
      await createPost(`Reposting: ${postId}`, ["repost", "imperfect-breath"]);
      toast.success("Post reposted successfully!");
    } catch (error) {
      console.error("Error reposting:", error);
      toast.error("Failed to repost. Please try again.");
    }
  };

  return (
    <Button
      onClick={handleRepost}
      disabled={isPosting}
      variant="ghost"
      size="sm"
    >
      <Repeat2 className="w-4 h-4 mr-2" />
      {isPosting ? "Reposting..." : "Repost"}
    </Button>
  );
};
