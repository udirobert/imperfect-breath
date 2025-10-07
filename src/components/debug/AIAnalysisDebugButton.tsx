/**
 * AI Analysis Debug Button
 *
 * Temporary debug component to test AI analysis flow
 * Add this to Results.tsx for debugging
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Loader2, Bug, CheckCircle, XCircle, Clock } from 'lucide-react';
import { debugAIAnalysis, type DebugResult } from '../../debug/ai-analysis-debug';

export const AIAnalysisDebugButton: React.FC = () => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleDebug = async () => {
    setIsDebugging(true);
    setShowResults(false);

    try {
      console.log('🔍 Starting AI Analysis Debug...');
      const results = await debugAIAnalysis();
      setDebugResults(results);
      setShowResults(true);

      // Also log to console for easy copying
      const successCount = results.filter(r => r.success).length;
      console.log(`🔍 Debug Complete: ${successCount}/${results.length} tests passed`);
      console.table(results.map(r => ({
        Step: r.step,
        Success: r.success ? '✅' : '❌',
        Timing: r.timing ? `${r.timing}ms` : 'N/A',
        Error: r.error || 'None'
      })));
    } catch (error) {
      console.error('❌ Debug failed:', error);
      setDebugResults([{
        step: 'Debug Execution',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
      setShowResults(true);
    } finally {
      setIsDebugging(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "PASS" : "FAIL"}
      </Badge>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Debug Button */}
      <Card className="border-2 border-dashed border-orange-300 bg-orange-50">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-orange-800">
            <Bug className="w-5 h-5" />
            AI Analysis Debug Tool
          </CardTitle>
          <p className="text-sm text-orange-600">
            🚧 Development tool to diagnose AI analysis issues
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            onClick={handleDebug}
            disabled={isDebugging}
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            {isDebugging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              <>
                <Bug className="mr-2 h-4 w-4" />
                Debug AI Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Debug Results */}
      {showResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              Debug Results
              <Badge variant="outline">
                {debugResults.filter(r => r.success).length}/{debugResults.length} passed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {debugResults.map((result, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 border rounded-lg"
              >
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(result.success)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.step}</span>
                      {getStatusBadge(result.success)}
                      {result.timing && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {result.timing}ms
                        </Badge>
                      )}
                    </div>

                    {result.error && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}

                    {result.data && !result.success && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                          View Details
                        </summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-40">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Summary */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold mb-2">Quick Diagnosis:</h4>
              <div className="text-sm space-y-1">
                {debugResults.find(r => r.step === 'Environment Config' && !r.success) && (
                  <p className="text-red-600">❌ Environment configuration issue - check VITE_HETZNER_SERVICE_URL</p>
                )}
                {debugResults.find(r => r.step === 'Basic Connectivity' && !r.success) && (
                  <p className="text-red-600">❌ Cannot reach Hetzner server - check network/firewall</p>
                )}
                {debugResults.find(r => r.step === 'Health Endpoint' && !r.success) && (
                  <p className="text-red-600">❌ Health endpoint failed - server may be down or misconfigured</p>
                )}
                {debugResults.find(r => r.step === 'AI Analysis Endpoint' && !r.success) && (
                  <p className="text-red-600">❌ AI endpoint failed - check server API implementation</p>
                )}
                {debugResults.every(r => r.success) && (
                  <p className="text-green-600">✅ All tests passed - AI analysis should work!</p>
                )}
              </div>
            </div>

            {/* Console Instructions */}
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Check browser console for detailed logs, or run <code>window.debugAIAnalysis()</code> in console
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
