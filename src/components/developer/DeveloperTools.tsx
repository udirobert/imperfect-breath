/**
 * Developer Tools Component
 * ENHANCEMENT: Provides easy access to developer overrides and debugging
 * CLEAN: Centralized developer utilities
 * MODULAR: Composable developer interface
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  Crown,
  Sparkles,
  Zap,
  RefreshCw,
  Trash2,
  Info,
  CheckCircle,
} from "lucide-react";
import {
  getDeveloperOverride,
  setDeveloperOverride,
  clearDeveloperOverride,
} from "@/lib/monetization/revenueCatConfig";
import { revenueCatService } from "@/lib/monetization/revenueCat";

interface DeveloperToolsProps {
  className?: string;
}

export const DeveloperTools: React.FC<DeveloperToolsProps> = ({
  className,
}) => {
  const [override, setOverride] = useState(getDeveloperOverride());
  const [selectedTier, setSelectedTier] = useState<"basic" | "premium" | "pro">(
    "pro",
  );
  const [configStatus, setConfigStatus] = useState<{
    isAvailable: boolean;
    isInitialized: boolean;
    error: string | null;
  } | null>(null);

  // Refresh override status
  const refreshOverride = async () => {
    setOverride(getDeveloperOverride());
    try {
      const isAvailable = revenueCatService.isRevenueCatAvailable();
      await revenueCatService.initialize();
      setConfigStatus({
        isAvailable,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      setConfigStatus({
        isAvailable: false,
        isInitialized: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  useEffect(() => {
    refreshOverride();
  }, []);

  const handleSetOverride = () => {
    setDeveloperOverride(selectedTier);
    refreshOverride();
  };

  const handleClearOverride = () => {
    clearDeveloperOverride();
    refreshOverride();
  };

  const tierIcons = {
    basic: Zap,
    premium: Sparkles,
    pro: Crown,
  };

  const tierColors = {
    basic: "bg-gray-500",
    premium: "bg-blue-500",
    pro: "bg-purple-500",
  };

  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Developer Tools
        </CardTitle>
        <CardDescription>
          Override subscription tiers and debug RevenueCat configuration
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Override Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Current Override Status</h4>
          {override.enabled ? (
            <div className="flex items-center gap-2">
              <Badge className={tierColors[override.tier]}>
                {React.createElement(tierIcons[override.tier], {
                  className: "h-3 w-3 mr-1",
                })}
                {override.tier.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {override.reason}
              </span>
            </div>
          ) : (
            <Badge variant="outline">
              <CheckCircle className="h-3 w-3 mr-1" />
              No Override Active
            </Badge>
          )}
        </div>

        {/* Set Override */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Set Developer Override</h4>
          <div className="flex gap-2">
            <Select
              value={selectedTier}
              onValueChange={(value: "basic" | "premium" | "pro") => setSelectedTier(value)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic (Free)</SelectItem>
                <SelectItem value="premium">Premium ($4.99/month)</SelectItem>
                <SelectItem value="pro">Pro ($9.99/month)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSetOverride} size="sm">
              Set Override
            </Button>
          </div>
        </div>

        {/* Clear Override */}
        {override.enabled && (
          <Button
            onClick={handleClearOverride}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Override
          </Button>
        )}

        {/* Configuration Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">RevenueCat Status</h4>
            <Button onClick={refreshOverride} variant="ghost" size="sm">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>

          {configStatus && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium">Available:</span>
                <Badge
                  variant={configStatus.isAvailable ? "default" : "destructive"}
                >
                  {configStatus.isAvailable ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium">Initialized:</span>
                <Badge
                  variant={configStatus.isInitialized ? "default" : "secondary"}
                >
                  {configStatus.isInitialized ? "Yes" : "No"}
                </Badge>
              </div>
              {configStatus.error && (
                <div className="text-xs text-muted-foreground">
                  Error: {configStatus.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Usage Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Usage:</strong> Set an override to test premium features
            locally. The override persists in localStorage until cleared. This
            only works in development mode.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default DeveloperTools;
