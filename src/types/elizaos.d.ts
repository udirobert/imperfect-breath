/**
 * Type definitions for @elizaos/core
 * These type definitions represent the Eliza AI OS platform interfaces
 */

declare module '@elizaos/core' {
  /**
   * Base message interface for Eliza AI platform
   */
  export interface Message {
    user: string;
    content: {
      text: string;
      action?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }

  /**
   * Eliza runtime environment
   */
  export interface Runtime {
    context: any;
    state: any;
    user: {
      id: string;
      preferences?: any;
      [key: string]: any;
    };
    [key: string]: any;
  }

  /**
   * Callback response format
   */
  export interface CallbackResponse {
    text: string;
    action?: string;
    data?: any;
    [key: string]: any;
  }

  /**
   * Callback function signature
   */
  export type Callback = (response: CallbackResponse) => void;

  /**
   * Action definition for Eliza plugins
   */
  export interface Action {
    name: string;
    similes: string[];
    description: string;
    validate: (runtime: Runtime, message: Message) => Promise<boolean>;
    handler: (runtime: Runtime, message: Message, state: any, options: any, callback?: Callback) => Promise<boolean>;
    examples: any[];
  }

  /**
   * Provider definition for Eliza plugins
   */
  export interface Provider {
    get: (runtime: Runtime, message: Message, state: any) => Promise<string>;
    [key: string]: any;
  }

  /**
   * Evaluator definition for Eliza plugins
   */
  export interface Evaluator {
    name: string;
    similes: string[];
    description: string;
    validate: (runtime: Runtime, message: Message) => Promise<boolean>;
    handler: (runtime: Runtime, message: Message) => Promise<{
      score: number;
      feedback: string;
      suggestions: string[];
      [key: string]: any;
    }>;
    examples: any[];
  }

  /**
   * Plugin definition for Eliza platform
   */
  export interface Plugin {
    name: string;
    description: string;
    actions: Action[];
    evaluators?: Evaluator[];
    providers?: Provider[];
    [key: string]: any;
  }
}