import { useMirror } from "@/hooks/useMirror";
import { Button } from "./ui/button";
import { Repeat2 } from "lucide-react";

interface MirrorButtonProps {
  profileIdPointed: bigint;
  pubIdPointed: bigint;
}

export const MirrorButton = ({
  profileIdPointed,
  pubIdPointed,
}: MirrorButtonProps) => {
  const { mirror, isMirroring } = useMirror();

  const handleMirror = () => {
    mirror(profileIdPointed, pubIdPointed);
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
