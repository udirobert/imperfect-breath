declare module '@onflow/fcl' {
  export function authenticate(): Promise<{ addr: string | null; loggedIn: boolean }>;
  export function unauthenticate(): Promise<void>;
  export function currentUser(): {
    snapshot(): Promise<{ addr: string | null; loggedIn: boolean }>;
    subscribe(callback: (user: { addr: string | null; loggedIn: boolean }) => void): () => void;
  };
  export function mutate(config: {
    cadence: string;
    args?: (arg: unknown, t: Record<string, unknown>) => unknown[];
    limit?: number;
  }): Promise<string>;
  export function config(settings: Record<string, string | number>): {
    put(key: string, value: string | number): void;
    get(key: string): Promise<string>;
  };
  export const AppMarker: string;
}
