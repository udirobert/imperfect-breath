import { useCollect } from "@/hooks/useCollect";
import { Button } from "./ui/button";
import { Star } from "lucide-react";

interface CollectButtonProps {
  profileIdPointed: bigint;
  pubIdPointed: bigint;
}

export const CollectButton = ({
  profileIdPointed,
  pubIdPointed,
}: CollectButtonProps) => {
  const { collect, isCollecting } = useCollect();

  const handleCollect = () => {
    collect(profileIdPointed, pubIdPointed);
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
