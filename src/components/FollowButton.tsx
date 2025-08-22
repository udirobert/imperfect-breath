import { useLens } from "../hooks/useLens";
import { Button } from "./ui/button";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface FollowButtonProps {
  address: string;
  isFollowed?: boolean;
}

export const FollowButton = ({
  address,
  isFollowed = false,
}: FollowButtonProps) => {
  const { followProfile, unfollowProfile, isLoading } = useLens();
  const [userIsFollowed, setUserIsFollowed] = useState(isFollowed);

  const handleFollow = async () => {
    if (!userIsFollowed) {
      await followProfile(address);
      setUserIsFollowed(true);
    } else {
      await unfollowProfile(address);
      setUserIsFollowed(false);
    }
  };

  return (
    <Button
      onClick={handleFollow}
      disabled={isLoading}
      size="sm"
      variant={userIsFollowed ? "outline" : "default"}
    >
      {isLoading ? (
        "Processing..."
      ) : userIsFollowed ? (
        <>
          <X className="w-4 h-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <Plus className="w-4 h-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
};
