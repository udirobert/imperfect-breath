import type { FragmentOf } from "@lens-protocol/client";

import { AccountFragment, AccountMetadataFragment, UsernameFragment } from "./accounts";
import { PostFragment, PostMetadataFragment, PostStatsFragment } from "./posts";

declare module "@lens-protocol/client" {
  export interface Account extends FragmentOf<typeof AccountFragment> {}
  export interface AccountMetadata extends FragmentOf<typeof AccountMetadataFragment> {}
  export interface Username extends FragmentOf<typeof UsernameFragment> {}
  export interface Post extends FragmentOf<typeof PostFragment> {}
  export type PostMetadata = FragmentOf<typeof PostMetadataFragment>;
  export interface PostStats extends FragmentOf<typeof PostStatsFragment> {}
}

export const fragments = [
  AccountFragment,
  AccountMetadataFragment,
  UsernameFragment,
  PostFragment,
  PostMetadataFragment,
  PostStatsFragment,
];

export * from "./accounts";
export * from "./posts";