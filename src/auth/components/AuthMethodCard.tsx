/**
 * AuthMethodCard - Reusable Auth Method Component
 * 
 * MODULAR: Composable auth method display
 * CLEAN: Single responsibility for auth method presentation
 * PERFORMANT: Optimized for touch and accessibility
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthMethod } from "../auth-methods";

interface AuthMethodCardProps {
  method: AuthMethod;
  onSelect: (methodId: string) => void;
  isRecommended?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
}

export const AuthMethodCard: React.FC<AuthMethodCardProps> = ({
  method,
  onSelect,
  isRecommended = false,
  isLoading = false,
  disabled = false,
  className,
  variant = 'default',
}) => {
  const Icon = method.icon;

  const handleSelect = () => {
    if (!disabled && !isLoading) {
      onSelect(method.id);
    }
  };

  // PERFORMANT: Minimal variant for space-constrained contexts
  if (variant === 'minimal') {
    return (
      <Button
        variant="outline"
        onClick={handleSelect}
        disabled={disabled || isLoading}
        className={cn(
          "flex items-center gap-3 p-4 h-auto text-left justify-start",
          "hover:bg-muted/50 transition-colors",
          "touch-manipulation", // Mobile optimization
          isRecommended && "ring-2 ring-primary ring-offset-2",
          className
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          "bg-primary/10 text-primary"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{method.title}</div>
          <div className="text-sm text-muted-foreground truncate">
            {method.description}
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Button>
    );
  }

  // PERFORMANT: Compact variant for mobile
  if (variant === 'compact') {
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:scale-[1.02]",
          "active:scale-[0.98]", // Touch feedback
          isRecommended && "ring-2 ring-primary ring-offset-2",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={handleSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              "bg-primary/10 text-primary"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{method.title}</h3>
                {isRecommended && (
                  <Badge variant="secondary" className="text-xs">
                    Recommended
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {method.description}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default full variant
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200",
        "hover:shadow-lg hover:scale-[1.02]",
        "active:scale-[0.98]", // Touch feedback
        isRecommended && "ring-2 ring-primary ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-primary/10 text-primary"
            )}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{method.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {method.description}
              </p>
            </div>
          </div>
          {isRecommended && (
            <Badge variant="secondary">
              Recommended
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="space-y-2">
            {method.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
          
          <Button 
            className="w-full mt-4"
            disabled={disabled || isLoading}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect();
            }}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Connecting...
              </>
            ) : (
              <>
                {method.title}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};