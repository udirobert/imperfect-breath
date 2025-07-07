import { Button } from "./ui/button";
import { Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { useRepost } from "../hooks/useRepost";
import { useLens } from "../hooks/useLens";

interface RepostButtonProps {
  postId: string; // The ID of the post to repost
}

export const RepostButton = ({ postId }: RepostButtonProps) => {
  const { isAuthenticated, authenticate } = useLens();
  const { repost, isReposting, repostError } = useRepost();

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
      toast.info("Reposting...");
      const result = await repost(postId);

      if (result) {
        toast.success("Post reposted successfully!", {
          description: `Transaction hash: ${result}`,
        });
      } else {
        toast.error("Failed to repost");
      }
    } catch (error) {
      toast.error("An error occurred while reposting.");
      console.error("Error reposting:", error);
    }
  };

  return (
    <Button
      onClick={handleRepost}
      disabled={isReposting}
      variant="ghost"
      size="sm"
    >
      <Repeat2 className="w-4 h-4 mr-2" />
      {isReposting ? "Reposting..." : "Repost"}
    </Button>
  );
};
