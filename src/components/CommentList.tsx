import { Skeleton } from "./ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useLens } from "../hooks/useLens";

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
  const { isAuthenticated } = useLens();

  const {
    data: comments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["comments", publicationId],
    queryFn: async (): Promise<Comment[]> => {
      // Use the Lens client to fetch comments
      const { isAuthenticated } = useLens();

      if (!isAuthenticated) {
        return [];
      }

      try {
        // Get the account from the context
        const { currentAccount } = useLens();
        if (!currentAccount) return [];

        const timeline = await useLens().getTimeline(currentAccount.address);

        // Filter for comments on this publication
        const comments = timeline.filter((post) => {
          // In Lens V3, we can check if a post is a comment by checking
          // if it has a commentOn property pointing to our publicationId
          return post.commentOn && post.commentOn.id === publicationId;
        });

        // Map to the Comment type
        return comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          author: {
            id: comment.author.address,
            username: comment.author.username || "anonymous",
            displayName: comment.author.name,
            avatar: comment.author.picture,
          },
          createdAt: comment.timestamp || new Date().toISOString(),
        }));
      } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
      }
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
