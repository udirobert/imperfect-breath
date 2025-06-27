import { useComments } from "@/hooks/useComments";
import { Skeleton } from "./ui/skeleton";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const CommentCard = ({ comment }: { comment: any }) => {
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!comment.contentURI) return;
      setLoading(true);
      try {
        const response = await fetch(
          comment.contentURI.replace("ipfs://", "https://ipfs.io/ipfs/")
        );
        const data = await response.json();
        setMetadata(data);
      } catch (error) {
        console.error("Failed to fetch comment metadata:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, [comment.contentURI]);

  if (loading) {
    return <Skeleton className="h-16 w-full" />;
  }

  return (
    <div className="flex items-start gap-4">
      <Avatar>
        <AvatarImage src={metadata?.image} />
        <AvatarFallback>{metadata?.name?.charAt(0) || "A"}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold">{metadata?.name || "Anonymous"}</p>
        <p>{metadata?.description || "No content"}</p>
      </div>
    </div>
  );
};

interface CommentListProps {
  profileId: bigint;
  pubId: bigint;
}

export const CommentList = ({ profileId, pubId }: CommentListProps) => {
  const { comments, loading } = useComments(profileId, pubId);

  if (loading) {
    return (
      <div className="space-y-2 mt-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {comments.length === 0 ? (
        <p className="text-muted-foreground text-sm">No comments yet.</p>
      ) : (
        comments.map((comment, index) => (
          <CommentCard key={index} comment={comment} />
        ))
      )}
    </div>
  );
};
