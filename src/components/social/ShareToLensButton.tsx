import { Button } from "@/components/ui/button";
import { useLens } from "@/hooks/useLens";
import { SessionData } from "@/lib/ai/config";
import { createLensPostMetadata } from "@/lib/lens/createLensPostMetadata";
import { uploadToGrove } from "@/lib/lens/uploadToGrove";
import { usePost } from "@lens-protocol/react";
import { toast } from "sonner";
import * as t from "@onflow/types";

interface ShareToLensButtonProps {
  sessionData: SessionData;
  aiAnalysis: string;
}

export const ShareToLensButton = ({ sessionData, aiAnalysis }: ShareToLensButtonProps) => {
  const { lensLoggedIn, loginLens } = useLens();
  const { execute: postOnLens, loading: posting } = usePost();

  const handleShare = async () => {
    if (!lensLoggedIn) {
      toast.info("Please connect your Lens profile first.");
      loginLens();
      return;
    }

    try {
      toast.info("Preparing to share to Lens...");
      const metadata = createLensPostMetadata(sessionData, aiAnalysis);
      const uri = await uploadToGrove(metadata);

      if (!uri) {
        toast.error("Failed to upload post metadata.");
        return;
      }

      const result = await postOnLens({
        contentURI: uri,
      });

      if (result.isFailure()) {
        toast.error(`Failed to post to Lens: ${result.error.message}`);
        console.error("Lens post error:", result.error);
        return;
      }

      toast.success("Session shared to Lens successfully!");
      console.log("Lens post result:", result);
    } catch (error) {
      toast.error("An error occurred while sharing to Lens.");
      console.error("Share to Lens error:", error);
    }
  };

  return (
    <Button onClick={handleShare} disabled={posting}>
      {posting ? "Sharing..." : "Share to Lens"}
    </Button>
  );
};
