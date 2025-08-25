/**
 * Integration Status Component
 *
 * Shows users the current status of all integrations (Supabase, Flow, Lens, etc.)
 * and guides them through setup if needed.
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useSystemHealth } from "../monitoring/SystemHealthMonitor";
import { config } from "../../config/environment";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  ExternalLink,
} from "lucide-react";

interface IntegrationItem {
  id: string;
  name: string;
  description: string;
  status: "connected" | "disconnected" | "error" | "loading";
  required: boolean;
  setupUrl?: string;
  documentation?: string;
  details?: string;
}

export const IntegrationStatus: React.FC = () => {
  const { user, isAuthenticated, hasWallet, connectWallet } = useAuth();
  const { health, hasVisionService, hasFlowService, hasLensService } =
    useSystemHealth();
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);

  useEffect(() => {
    const updateIntegrations = () => {
      const items: IntegrationItem[] = [
        // Core Authentication
        {
          id: "supabase",
          name: "Database & Auth",
          description: "User authentication and data storage",
          status: isAuthenticated ? "connected" : "disconnected",
          required: true,
          details: isAuthenticated
            ? `Signed in as ${user?.email || "user"}`
            : "Sign in to access all features",
        },

        // Wallet Integration
        {
          id: "wallet",
          name: "Web3 Wallet",
          description: "Connect wallet for blockchain features",
          status: hasWallet ? "connected" : "disconnected",
          required: false,
          details: hasWallet
            ? `Connected: ${user?.wallet?.address?.slice(0, 8)}...`
            : "Connect wallet for NFT and social features",
        },

        // AI Analysis
        {
          id: "ai",
          name: "AI Analysis",
          description: "Server-based breathing pattern analysis",
          status: health.ai ? "connected" : "error",
          required: true,
          details: health.ai
            ? "AI analysis available via Hetzner server"
            : "AI service unavailable - server may be down",
        },

        // Computer Vision
        {
          id: "vision",
          name: "Computer Vision",
          description: "Real-time posture and breathing analysis",
          status: hasVisionService ? "connected" : "disconnected",
          required: false,
          documentation: "https://github.com/your-org/vision-service",
          details: hasVisionService
            ? "Vision processing active"
            : "Enhanced vision features disabled",
        },

        // Flow Blockchain
        {
          id: "flow",
          name: "Flow Blockchain",
          description: "NFT minting and marketplace features",
          status: hasFlowService ? "connected" : "disconnected",
          required: false,
          setupUrl: config.flow.accessNode,
          details: hasFlowService
            ? "Flow blockchain connected"
            : "NFT features unavailable",
        },

        // Lens Protocol
        {
          id: "lens",
          name: "Lens Protocol",
          description: "Decentralized social features",
          status: hasLensService ? "connected" : "disconnected",
          required: false,
          setupUrl: config.lens.apiUrl,
          details: hasLensService
            ? "Social features enabled"
            : "Social sharing disabled",
        },
      ];

      setIntegrations(items);
    };

    updateIntegrations();
  }, [
    isAuthenticated,
    hasWallet,
    health,
    hasVisionService,
    hasFlowService,
    hasLensService,
    user,
  ]);

  const getStatusIcon = (status: IntegrationItem["status"]) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "disconnected":
        return <XCircle className="w-5 h-5 text-gray-400" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "loading":
        return (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (
    status: IntegrationItem["status"],
    required: boolean
  ) => {
    switch (status) {
      case "connected":
        return <Badge variant="default">Connected</Badge>;
      case "disconnected":
        return (
          <Badge variant={required ? "destructive" : "secondary"}>
            Disconnected
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "loading":
        return <Badge variant="outline">Connecting...</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getActionButton = (integration: IntegrationItem) => {
    switch (integration.id) {
      case "supabase":
        return !isAuthenticated ? (
          <Button size="sm" onClick={() => (window.location.href = "/auth")}>
            Sign In
          </Button>
        ) : null;

      case "wallet":
        return !hasWallet ? (
          <Button size="sm" onClick={connectWallet}>
            Connect Wallet
          </Button>
        ) : null;

      default:
        if (integration.setupUrl) {
          return (
            <Button size="sm" variant="outline" asChild>
              <a
                href={integration.setupUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Settings className="w-4 h-4 mr-1" />
                Setup
              </a>
            </Button>
          );
        }
        return null;
    }
  };

  const connectedCount = integrations.filter(
    (i) => i.status === "connected"
  ).length;
  const requiredCount = integrations.filter((i) => i.required).length;
  const requiredConnected = integrations.filter(
    (i) => i.required && i.status === "connected"
  ).length;

  const overallHealth =
    requiredConnected === requiredCount
      ? "good"
      : requiredConnected > 0
      ? "partial"
      : "poor";

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Integration Status</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge
              variant={
                overallHealth === "good"
                  ? "default"
                  : overallHealth === "partial"
                  ? "secondary"
                  : "destructive"
              }
            >
              {connectedCount}/{integrations.length} Connected
            </Badge>
          </div>
        </div>

        {overallHealth !== "good" && (
          <div className="text-sm text-muted-foreground">
            {overallHealth === "poor"
              ? "Core services need setup for full functionality"
              : "Some optional features are unavailable"}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(integration.status)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{integration.name}</h4>
                    {integration.required && (
                      <Badge variant="outline" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {integration.description}
                  </p>
                  {integration.details && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {integration.details}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {getStatusBadge(integration.status, integration.required)}
                {getActionButton(integration)}
                {integration.documentation && (
                  <Button size="sm" variant="ghost" asChild>
                    <a
                      href={integration.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Quick Setup Guide</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>
              • <strong>Essential:</strong> Sign in and configure AI settings
            </li>
            <li>
              • <strong>Enhanced:</strong> Connect wallet for blockchain
              features
            </li>
            <li>
              • <strong>Advanced:</strong> Set up vision service for real-time
              analysis
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntegrationStatus;
