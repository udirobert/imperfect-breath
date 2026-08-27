/**
 * Local type declarations for @onflow/fcl.
 *
 * @onflow/fcl@1.21.10 ships no .d.ts type declarations. These minimal types
 * cover the full API surface used across src/lib/flow/ and src/hooks/ so the
 * on-chain attestation write path and existing Flow client code are typed.
 * Runtime API verified against the installed package.
 *
 * If @onflow/fcl ships proper types in a future version, delete this file.
 */
declare module "@onflow/fcl" {
  export interface FclUser {
    addr: string | null;
    loggedIn: boolean;
  }

  export interface FclUserHandle {
    snapshot(): Promise<FclUser>;
    authorization: unknown;
    subscribe(callback: (user: FclUser) => void): () => void;
  }

  export interface FclAccount {
    address: string;
    balance: unknown;
    keys: Array<{
      index: number;
      publicKey: { keyId: number; signature: string; hashAlgo: number; weight: number; publicKey: string };
      isRevoked: boolean;
    }>;
  }

  export interface FclTxResult {
    status: number; // 4 = sealed
    errorMessage?: string;
    events?: unknown[];
  }

  export interface FclTxHandle {
    onceSealed(): Promise<FclTxResult>;
  }

  export interface FclArgFn {
    (value: unknown, type: unknown): unknown;
  }

  export interface FclTypes {
    String: unknown;
    UInt8: unknown;
    UInt64: unknown;
    UFix64: unknown;
    Address: unknown;
    Bool: unknown;
    Int: unknown;
    Array: (type: unknown) => unknown;
    Dictionary: (...types: unknown[]) => unknown;
  }

  export interface MutateArgs {
    cadence: string;
    args?: (arg: FclArgFn, t: FclTypes) => unknown[];
    proposer?: unknown;
    payer?: unknown;
    authorizations?: unknown[];
    limit?: number;
  }

  export interface QueryArgs {
    cadence: string;
    args?: (arg: FclArgFn, t: FclTypes) => unknown[];
  }

  export function currentUser(): FclUserHandle;
  export function mutate(opts: MutateArgs): Promise<string>;
  export function tx(txId: string): FclTxHandle;
  export function query(opts: QueryArgs): Promise<unknown>;
  export function send(opts: Record<string, unknown>): Promise<unknown>;
  export function getAccount(address: string): Promise<FclAccount>;
  export function decode<T = unknown>(fn: (value: unknown) => T): (response: unknown) => T;
  export function authenticate(): Promise<void>;
  export function unauthenticate(): Promise<void>;
  export function config(opts: Record<string, unknown>): typeof config;
  // Authorization builders used as proposer/payer/authorizations values
  export const authorization: unknown;
  export const authz: unknown;
  export const proposer: unknown;
  export const payer: unknown;
  export const account: unknown;
  export const accountProof: unknown;

  const _default: {
    currentUser: typeof currentUser;
    mutate: typeof mutate;
    tx: typeof tx;
    query: typeof query;
    send: typeof send;
    getAccount: typeof getAccount;
    decode: typeof decode;
    authenticate: typeof authenticate;
    unauthenticate: typeof unauthenticate;
    config: typeof config;
    authorization: typeof authorization;
    authz: typeof authz;
    proposer: typeof proposer;
    payer: typeof payer;
    account: typeof account;
    accountProof: typeof accountProof;
  };
  export default _default;
}

declare module "@onflow/types" {
  export const String: unknown;
  export const UInt8: unknown;
  export const UInt64: unknown;
  export const UFix64: unknown;
  export const Address: unknown;
  export const Bool: unknown;
  export const Int: unknown;
  export function Array(type: unknown): unknown;
  export function Dictionary(...types: unknown[]): unknown;
  const _default: {
    String: typeof String;
    UInt8: typeof UInt8;
    UInt64: typeof UInt64;
    UFix64: typeof UFix64;
    Address: typeof Address;
    Bool: typeof Bool;
    Int: typeof Int;
    Array: typeof Array;
    Dictionary: typeof Dictionary;
  };
  export default _default;
}
