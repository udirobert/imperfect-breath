import { Button } from "./ui/button";
import { Repeat2 } from "lucide-react";
import { useMirror } from "@lens-protocol/react";
import { toast } from "sonner";
import { useLens } from "@/hooks/useLens";
import { publicationId } from "@lens-protocol/client";

interface MirrorButtonProps {
  publicationId: string; // The ID of the publication to mirror
}

export const MirrorButton = ({
  publicationId: pubId,
}: MirrorButtonProps) => {
  const { lensLoggedIn, loginLens } = useLens();
  const { execute: mirrorOnLens, loading: isMirroring } = useMirror();

  const handleMirror = async () => {
    if (!lensLoggedIn) {
      toast.info("Please connect your Lens profile to mirror.");
      loginLens();
      return;
    }

    try {
      toast.info("Mirroring post...");
      const result = await mirrorOnLens({
        publicationId: publicationId(pubId),
      });

      if (result.isFailure()) {
        toast.error(`Failed to mirror: ${result.error.message}`);
        console.error("Lens mirror error:", result.error);
        return;
      }

      toast.success("Post mirrored successfully!");
    } catch (error) {
      toast.error("An error occurred while mirroring.");
      console.error("Error mirroring:", error);
    }
  };

  return (
    <Button
      onClick={handleMirror}
      disabled={isMirroring}
      variant="ghost"
      size="sm"
    >
      <Repeat2 className="w-4 h-4 mr-2" />
      {isMirroring ? "Mirroring..." : "Mirror"}
    </Button>
  );
};