import { useLoadingStore } from '../../stores/loadingStore';
import { usePreferencesStore } from '../../stores/preferencesStore';

// ============================================================================\n// HOOKS FOR EASY ACCESS\n// ============================================================================\n

export const useGlobalLoading = () => {
  const isLoading = useLoadingStore(
    (state) =>
      Object.values(state.loadingScopes).some(Boolean) ||
      Object.values(state.loadingOperations).some(Boolean)
  );
  const showProgressIndicators = usePreferencesStore((state) => state.ui.showProgressIndicators);
  return isLoading && showProgressIndicators;
};

export const useScopeLoading = (scope: 'camera' | 'vision' | 'session' | 'ai' | 'network') => {
  const isLoading = useLoadingStore((state) => !!state.loadingScopes[scope]);
  const showProgressIndicators = usePreferencesStore((state) => state.ui.showProgressIndicators);
  return isLoading && showProgressIndicators;
};

export const useOperationProgress = (operationId: string) => {
  const progress = useLoadingStore((state) => state.loadingProgress[operationId] || 0);
  const message = useLoadingStore((state) => state.loadingMessages[operationId] || '');
  const timeRemaining = useLoadingStore((state) => state.getEstimatedTimeRemaining(operationId));
  const hasError = useLoadingStore((state) => !!state.loadingErrors[operationId]);

  return {
    progress,
    message,
    timeRemaining,
    hasError,
    error: useLoadingStore((state) => state.loadingErrors[operationId]),
  };
};