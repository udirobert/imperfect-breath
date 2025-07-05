import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TestTube } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoBadgeProps {
  variant?: 'default' | 'warning' | 'info';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({
  variant = 'warning',
  size = 'default',
  className,
  showIcon = true
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-1.5 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1';
      default:
        return 'text-xs px-2 py-1';
    }
  };

  const Icon = variant === 'warning' ? AlertTriangle : TestTube;

  return (
    <Badge
      variant="outline"
      className={cn(
        getVariantStyles(),
        getSizeStyles(),
        'font-medium border',
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      DEMO
    </Badge>
  );
};

interface DemoIndicatorProps {
  isDemo: boolean;
  variant?: 'badge' | 'text' | 'banner';
  className?: string;
}

export const DemoIndicator: React.FC<DemoIndicatorProps> = ({
  isDemo,
  variant = 'badge',
  className
}) => {
  if (!isDemo) return null;

  switch (variant) {
    case 'text':
      return (
        <span className={cn('text-xs text-yellow-600 font-medium', className)}>
          (Demo Content)
        </span>
      );
    
    case 'banner':
      return (
        <div className={cn(
          'bg-yellow-50 border border-yellow-200 rounded-md p-2 mb-4',
          className
        )}>
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-sm text-yellow-800">
              This is demo content for demonstration purposes
            </span>
          </div>
        </div>
      );
    
    default:
      return <DemoBadge className={className} />;
  }
};

export default DemoBadge;
