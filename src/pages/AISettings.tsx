import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { AI_PROVIDERS, AIConfigManager, SessionData } from "@/lib/ai/config";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { AITrialManager } from "@/lib/ai/trial-manager";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Eye,
  EyeOff,
  TestTube,
  Loader2,
  Gift,
} from "lucide-react";
import { toast } from "sonner";

const AISettings = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [trialStatus, setTrialStatus] = useState<{
    usageCount: number;
    isExhausted: boolean;
  }>({ usageCount: 0, isExhausted: false });
  const { analyzeWithProvider } = useAIAnalysis();

  // Load existing API keys and trial status on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load API keys
        const loadedKeys: Record<string, string> = {};
        for (const provider of AI_PROVIDERS) {
          try {
            const key = await AIConfigManager.getApiKey(provider.id);
            if (key && typeof key === "string") {
              loadedKeys[provider.id] = key;
            }
          } catch (error) {
            console.warn(`Failed to load API key for ${provider.id}:`, error);
          }
        }
        setApiKeys(loadedKeys);

        // Load trial status
        try {
          const trialStatus = await AITrialManager.getTrialStatus();
          setTrialStatus({
            usageCount: trialStatus.trialUsageCount || 0,
            isExhausted: !trialStatus.canUseTrial,
          });
        } catch (error) {
          console.warn("Failed to load trial status:", error);
          setTrialStatus({ usageCount: 0, isExhausted: false });
        }
      } catch (error) {
        console.error("Failed to load AI settings data:", error);
        toast.error("Failed to load AI settings. Please refresh the page.");
      }
    };

    loadData();
  }, []);

  const refreshTrialStatus = async () => {
    try {
      const trialStatus = await AITrialManager.getTrialStatus();
      setTrialStatus({
        usageCount: trialStatus.trialUsageCount || 0,
        isExhausted: !trialStatus.canUseTrial,
      });
      toast.success("Trial status refreshed");
    } catch (error) {
      console.error("Failed to refresh trial status:", error);
      toast.error("Failed to refresh trial status");
    }
  };

  const handleApiKeyChange = (providerId: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [providerId]: value }));
  };

  const saveApiKey = async (providerId: string) => {
    const key = apiKeys[providerId];
    try {
      if (key && key.trim()) {
        await AIConfigManager.setApiKey(providerId, key.trim());
        toast.success(
          `API key saved for ${
            AI_PROVIDERS.find((p) => p.id === providerId)?.name
          }`
        );
      } else {
        AIConfigManager.removeApiKey(providerId);
        toast.success(
          `API key removed for ${
            AI_PROVIDERS.find((p) => p.id === providerId)?.name
          }`
        );
      }
    } catch (error) {
      console.error(`Failed to save API key for ${providerId}:`, error);
      toast.error(
        `Failed to save API key: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const toggleKeyVisibility = (providerId: string) => {
    setShowKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const testApiKey = async (providerId: string) => {
    const key = apiKeys[providerId];
    if (!key || !key.trim()) {
      toast.error("Please enter an API key first");
      return;
    }

    setTesting((prev) => ({ ...prev, [providerId]: true }));

    try {
      // Create test session data
      const testSession: SessionData = {
        breathHoldTime: 30,
        restlessnessScore: 25,
        patternName: "Box Breathing",
        sessionDuration: 120,
        timestamp: new Date().toISOString(),
        landmarks: 68,
      };

      const result = await analyzeWithProvider(testSession, providerId);

      if (result && !result.error) {
        toast.success(
          `${
            AI_PROVIDERS.find((p) => p.id === providerId)?.name
          } API key is working!`
        );
      } else {
        toast.error(`API key test failed: ${result?.error || "Unknown error"}`);
      }
    } catch (error) {
      toast.error(
        `API key test failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setTesting((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const clearAllKeys = () => {
    AIConfigManager.clearAllKeys();
    setApiKeys({});
    toast.success("All API keys cleared");
  };

  const maskApiKey = (key: string | null | undefined) => {
    if (!key || typeof key !== "string") return "";
    if (key.length <= 8) return "•".repeat(key.length);
    return (
      key.substring(0, 4) +
      "•".repeat(Math.max(key.length - 8, 0)) +
      key.substring(key.length - 4)
    );
  };

  const isKeyConfigured = (providerId: string) => {
    return !!apiKeys[providerId];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI Analysis Settings</h1>
        <p className="text-muted-foreground">
          Configure AI providers to get personalized insights on your breathing
          sessions
        </p>
      </div>

      {/* Trial Status Section */}
      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-blue-500" />
            Free Trial Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trialStatus.isExhausted ? (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Trial Exhausted:</strong> You've used your free AI
                  analysis. Add your own API keys below to continue getting
                  personalized insights.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Gift className="h-4 w-4" />
                <AlertDescription>
                  <strong>Free Trial Available:</strong> You have{" "}
                  {1 - trialStatus.usageCount} free AI analysis remaining. Add
                  your API keys for unlimited analysis.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Trial Usage: {trialStatus.usageCount}/1
              </span>
              <Button variant="outline" size="sm" onClick={refreshTrialStatus}>
                Refresh Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="providers">API Providers</TabsTrigger>
          <TabsTrigger value="about">About AI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid gap-6">
            {AI_PROVIDERS.map((provider) => (
              <Card key={provider.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {provider.name}
                      {isKeyConfigured(provider.id) ? (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Configured
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="w-3 h-3 mr-1" />
                          Not configured
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{provider.description}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Get API Key
                    </a>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`api-key-${provider.id}`}>API Key</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id={`api-key-${provider.id}`}
                          type={showKeys[provider.id] ? "text" : "password"}
                          placeholder={provider.apiKeyPlaceholder}
                          value={apiKeys[provider.id] || ""}
                          onChange={(e) =>
                            handleApiKeyChange(provider.id, e.target.value)
                          }
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => toggleKeyVisibility(provider.id)}
                        >
                          {showKeys[provider.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <Button
                        onClick={() => saveApiKey(provider.id)}
                        disabled={!apiKeys[provider.id]?.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => testApiKey(provider.id)}
                        disabled={
                          !apiKeys[provider.id]?.trim() || testing[provider.id]
                        }
                      >
                        {testing[provider.id] ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4" />
                        )}
                        Test
                      </Button>
                    </div>
                    {isKeyConfigured(provider.id) && !showKeys[provider.id] && (
                      <p className="text-xs text-muted-foreground">
                        Current key: {maskApiKey(apiKeys[provider.id] || "")}
                      </p>
                    )}
                  </div>

                  <Alert>
                    <AlertDescription className="text-sm">
                      <strong>Privacy:</strong> API keys are stored locally in
                      your browser and never sent to our servers. They are only
                      used to communicate directly with {provider.name}.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Configured providers:{" "}
              {AI_PROVIDERS.filter((p) => isKeyConfigured(p.id)).length}/
              {AI_PROVIDERS.length}
            </div>
            <Button variant="destructive" onClick={clearAllKeys} size="sm">
              Clear All API Keys
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Free Trial & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p>
                  <strong>Get started for free!</strong> We provide one free AI
                  analysis to help you experience the value of personalized
                  breathing insights.
                </p>

                <div className="grid gap-3 mt-4">
                  <div className="p-3 border rounded-lg bg-blue-50">
                    <strong>Free Trial:</strong> 1 AI analysis using our server
                    resources
                  </div>
                  <div className="p-3 border rounded-lg bg-green-50">
                    <strong>Unlimited Access:</strong> Add your own API keys for
                    unlimited analysis
                  </div>
                </div>

                <h4 className="font-semibold mt-4">Why This Approach?</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Protects our server costs while offering free trials</li>
                  <li>
                    Gives you full control over your AI provider preferences
                  </li>
                  <li>
                    Ensures your data goes directly to your chosen AI provider
                  </li>
                  <li>Allows unlimited usage once you add your keys</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How AI Analysis Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <p>
                  Our AI analysis feature provides personalized insights on your
                  breathing sessions by analyzing:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Breath Hold Performance:</strong> How long you can
                    comfortably hold your breath
                  </li>
                  <li>
                    <strong>Stillness & Focus:</strong> Your restlessness score
                    during meditation
                  </li>
                  <li>
                    <strong>Session Patterns:</strong> Which breathing
                    techniques work best for you
                  </li>
                  <li>
                    <strong>Progress Tracking:</strong> How you're improving
                    over time
                  </li>
                </ul>

                <h4 className="font-semibold mt-4">What You Get:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Detailed performance analysis</li>
                  <li>Personalized improvement suggestions</li>
                  <li>Numerical scores for different aspects</li>
                  <li>Concrete next steps for progress</li>
                </ul>

                <h4 className="font-semibold mt-4">AI Provider Comparison:</h4>
                <div className="grid gap-3 mt-2">
                  <div className="p-3 border rounded-lg">
                    <strong>OpenAI GPT-4:</strong> Advanced reasoning and
                    detailed explanations
                  </div>
                  <div className="p-3 border rounded-lg">
                    <strong>Anthropic Claude:</strong> Thoughtful,
                    safety-focused insights
                  </div>
                  <div className="p-3 border rounded-lg">
                    <strong>Google Gemini:</strong> Fast analysis with
                    multimodal understanding
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy & Security</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <Alert>
                  <AlertDescription>
                    <strong>Your data is private:</strong> Session data is only
                    sent to the AI providers you configure. API keys are stored
                    locally and never leave your device.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h4 className="font-medium">Data Sent to AI Providers:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Breath hold time (numerical)</li>
                    <li>Restlessness score (numerical)</li>
                    <li>Breathing pattern used</li>
                    <li>Session duration</li>
                    <li>Historical session data (for progress tracking)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Not Sent:</h4>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Personal identifying information</li>
                    <li>Video or audio data</li>
                    <li>Raw facial landmark data</li>
                    <li>Location or device information</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AISettings;
