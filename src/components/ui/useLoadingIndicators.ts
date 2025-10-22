import { useLoadingStore, loadingSelectors } from '../../stores/loadingStore';
import { usePreferencesStore } from '../../stores/preferencesStore';

// ============================================================================\n// HOOKS FOR EASY ACCESS\n// ============================================================================\n

export const useGlobalLoading = () => {
  const isLoading = loadingSelectors.isLoading();
  const showProgressIndicators = usePreferencesStore((state) => state.ui.showProgressIndicators);
  return isLoading && showProgressIndicators;
};

export const useScopeLoading = (scope: 'camera' | 'vision' | 'session' | 'ai' | 'network') => {
  const isLoading = loadingSelectors.isScopeLoading(scope);
  const showProgressIndicators = usePreferencesStore((state) => state.ui.showProgressIndicators);
  return isLoading && showProgressIndicators;
};

export const useOperationProgress = (operationId: string) => {
  const progress = loadingSelectors.getProgress(operationId);
  const message = loadingSelectors.getMessage(operationId);
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