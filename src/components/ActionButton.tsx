import { useState } from "react";
import { Button } from "./ui/button";
import { ThumbsUp, Star, CircleDollarSign } from "lucide-react";
import { toast } from "sonner";
import { useAction } from "../hooks/useAction";
import { useLens } from "../hooks/useLens";

type ActionType = "collect" | "like" | "react";

interface ActionButtonProps {
  postId: string;
  actionType: ActionType;
  actionParams?: any;
  className?: string;
}

export const ActionButton = ({
  postId,
  actionType,
  actionParams = {},
  className,
}: ActionButtonProps) => {
  const { isAuthenticated, authenticate } = useLens();
  const { executeAction, isActing, actionError } = useAction();
  const [hasActed, setHasActed] = useState(false);

  const getActionIcon = () => {
    switch (actionType) {
      case "collect":
        return <CircleDollarSign className="w-4 h-4 mr-2" />;
      case "like":
        return <ThumbsUp className="w-4 h-4 mr-2" />;
      case "react":
        return <Star className="w-4 h-4 mr-2" />;
      default:
        return <Star className="w-4 h-4 mr-2" />;
    }
  };

  const getActionText = () => {
    if (isActing) {
      return `Processing...`;
    }

    if (hasActed) {
      switch (actionType) {
        case "collect":
          return "Collected";
        case "like":
          return "Liked";
        case "react":
          return "Reacted";
        default:
          return "Acted";
      }
    }

    switch (actionType) {
      case "collect":
        return "Collect";
      case "like":
        return "Like";
      case "react":
        return "React";
      default:
        return "Act";
    }
  };

  const handleAction = async () => {
    if (!isAuthenticated) {
      toast.info(`Please connect your Lens profile to ${actionType}.`);
      try {
        await authenticate();
      } catch (error) {
        console.error("Authentication error:", error);
        return;
      }
      return;
    }

    try {
      await executeAction(postId, actionType, actionParams);
      setHasActed(true);
    } catch (error) {
      console.error(`Error performing ${actionType}:`, error);
    }
  };

  return (
    <Button
      onClick={handleAction}
      disabled={isActing}
      variant={hasActed ? "outline" : "ghost"}
      size="sm"
      className={className}
    >
      {getActionIcon()}
      {getActionText()}
    </Button>
  );
};

// Convenience components for specific actions
export const CollectButton = (props: Omit<ActionButtonProps, "actionType">) => (
  <ActionButton {...props} actionType="collect" />
);

export const LikeButton = (props: Omit<ActionButtonProps, "actionType">) => (
  <ActionButton {...props} actionType="like" />
);

export const ReactButton = (props: Omit<ActionButtonProps, "actionType">) => (
  <ActionButton {...props} actionType="react" />
);
