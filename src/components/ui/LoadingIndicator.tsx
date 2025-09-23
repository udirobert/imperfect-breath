/**
 * Unified Loading Indicator Components
 *
 * Provides consistent loading indicators across the application using the unified loading store.
 * Includes global loading, scope-specific loading, progress indicators, and skeleton loaders.
 *
 * Features:
 * - Consistent loading UI across all components
 * - Integration with unified loading store
 * - Progress tracking and display
 * - Customizable loading messages and styles
 * - Skeleton loaders for different content types
 * - Accessibility support
 */

import React from 'react';
import { useLoadingStore, loadingSelectors } from '../../stores/loadingStore';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { cn } from '../../lib/utils';
import { Loader2, Camera, Eye, Activity, Wifi, Zap, AlertCircle } from 'lucide-react';
import { Progress } from './progress';
import { Card, CardContent } from './card';
import { Alert, AlertDescription } from './alert';

// ============================================================================
// GLOBAL LOADING INDICATOR
// ============================================================================

interface GlobalLoadingIndicatorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showMessage?: boolean;
}

export const GlobalLoadingIndicator: React.FC<GlobalLoadingIndicatorProps> = ({
  className,
  size = 'md',
  showMessage = true,
}) => {
  const isLoading = loadingSelectors.isLoading();
  const showProgressIndicators = usePreferencesStore((state) => state.ui.showProgressIndicators);

  if (!isLoading || !showProgressIndicators) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn(
      'flex items-center justify-center gap-2 text-muted-foreground',
      className
    )}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {showMessage && (
        <span className="text-sm">Loading...</span>
      )}
    </div>
  );
};

// ============================================================================
// SCOPE-SPECIFIC LOADING INDICATORS
// ============================================================================

interface ScopeLoadingIndicatorProps {
  scope: 'camera' | 'vision' | 'session' | 'ai' | 'network';
  className?: string;
  showMessage?: boolean;
  inline?: boolean;
}

const scopeConfig = {
  camera: { icon: Camera, message: 'Initializing camera...', color: 'text-blue-500' },
  vision: { icon: Eye, message: 'Loading vision models...', color: 'text-purple-500' },
  session: { icon: Activity, message: 'Setting up session...', color: 'text-green-500' },
  ai: { icon: Zap, message: 'Preparing AI features...', color: 'text-yellow-500' },
  network: { icon: Wifi, message: 'Connecting to services...', color: 'text-orange-500' },
};

export const ScopeLoadingIndicator: React.FC<ScopeLoadingIndicatorProps> = ({
  scope,
  className,
  showMessage = true,
  inline = false,
}) => {
  const isLoading = loadingSelectors.isScopeLoading(scope);
  const showProgressIndicators = usePreferencesStore((state) => state.ui.showProgressIndicators);

  if (!isLoading || !showProgressIndicators) {
    return null;
  }

  const config = scopeConfig[scope];
  const Icon = config.icon;

  const content = (
    <div className={cn(
      'flex items-center gap-2',
      config.color,
      className
    )}>
      <Icon className="w-4 h-4 animate-pulse" />
      {showMessage && (
        <span className="text-sm">{config.message}</span>
      )}
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex items-center justify-center p-6">
        {content}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// PROGRESS INDICATOR
// ============================================================================

interface ProgressIndicatorProps {
  operationId: string;
  className?: string;
  showPercentage?: boolean;
  showTimeRemaining?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  operationId,
  className,
  showPercentage = true,
  showTimeRemaining = false,
  size = 'md',
}) => {
  const progress = loadingSelectors.getProgress(operationId);
  const message = loadingSelectors.getMessage(operationId);
  const timeRemaining = useLoadingStore((state) => state.getEstimatedTimeRemaining(operationId));
  const hasError = useLoadingStore((state) => !!state.loadingErrors[operationId]);
  const showProgressIndicators = usePreferencesStore((state) => state.ui.showProgressIndicators);

  if (!showProgressIndicators) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{message}</span>
        <div className="flex items-center gap-2">
          {showPercentage && (
            <span className="font-medium">{Math.round(progress)}%</span>
          )}
          {showTimeRemaining && timeRemaining > 0 && (
            <span className="text-muted-foreground">
              ~{Math.round(timeRemaining / 1000)}s
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <Progress
          value={progress}
          className={cn('transition-all duration-300', sizeClasses[size])}
        />
        {hasError && (
          <AlertCircle className="absolute right-0 top-0 w-4 h-4 text-destructive -translate-y-1 translate-x-1" />
        )}
      </div>

      {hasError && (
        <Alert variant="destructive" className="text-xs">
          <AlertCircle className="h-3 w-3" />
          <AlertDescription>
            {useLoadingStore((state) => state.loadingErrors[operationId])}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// ============================================================================
// LOADING OVERLAY
// ============================================================================

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  className?: string;
  blurBackground?: boolean;
  children?: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = 'Loading...',
  progress,
  className,
  blurBackground = true,
  children,
}) => {
  const showProgressIndicators = usePreferencesStore((state) => state.ui.showProgressIndicators);

  if (!isVisible || !showProgressIndicators) {
    return <>{children}</>;
  }

  return (
    <div className={cn(
      'relative',
      className
    )}>
      {/* Backdrop */}
      <div className={cn(
        'absolute inset-0 z-50 flex items-center justify-center',
        blurBackground && 'backdrop-blur-sm bg-background/80'
      )}>
        <Card className="border-0 shadow-lg">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="font-medium">{message}</p>
              {progress !== undefined && (
                <div className="w-32">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(progress)}%
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {children && (
        <div className={blurBackground ? 'filter blur-sm pointer-events-none' : ''}>
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SKELETON LOADERS
// ============================================================================

interface SkeletonLoaderProps {
  variant: 'card' | 'text' | 'avatar' | 'button' | 'video' | 'session';
  lines?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant,
  lines = 3,
  className,
}) => {
  const showProgressIndicators = usePreferencesStore((state) => state.ui.showProgressIndicators);

  if (!showProgressIndicators) {
    return null;
  }

  const baseClasses = 'animate-pulse bg-muted rounded';

  switch (variant) {
    case 'card':
      return (
        <Card className={cn('border-dashed', className)}>
          <CardContent className="p-6 space-y-4">
            <div className={cn(baseClasses, 'h-4 w-3/4')} />
            <div className={cn(baseClasses, 'h-4 w-1/2')} />
            <div className={cn(baseClasses, 'h-32 w-full')} />
          </CardContent>
        </Card>
      );

    case 'text':
      return (
        <div className={cn('space-y-2', className)}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                baseClasses,
                'h-4',
                i === lines - 1 ? 'w-2/3' : 'w-full'
              )}
            />
          ))}
        </div>
      );

    case 'avatar':
      return (
        <div className={cn(baseClasses, 'w-12 h-12 rounded-full', className)} />
      );

    case 'button':
      return (
        <div className={cn(baseClasses, 'h-10 w-24 rounded-md', className)} />
      );

    case 'video':
      return (
        <div className={cn(baseClasses, 'w-full aspect-video', className)} />
      );

    case 'session':
      return (
        <div className={cn('space-y-4', className)}>
          <div className={cn(baseClasses, 'h-6 w-1/3')} />
          <div className={cn(baseClasses, 'h-48 w-full rounded-lg')} />
          <div className="flex gap-2">
            <div className={cn(baseClasses, 'h-10 flex-1')} />
            <div className={cn(baseClasses, 'h-10 w-20')} />
          </div>
        </div>
      );

    default:
      return null;
  }
};

// ============================================================================
// COMBINED LOADING STATES
// ============================================================================

interface CombinedLoadingIndicatorProps {
  scopes?: Array<'camera' | 'vision' | 'session' | 'ai' | 'network'>;
  className?: string;
  layout?: 'vertical' | 'horizontal' | 'grid';
}

export const CombinedLoadingIndicator: React.FC<CombinedLoadingIndicatorProps> = ({
  scopes = ['camera', 'vision', 'session'],
  className,
  layout = 'vertical',
}) => {
  const showProgressIndicators = usePreferencesStore((state) => state.ui.showProgressIndicators);

  if (!showProgressIndicators) {
    return null;
  }

  const layoutClasses = {
    vertical: 'space-y-3',
    horizontal: 'flex gap-4',
    grid: 'grid grid-cols-2 gap-3',
  };

  return (
    <div className={cn(layoutClasses[layout], className)}>
      {scopes.map((scope) => (
        <ScopeLoadingIndicator
          key={scope}
          scope={scope}
          inline={layout === 'horizontal'}
        />
      ))}
    </div>
  );
};

// ============================================================================
// HOOKS FOR EASY ACCESS
// ============================================================================

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