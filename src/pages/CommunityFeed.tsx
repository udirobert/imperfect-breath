import { usePostsToExplore } from "@lens-protocol/react";
import { Post } from "@lens-protocol/client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { CommentForm } from "@/components/CommentForm"; // Assuming this will be updated
import { CommentList } from "@/components/CommentList"; // Assuming this will be updated

// Helper to render post content based on metadata type
const renderPostContent = (post: Post) => {
  if (!post.metadata) return <p>No content available.</p>;

  switch (post.metadata.__typename) {
    case "TextOnlyMetadata":
      return <p>{post.metadata.content}</p>;
    case "ImageMetadata":
      return (
        <div>
          <p>{post.metadata.content}</p>
          {post.metadata.asset && (
            <img
              src={post.metadata.asset.uri}
              alt={post.metadata.altTag || "Post image"}
              className="mt-4 rounded-lg"
            />
          )}
        </div>
      );
    // Add more cases for other metadata types (Video, Audio, etc.)
    default:
      return <p>Unsupported content type.</p>;
  }
};

const LensPublicationCard = ({ post }: { post: Post }) => {
  const [showCommentForm, setShowCommentForm] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {post.author?.username?.value || "Anonymous"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {new Date(post.timestamp).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent>{renderPostContent(post)}</CardContent>
      <CardFooter className="flex-col items-start gap-2">
        <div className="flex gap-2">
          <MirrorButton publicationId={post.id} />
          <CollectButton publicationId={post.id} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCommentForm(!showCommentForm)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Comment
          </Button>
        </div>
        {showCommentForm && (
          <CommentForm
            // Pass necessary props for commenting
            // For Lens SDK, you'd pass the post ID
            postId={post.id}
            onCommentPosted={() => setShowCommentForm(false)}
          />
        )}
        {showCommentForm && (
          <CommentList
            // Pass necessary props for displaying comments
            // For Lens SDK, you'd pass the post ID
            postId={post.id}
          />
        )}
      </CardFooter>
    </Card>
  );
};

const CommunityFeedPage = () => {
  const { data, loading, error } = usePostsToExplore();

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Community Feed</h1>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Community Feed</h1>
        <p className="text-red-500">Error loading feed: {error.message}</p>
      </div>
    );
  }

  const posts = data?.items || [];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Community Feed</h1>
      {posts.length === 0 ? (
        <p>No posts found in your feed.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <LensPublicationCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityFeedPage;