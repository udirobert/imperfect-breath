import { Skeleton } from "./ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useLensService } from "@/hooks/useLensService";

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  createdAt: string;
}

const CommentCard = ({ comment }: { comment: Comment }) => {
  const authorUsername = comment.author.username || "Anonymous";
  const authorAvatar = comment.author.avatar;
  const authorDisplayName = comment.author.displayName || authorUsername;

  return (
    <div className="flex space-x-3 p-3 border-b">
      <Avatar className="w-8 h-8">
        <AvatarImage src={authorAvatar} alt={authorUsername} />
        <AvatarFallback>
          {authorUsername.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm">{authorDisplayName}</span>
          <span className="text-xs text-muted-foreground">
            @{authorUsername}
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-foreground">{comment.content}</p>
      </div>
    </div>
  );
};

interface CommentListProps {
  publicationId: string;
}

export const CommentList = ({ publicationId }: CommentListProps) => {
  const { isAuthenticated } = useLensService();

  const {
    data: comments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["comments", publicationId],
    queryFn: async (): Promise<Comment[]> => {
      // TODO: Implement actual comment fetching with V3 SDK
      console.log("Fetching comments for publication:", publicationId);

      // Mock data for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return [
        {
          id: "comment-1",
          content: "Great post! Thanks for sharing your breathing session.",
          author: {
            id: "user-1",
            username: "breathingfan",
            displayName: "Breathing Fan",
            avatar: undefined,
          },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "comment-2",
          content:
            "This inspired me to try the same pattern. How did you find the experience?",
          author: {
            id: "user-2",
            username: "mindfulnessseeker",
            displayName: "Mindfulness Seeker",
            avatar: undefined,
          },
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ];
    },
    enabled: !!publicationId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Comments</h3>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex space-x-3 p-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Comments</h3>
        <p className="text-sm text-muted-foreground">
          Unable to load comments. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Comments {comments && comments.length > 0 && `(${comments.length})`}
      </h3>

      {!isAuthenticated && (
        <p className="text-sm text-muted-foreground italic">
          Connect your Lens profile to see all comments and interactions.
        </p>
      )}

      {comments && comments.length > 0 ? (
        <div className="space-y-0 border rounded-lg overflow-hidden">
          {comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
};
