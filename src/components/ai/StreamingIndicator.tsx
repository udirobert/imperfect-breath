import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  Clock,
  Zap
} from 'lucide-react';

interface StreamingState {
  isStreaming: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  progress: {
    bytesReceived: number;
    chunksProcessed: number;
    estimatedProgress: number; // 0-100
  };
  retryAttempt: number;
  maxRetries: number;
}

interface StreamingIndicatorProps {
  streamingState: StreamingState;
  className?: string;
  compact?: boolean;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getConnectionIcon = (status: StreamingState['connectionStatus']) => {
  switch (status) {
    case 'connecting':
      return <Loader2 className="h-4 w-4 animate-spin" />;
    case 'connected':
      return <Wifi className="h-4 w-4 text-green-500" />;
    case 'disconnected':
      return <WifiOff className="h-4 w-4 text-gray-400" />;
    case 'error':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <WifiOff className="h-4 w-4 text-gray-400" />;
  }
};

const getConnectionBadgeVariant = (status: StreamingState['connectionStatus']) => {
  switch (status) {
    case 'connecting':
      return 'secondary';
    case 'connected':
      return 'default';
    case 'disconnected':
      return 'outline';
    case 'error':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getConnectionStatusText = (status: StreamingState['connectionStatus'], retryAttempt: number, maxRetries: number) => {
  switch (status) {
    case 'connecting':
      return retryAttempt > 0 ? `Retrying... (${retryAttempt}/${maxRetries})` : 'Connecting...';
    case 'connected':
      return 'Connected';
    case 'disconnected':
      return 'Disconnected';
    case 'error':
      return 'Connection Error';
    default:
      return 'Unknown';
  }
};

export const StreamingIndicator: React.FC<StreamingIndicatorProps> = ({
  streamingState,
  className = '',
  compact = false
}) => {
  const { isStreaming, connectionStatus, progress, retryAttempt, maxRetries } = streamingState;

  // Don't show anything if not streaming and no error
  if (!isStreaming && connectionStatus !== 'error' && progress.estimatedProgress === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getConnectionIcon(connectionStatus)}
        {isStreaming && (
          <>
            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${progress.estimatedProgress}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">
              {progress.estimatedProgress}%
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Connection Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getConnectionIcon(connectionStatus)}
              <span className="font-medium text-sm">
                AI Analysis Stream
              </span>
            </div>
            <Badge variant={getConnectionBadgeVariant(connectionStatus)}>
              {getConnectionStatusText(connectionStatus, retryAttempt, maxRetries)}
            </Badge>
          </div>

          {/* Progress Bar */}
          {isStreaming && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Progress</span>
                <span>{progress.estimatedProgress}%</span>
              </div>
              <Progress 
                value={progress.estimatedProgress} 
                className="h-2"
              />
            </div>
          )}

          {/* Streaming Metrics */}
          {(isStreaming || progress.bytesReceived > 0) && (
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-blue-500" />
                <span className="text-gray-600">Data:</span>
                <span className="font-mono">{formatBytes(progress.bytesReceived)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-green-500" />
                <span className="text-gray-600">Chunks:</span>
                <span className="font-mono">{progress.chunksProcessed}</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {connectionStatus === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {retryAttempt > 0 
                  ? `Connection failed. Retrying... (${retryAttempt}/${maxRetries})`
                  : 'Streaming connection failed. Falling back to standard analysis.'
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Success State */}
          {connectionStatus === 'disconnected' && progress.estimatedProgress === 100 && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Streaming analysis completed successfully! Processed {formatBytes(progress.bytesReceived)} in {progress.chunksProcessed} chunks.
              </AlertDescription>
            </Alert>
          )}

          {/* Retry Information */}
          {retryAttempt > 0 && connectionStatus === 'connecting' && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <Clock className="h-3 w-3" />
              <span>Attempting to reconnect... ({retryAttempt}/{maxRetries})</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StreamingIndicator;