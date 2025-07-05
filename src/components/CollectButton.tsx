import { Button } from "./ui/button";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useLens } from "@/hooks/useLens";

interface CollectButtonProps {
  publicationId: string; // The ID of the publication to collect
}

export const CollectButton = ({ publicationId }: CollectButtonProps) => {
  const { isAuthenticated, authenticate, isLoading } = useLens();

  const handleCollect = async () => {
    if (!isAuthenticated) {
      toast.info("Please connect your Lens profile to collect.");
      try {
        await authenticate();
      } catch (error) {
        toast.error("Failed to authenticate with Lens.");
        return;
      }
    }

    try {
      toast.info("Collecting publication...");

      // TODO: Implement actual collect functionality with V3 SDK
      console.log("Collecting publication:", publicationId);

      // Mock success for now
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Publication collected successfully!");
    } catch (error) {
      console.error("Collection failed:", error);
      toast.error("Failed to collect publication. Please try again.");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCollect}
      disabled={isLoading}
      className="flex items-center space-x-1"
    >
      <Star className="w-4 h-4" />
      <span>{isLoading ? "Collecting..." : "Collect"}</span>
    </Button>
  );
};
