import { Skeleton } from "./ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useLens } from "@/hooks/useLens";
import { postId, PostReferenceType, Post } from "@lens-protocol/client";

const CommentCard = ({ comment }: { comment: Post }) => {
  const authorUsername = comment.author?.username?.value || "Anonymous";
  const authorAvatar = comment.author?.metadata?.picture?.uri || undefined;
  const commentContent = comment.metadata?.__typename === "TextOnlyMetadata" ? comment.metadata.content : "";

  return (
    <div className="flex items-start gap-4">
      <Avatar>
        <AvatarImage src={authorAvatar} />
        <AvatarFallback>{authorUsername.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold">{authorUsername}</p>
        <p>{commentContent}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(comment.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

interface CommentListProps {
  postId: string;
}

export const CommentList = ({ postId: parentPostId }: CommentListProps) => {
  const { client } = useLens(); // Assuming useLens provides the Lens PublicClient

  const { data, isLoading, error } = useQuery<Post[], Error>({
    queryKey: ["comments", parentPostId],
    queryFn: async () => {
      if (!client) {
        throw new Error("Lens client not initialized.");
      }
      
      // TODO: Implement proper Lens post references fetching
      // const result = await fetchPostReferences(client, {
      //   referencedPost: postId(parentPostId),
      //   referenceTypes: [PostReferenceType.CommentOn],
      // });

      // if (result.isFailure()) {
      //   throw result.error;
      // }
      // return result.value.items as Post[];
      
      // Placeholder return for now
      return [] as Post[];
    },
    enabled: !!client, // Only run query if client is available
  });

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 mt-4">Error loading comments: {error.message}</p>;
  }

  const comments = data || [];

  return (
    <div className="mt-4 space-y-4">
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm">No comments yet.</p>
      ) : (
        comments.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))
      )}
    </div>
  );
};