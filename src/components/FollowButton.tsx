import { useFollow } from "../hooks/useFollow";
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
  const { follow, unfollow, isFollowing } = useFollow();
  const [userIsFollowed, setUserIsFollowed] = useState(isFollowed);

  const handleFollow = async () => {
    if (!userIsFollowed) {
      await follow(address);
      setUserIsFollowed(true);
    } else {
      await unfollow(address);
      setUserIsFollowed(false);
    }
  };

  return (
    <Button
      onClick={handleFollow}
      disabled={isFollowing}
      size="sm"
      variant={userIsFollowed ? "outline" : "default"}
    >
      {isFollowing ? (
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
