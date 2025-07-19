import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { useAIAnalysis } from '../../hooks/useAIAnalysis';
import { AIConfigManager } from '../../lib/ai/config';
import { Loader2, Brain, Zap, Target, TrendingUp, CheckCircle, AlertCircle, Clock, Sparkles } from 'lucide-react';

interface AIAnalysisDemoProps {
  className?: string;
}

const DEMO_SESSION_DATA = {
  patternName: "4-7-8 Breathing",
  sessionDuration: 480, // 8 minutes
  breathHoldTime: 18,
  restlessnessScore: 15,
  bpm: 8,
  consistencyScore: 92,
  cycleCount: 32,
  timestamp: new Date().toISOString(),
  landmarks: 68
};

export const AIAnalysisDemo: React.FC<AIAnalysisDemoProps> = ({ className }) => {
  const [demoStep, setDemoStep] = useState<'setup' | 'analyzing' | 'results'>('setup');
  const [selectedProviders, setSelectedProviders] = useState<string[]>(['google']);
  const [mockMode, setMockMode] = useState(true);

  const {
    analyses,
    isAnalyzing,
    error,
    analyzeSession,
    clearAnalyses,
    clearError
  } = useAIAnalysis();

  const handleStartDemo = useCallback(async () => {
    setDemoStep('analyzing');
    clearAnalyses();
    clearError();

    if (mockMode) {
      // Simulate analysis with mock data
      setTimeout(() => {
        setDemoStep('results');
      }, 2000 + Math.random() * 1000);
    } else {
      try {
        await analyzeSession(DEMO_SESSION_DATA);
        setDemoStep('results');
      } catch (err) {
        console.error('Demo analysis failed:', err);
        setDemoStep('setup');
      }
    }
  }, [mockMode, analyzeSession, clearAnalyses, clearError]);

  const resetDemo = useCallback(() => {
    setDemoStep('setup');
    clearAnalyses();
    clearError();
  }, [clearAnalyses, clearError]);

  const getMockResults = () => {
    return selectedProviders.map(providerId => ({
      provider: providerId,
      analysis: `Excellent session performance! Your ${DEMO_SESSION_DATA.patternName} practice shows remarkable consistency with a ${DEMO_SESSION_DATA.consistencyScore}% consistency score. The low restlessness score of ${DEMO_SESSION_DATA.restlessnessScore} indicates exceptional focus and stillness throughout the ${Math.round(DEMO_SESSION_DATA.sessionDuration / 60)}-minute session.`,
      suggestions: [
        "Continue practicing at this advanced level to maintain your skill",
        "Try extending sessions to 10-12 minutes for deeper benefits",
        "Experiment with breath retention variations",
        "Consider teaching others your technique"
      ],
      nextSteps: [
        "Practice daily at the same time for habit formation",
        "Explore advanced breathing patterns like Wim Hof method",
        "Track your progress in a meditation journal",
        "Join online breathing communities for support"
      ],
      score: {
        overall: 94,
        focus: 96,
        consistency: DEMO_SESSION_DATA.consistencyScore,
        progress: 91
      }
    }));
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google': return '🧠';
      case 'openai': return '🤖';
      case 'anthropic': return '🎭';
      default: return '🔮';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google': return 'Google Gemini';
      case 'openai': return 'OpenAI GPT-4';
      case 'anthropic': return 'Anthropic Claude';
      default: return 'Unknown Provider';
    }
  };

  const displayResults = mockMode ? getMockResults() : analyses;

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI Analysis Demo
          </h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Experience the power of multi-provider AI analysis for breathing sessions.
          Get insights from Google Gemini, OpenAI GPT-4, and Anthropic Claude.
        </p>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Phase 2: Complete ✅
        </Badge>
      </div>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Demo Configuration
          </CardTitle>
          <CardDescription>
            Configure your AI analysis demonstration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Session Data Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Demo Session Data</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Pattern:</span>
                <div className="font-medium">{DEMO_SESSION_DATA.patternName}</div>
              </div>
              <div>
                <span className="text-gray-500">Duration:</span>
                <div className="font-medium">{Math.round(DEMO_SESSION_DATA.sessionDuration / 60)} minutes</div>
              </div>
              <div>
                <span className="text-gray-500">Consistency:</span>
                <div className="font-medium">{DEMO_SESSION_DATA.consistencyScore}%</div>
              </div>
              <div>
                <span className="text-gray-500">Restlessness:</span>
                <div className="font-medium">{DEMO_SESSION_DATA.restlessnessScore}/100</div>
              </div>
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">AI Providers to Test</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'google', name: 'Google Gemini', icon: '🧠' },
                { id: 'openai', name: 'OpenAI GPT-4', icon: '🤖' },
                { id: 'anthropic', name: 'Anthropic Claude', icon: '🎭' }
              ].map(provider => (
                <label key={provider.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProviders.includes(provider.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProviders([...selectedProviders, provider.id]);
                      } else {
                        setSelectedProviders(selectedProviders.filter(p => p !== provider.id));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {provider.icon} {provider.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Mock Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <div className="font-medium text-blue-900">Demo Mode</div>
              <div className="text-sm text-blue-700">
                {mockMode ? 'Using simulated responses (no API calls)' : 'Using real AI providers (requires API keys)'}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMockMode(!mockMode)}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {mockMode ? 'Switch to Real APIs' : 'Switch to Demo Mode'}
            </Button>
          </div>

          {/* Start Demo Button */}
          <Button
            onClick={handleStartDemo}
            disabled={isAnalyzing || selectedProviders.length === 0 || demoStep === 'analyzing'}
            className="w-full"
            size="lg"
          >
            {demoStep === 'analyzing' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing with AI Providers...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Start AI Analysis Demo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      {demoStep === 'analyzing' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="font-medium">Processing with {selectedProviders.length} AI provider(s)...</span>
              </div>
              <Progress value={75} className="w-full" />
              <div className="flex justify-center gap-4">
                {selectedProviders.map(provider => (
                  <div key={provider} className="text-center">
                    <div className="text-2xl mb-1">{getProviderIcon(provider)}</div>
                    <div className="text-xs text-gray-600">{getProviderName(provider)}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {demoStep === 'results' && displayResults.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Analysis Results</h2>
            <Button onClick={resetDemo} variant="outline">
              Run Another Demo
            </Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
              <TabsTrigger value="comparison">Provider Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Score Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Overall Score', value: displayResults[0]?.score.overall || 0, icon: Target, color: 'text-green-600' },
                  { label: 'Focus', value: displayResults[0]?.score.focus || 0, icon: Brain, color: 'text-blue-600' },
                  { label: 'Consistency', value: displayResults[0]?.score.consistency || 0, icon: CheckCircle, color: 'text-purple-600' },
                  { label: 'Progress', value: displayResults[0]?.score.progress || 0, icon: TrendingUp, color: 'text-orange-600' }
                ].map((metric) => (
                  <Card key={metric.label}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <metric.icon className={`h-5 w-5 ${metric.color}`} />
                        <span className="text-2xl font-bold">{metric.value}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{metric.label}</div>
                      <Progress value={metric.value} className="mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {displayResults[0]?.analysis || 'Analysis complete! Your breathing session shows excellent performance across all metrics.'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-4">
              {displayResults.map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{getProviderIcon(result.provider)}</span>
                      {getProviderName(result.provider)} Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Analysis</h4>
                      <p className="text-gray-700">{result.analysis}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Suggestions</h4>
                      <ul className="space-y-1">
                        {result.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Next Steps</h4>
                      <ul className="space-y-1">
                        {result.nextSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Provider Comparison</CardTitle>
                  <CardDescription>
                    Compare insights from different AI providers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Provider</th>
                          <th className="text-center p-2">Overall</th>
                          <th className="text-center p-2">Focus</th>
                          <th className="text-center p-2">Consistency</th>
                          <th className="text-center p-2">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayResults.map((result, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <span>{getProviderIcon(result.provider)}</span>
                                <span className="font-medium">{getProviderName(result.provider)}</span>
                              </div>
                            </td>
                            <td className="text-center p-2">
                              <Badge variant="outline">{result.score.overall}</Badge>
                            </td>
                            <td className="text-center p-2">
                              <Badge variant="outline">{result.score.focus}</Badge>
                            </td>
                            <td className="text-center p-2">
                              <Badge variant="outline">{result.score.consistency}</Badge>
                            </td>
                            <td className="text-center p-2">
                              <Badge variant="outline">{result.score.progress}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Analysis failed: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Features Showcase */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900">Phase 2 Features Completed ✅</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-purple-800">Multi-Provider Support</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>✅ Google Gemini Integration</li>
                <li>✅ OpenAI GPT-4 Integration</li>
                <li>✅ Anthropic Claude Integration</li>
                <li>✅ Automatic Failover System</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-purple-800">Enhanced Analysis</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>✅ Comprehensive Scoring System</li>
                <li>✅ Personalized Suggestions</li>
                <li>✅ Progress Tracking</li>
                <li>✅ Pattern Generation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAnalysisDemo;
