/**
 * Session Entry Points - DRY component for all session buttons
 * Eliminates duplication between mobile/desktop
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { QuickStartButton } from '../session/QuickStartButton';

interface SessionEntryPointsProps {
  variant: 'mobile' | 'desktop';
  className?: string;
}

interface SessionButtonConfig {
  to: string;
  label: string;
  variant: 'default' | 'outline';
  size: 'sm' | 'lg';
  className?: string;
  delay: string;
}

export const SessionEntryPoints: React.FC<SessionEntryPointsProps> = ({ 
  variant, 
  className = '' 
}) => {
  
  const isMobile = variant === 'mobile';
  
  // Centralized button configurations - DRY principle
  const buttonConfigs: SessionButtonConfig[] = [
    {
      to: '/session?enhanced=true',
      label: isMobile ? 'AI Enhanced' : 'AI Enhanced Session',
      variant: isMobile ? 'outline' : 'default',
      size: isMobile ? 'sm' : 'lg',
      className: isMobile 
        ? 'w-full text-sm' 
        : 'px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700',
      delay: isMobile ? '650ms' : '600ms',
    },
    {
      to: '/session',
      label: isMobile ? 'Classic' : 'Classic Session',
      variant: 'outline',
      size: isMobile ? 'sm' : 'lg',
      className: isMobile 
        ? 'w-full text-sm' 
        : 'px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-shadow',
      delay: isMobile ? '700ms' : '650ms',
    },
  ];

  if (isMobile) {
    return (
      <div className={`flex flex-col gap-4 items-center w-full ${className}`}>
        {/* Primary CTA: Quick Start */}
        <QuickStartButton 
          className="animate-fade-in w-full"
          style={{ animationDelay: "600ms", opacity: 0 }}
        />
        
        {/* Secondary options */}
        <div className="flex gap-2 w-full">
          {buttonConfigs.map((config, index) => (
            <Link key={config.to} to={config.to} className="flex-1">
              <Button
                style={{ animationDelay: config.delay, opacity: 0 }}
                size={config.size}
                variant={config.variant}
                className={`animate-fade-in ${config.className}`}
              >
                {config.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className={`flex flex-col sm:flex-row gap-4 items-center ${className}`}>
      {buttonConfigs.map((config) => (
        <Link key={config.to} to={config.to}>
          <Button
            style={{ animationDelay: config.delay, opacity: 0 }}
            size={config.size}
            variant={config.variant}
            className={`animate-fade-in w-full sm:w-auto ${config.className}`}
          >
            {config.label}
          </Button>
        </Link>
      ))}
    </div>
  );
};