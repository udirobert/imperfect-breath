import { Button } from "./ui/button";
import { Star } from "lucide-react";
import { useCollect } from "@lens-protocol/react";
import { toast } from "sonner";
import { useLens } from "@/hooks/useLens";
import { publicationId } from "@lens-protocol/client";

interface CollectButtonProps {
  publicationId: string; // The ID of the publication to collect
}

export const CollectButton = ({
  publicationId: pubId,
}: CollectButtonProps) => {
  const { lensLoggedIn, loginLens } = useLens();
  const { execute: collectOnLens, loading: isCollecting } = useCollect();

  const handleCollect = async () => {
    if (!lensLoggedIn) {
      toast.info("Please connect your Lens profile to collect.");
      loginLens();
      return;
    }

    try {
      toast.info("Collecting post...");
      const result = await collectOnLens({
        publicationId: publicationId(pubId),
      });

      if (result.isFailure()) {
        toast.error(`Failed to collect: ${result.error.message}`);
        console.error("Lens collect error:", result.error);
        return;
      }

      toast.success("Post collected successfully!");
    } catch (error) {
      toast.error("An error occurred while collecting.");
      console.error("Error collecting:", error);
    }
  };

  return (
    <Button
      onClick={handleCollect}
      disabled={isCollecting}
      variant="ghost"
      size="sm"
    >
      <Star className="w-4 h-4 mr-2" />
      {isCollecting ? "Collecting..." : "Collect"}
    </Button>
  );
};