import { graphql } from "@lens-protocol/client";

export const AccountMetadataFragment = graphql(`
  fragment AccountMetadata on AccountMetadata {
    name
    bio
    picture
    coverPicture
  }
`);

export const UsernameFragment = graphql(`
  fragment Username on Username {
    value
    namespace
    localName
  }
`);

export const AccountFragment = graphql(`
  fragment Account on Account {
    __typename
    address
    username {
      ...Username
    }
    metadata {
      ...AccountMetadata
    }
    operations {
      isFollowedByMe
      isFollowingMe
      canFollow {
        __typename
        ... on OperationValidationPassed {
          restrictedSignerRequired
        }
        ... on OperationValidationFailed {
          reason
        }
      }
      canUnfollow {
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
`, [UsernameFragment, AccountMetadataFragment]);