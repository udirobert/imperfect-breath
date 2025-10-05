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
      <CheckCircle className=\"w-4 h-4 text-green-500\" />
    ) : (
      <XCircle className=\"w-4 h-4 text-red-500\" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? \"default\" : \"destructive\"}>
        {success ? \"PASS\" : \"FAIL\"}
      </Badge>
    );
  };

  return (
    <div className=\"w-full max-w-4xl mx-auto space-y-4\">
      {/* Debug Button */}\n      <Card className=\"border-2 border-dashed border-orange-300 bg-orange-50\">\n        <CardHeader className=\"text-center\">\n          <CardTitle className=\"flex items-center justify-center gap-2 text-orange-800\">\n            <Bug className=\"w-5 h-5\" />\n            AI Analysis Debug Tool\n          </CardTitle>\n          <p className=\"text-sm text-orange-600\">\n            🚧 Development tool to diagnose AI analysis issues\n          </p>\n        </CardHeader>\n        <CardContent className=\"text-center\">\n          <Button\n            onClick={handleDebug}\n            disabled={isDebugging}\n            variant=\"outline\"\n            className=\"border-orange-300 text-orange-700 hover:bg-orange-100\"\n          >\n            {isDebugging ? (\n              <>\n                <Loader2 className=\"mr-2 h-4 w-4 animate-spin\" />\n                Running Diagnostics...\n              </>\n            ) : (\n              <>\n                <Bug className=\"mr-2 h-4 w-4\" />\n                Debug AI Analysis\n              </>\n            )}\n          </Button>\n        </CardContent>\n      </Card>\n\n      {/* Debug Results */}\n      {showResults && (\n        <Card>\n          <CardHeader>\n            <CardTitle className=\"flex items-center gap-2\">\n              <Bug className=\"w-5 h-5\" />\n              Debug Results\n              <Badge variant=\"outline\">\n                {debugResults.filter(r => r.success).length}/{debugResults.length} passed\n              </Badge>\n            </CardTitle>\n          </CardHeader>\n          <CardContent className=\"space-y-4\">\n            {debugResults.map((result, index) => (\n              <div\n                key={index}\n                className=\"flex items-start justify-between p-3 border rounded-lg\"\n              >\n                <div className=\"flex items-start gap-3 flex-1\">\n                  {getStatusIcon(result.success)}\n                  <div className=\"flex-1\">\n                    <div className=\"flex items-center gap-2 mb-1\">\n                      <span className=\"font-medium\">{result.step}</span>\n                      {getStatusBadge(result.success)}\n                      {result.timing && (\n                        <Badge variant=\"secondary\" className=\"text-xs\">\n                          <Clock className=\"w-3 h-3 mr-1\" />\n                          {result.timing}ms\n                        </Badge>\n                      )}\n                    </div>\n                    \n                    {result.error && (\n                      <div className=\"text-sm text-red-600 bg-red-50 p-2 rounded mt-2\">\n                        <strong>Error:</strong> {result.error}\n                      </div>\n                    )}\n                    \n                    {result.data && !result.success && (\n                      <details className=\"mt-2\">\n                        <summary className=\"text-sm text-gray-600 cursor-pointer hover:text-gray-800\">\n                          View Details\n                        </summary>\n                        <pre className=\"text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto max-h-40\">\n                          {JSON.stringify(result.data, null, 2)}\n                        </pre>\n                      </details>\n                    )}\n                  </div>\n                </div>\n              </div>\n            ))}\n            \n            {/* Summary */}\n            <div className=\"border-t pt-4 mt-4\">\n              <h4 className=\"font-semibold mb-2\">Quick Diagnosis:</h4>\n              <div className=\"text-sm space-y-1\">\n                {debugResults.find(r => r.step === 'Environment Config' && !r.success) && (\n                  <p className=\"text-red-600\">❌ Environment configuration issue - check VITE_HETZNER_SERVICE_URL</p>\n                )}\n                {debugResults.find(r => r.step === 'Basic Connectivity' && !r.success) && (\n                  <p className=\"text-red-600\">❌ Cannot reach Hetzner server - check network/firewall</p>\n                )}\n                {debugResults.find(r => r.step === 'Health Endpoint' && !r.success) && (\n                  <p className=\"text-red-600\">❌ Health endpoint failed - server may be down or misconfigured</p>\n                )}\n                {debugResults.find(r => r.step === 'AI Analysis Endpoint' && !r.success) && (\n                  <p className=\"text-red-600\">❌ AI endpoint failed - check server API implementation</p>\n                )}\n                {debugResults.every(r => r.success) && (\n                  <p className=\"text-green-600\">✅ All tests passed - AI analysis should work!</p>\n                )}\n              </div>\n            </div>\n            \n            {/* Console Instructions */}\n            <div className=\"bg-blue-50 p-3 rounded border border-blue-200\">\n              <p className=\"text-sm text-blue-800\">\n                💡 <strong>Tip:</strong> Check browser console for detailed logs, or run <code>window.debugAIAnalysis()</code> in console\n              </p>\n            </div>\n          </CardContent>\n        </Card>\n      )}\n    </div>\n  );\n};