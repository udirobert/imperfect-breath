import { Button } from "@/components/ui/button";
import { useLensService } from "@/hooks/useLensService";
import { SessionData } from "@/lib/ai/config";
import { toast } from "sonner";

interface ShareToLensButtonProps {
  sessionData: SessionData;
  aiAnalysis: string;
}

export const ShareToLensButton = ({
  sessionData,
  aiAnalysis,
}: ShareToLensButtonProps) => {
  const { isAuthenticated, authenticate, publishSession, isLoading } =
    useLensService();

  const handleShare = async () => {
    if (!isAuthenticated) {
      toast.info("Please connect your Lens profile first.");
      try {
        await authenticate();
      } catch (error) {
        toast.error("Failed to authenticate with Lens.");
        return;
      }
    }

    try {
      toast.info("Preparing to share to Lens...");

      const breathingSessionData = {
        duration: sessionData.sessionDuration || 0,
        pattern: sessionData.patternName || "Unknown",
        quality: sessionData.restlessnessScore || 5,
        notes: aiAnalysis,
        timestamp: new Date().toISOString(),
      };

      const result = await publishSession(breathingSessionData);

      if (result) {
        toast.success("Session shared to Lens successfully!");
        console.log("Lens post result:", result);
      } else {
        toast.error("Failed to share session to Lens.");
      }
    } catch (error) {
      toast.error("An error occurred while sharing to Lens.");
      console.error("Share to Lens error:", error);
    }
  };

  return (
    <Button onClick={handleShare} disabled={isLoading}>
      {isLoading ? "Sharing..." : "Share to Lens"}
    </Button>
  );
};
