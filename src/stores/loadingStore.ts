import { create } from 'zustand';

export interface LoadingState {
  loadingScopes: Record<string, boolean>;
  loadingOperations: Record<string, boolean>;
  loadingMessages: Record<string, string>;
  loadingProgress: Record<string, number>;
  loadingErrors: Record<string, string>;
  startTime: Record<string, number>;

  setScopeLoading: (scope: string, isLoading: boolean, message?: string) => void;
  setOperationLoading: (operationId: string, isLoading: boolean, message?: string, progress?: number) => void;
  setOperationProgress: (operationId: string, progress: number, message?: string) => void;
  setOperationError: (operationId: string, error: string) => void;
  clearOperation: (operationId: string) => void;
  getEstimatedTimeRemaining: (operationId: string) => number;
}

export const useLoadingStore = create<LoadingState>((set, get) => ({
  loadingScopes: {},
  loadingOperations: {},
  loadingMessages: {},
  loadingProgress: {},
  loadingErrors: {},
  startTime: {},

  setScopeLoading: (scope, isLoading, message) => set(state => ({
    loadingScopes: { ...state.loadingScopes, [scope]: isLoading },
    loadingMessages: message ? { ...state.loadingMessages, [scope]: message } : state.loadingMessages
  })),

  setOperationLoading: (operationId, isLoading, message, progress) => set(state => ({
    loadingOperations: { ...state.loadingOperations, [operationId]: isLoading },
    loadingMessages: message ? { ...state.loadingMessages, [operationId]: message } : state.loadingMessages,
    loadingProgress: progress !== undefined ? { ...state.loadingProgress, [operationId]: progress } : state.loadingProgress,
    startTime: isLoading ? { ...state.startTime, [operationId]: Date.now() } : state.startTime
  })),

  setOperationProgress: (operationId, progress, message) => set(state => ({
    loadingProgress: { ...state.loadingProgress, [operationId]: progress },
    loadingMessages: message ? { ...state.loadingMessages, [operationId]: message } : state.loadingMessages
  })),

  setOperationError: (operationId, error) => set(state => ({
    loadingErrors: { ...state.loadingErrors, [operationId]: error },
    loadingOperations: { ...state.loadingOperations, [operationId]: false }
  })),

  clearOperation: (operationId) => set(state => {
    const { [operationId]: _, ...restOps } = state.loadingOperations;
    const { [operationId]: __, ...restMsgs } = state.loadingMessages;
    const { [operationId]: ___, ...restProg } = state.loadingProgress;
    const { [operationId]: ____, ...restErr } = state.loadingErrors;
    const { [operationId]: _____, ...restStart } = state.startTime;
    return {
      loadingOperations: restOps,
      loadingMessages: restMsgs,
      loadingProgress: restProg,
      loadingErrors: restErr,
      startTime: restStart
    };
  }),

  getEstimatedTimeRemaining: (operationId) => {
    const state = get();
    const progress = state.loadingProgress[operationId] || 0;
    const startTime = state.startTime[operationId];
    if (!startTime || progress <= 0 || progress >= 100) return 0;

    const elapsed = Date.now() - startTime;
    const estimatedTotal = (elapsed / progress) * 100;
    return Math.max(0, estimatedTotal - elapsed);
  }
}));

export const loadingSelectors = {
  isLoading: () => {
    const scopes = useLoadingStore(state => state.loadingScopes);
    const operations = useLoadingStore(state => state.loadingOperations);
    return Object.values(scopes).some(Boolean) || Object.values(operations).some(Boolean);
  },
  isScopeLoading: (scope: string) => {
    return useLoadingStore(state => !!state.loadingScopes[scope]);
  },
  isOperationLoading: (operationId: string) => {
    return useLoadingStore(state => !!state.loadingOperations[operationId]);
  },
  getProgress: (operationId: string) => {
    return useLoadingStore(state => state.loadingProgress[operationId] || 0);
  },
  getMessage: (operationId: string) => {
    return useLoadingStore(state => state.loadingMessages[operationId] || '');
  },
  getError: (operationId: string) => {
    return useLoadingStore(state => state.loadingErrors[operationId] || null);
  }
};
