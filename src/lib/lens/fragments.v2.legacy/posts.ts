import { graphql } from "@lens-protocol/client";
import { AccountFragment } from "./accounts";

export const PostMetadataFragment = graphql(`
  fragment PostMetadata on PostMetadata {
    ... on TextOnlyMetadata {
      __typename
      content
      tags
    }
    ... on ArticleMetadata {
      __typename
      title
      content
      tags
    }
    ... on ImageMetadata {
      __typename
      content
      tags
      image {
        uri
      }
    }
    ... on VideoMetadata {
      __typename
      content
      tags
      video {
        uri
      }
    }
  }
`);

export const PostStatsFragment = graphql(`
  fragment PostStats on PostStats {
    bookmarks
    comments
    reposts
    quotes
    reactions(request: { type: UPVOTE })
    collects
  }
`);

export const PostFragment = graphql(`
  fragment Post on Post {
    id
    slug
    timestamp
    author {
      ...Account
    }
    metadata {
      ...PostMetadata
    }
    stats {
      ...PostStats
    }
    operations {
      hasBookmarked
      hasUpvoted: hasReacted(request: { type: UPVOTE })
      hasDownvoted: hasReacted(request: { type: DOWNVOTE })
      hasCommented {
        optimistic
        onChain
      }
      hasReposted {
        optimistic
        onChain
      }
      canComment {
        __typename
        ... on OperationValidationPassed {
          restrictedSignerRequired
        }
        ... on OperationValidationFailed {
          reason
        }
      }
      canRepost {
        __typename
        ... on OperationValidationPassed {
          restrictedSignerRequired
        }
        ... on OperationValidationFailed {
          reason
        }
      }
    }
  }
`, [AccountFragment, PostMetadataFragment, PostStatsFragment]);