import { useFollow } from "@/hooks/useFollow";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

interface FollowButtonProps {
  profileId: number;
}

export const FollowButton = ({ profileId }: FollowButtonProps) => {
  const { follow, isFollowing } = useFollow();

  const handleFollow = () => {
    follow(profileId);
  };

  return (
    <Button onClick={handleFollow} disabled={isFollowing} size="sm">
      <Plus className="w-4 h-4 mr-2" />
      {isFollowing ? "Following..." : "Follow"}
    </Button>
  );
};
