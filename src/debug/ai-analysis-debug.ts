/**
 * AI Analysis Debug Utilities
 * 
 * Comprehensive debugging tools to identify AI analysis failures
 */

import { config } from '../config/environment';
import { API_ENDPOINTS } from '../config/api-endpoints';

export interface DebugResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
  timing?: number;
}

export class AIAnalysisDebugger {
  private results: DebugResult[] = [];

  async runFullDiagnostic(): Promise<DebugResult[]> {
    this.results = [];
    
    console.log('🔍 Starting AI Analysis Debug Diagnostic...');
    
    // Step 1: Check environment configuration
    await this.checkEnvironmentConfig();
    
    // Step 2: Test basic connectivity
    await this.testBasicConnectivity();
    
    // Step 3: Test health endpoint
    await this.testHealthEndpoint();
    
    // Step 4: Test AI analysis endpoint
    await this.testAIAnalysisEndpoint();
    
    // Step 5: Test with real session data
    await this.testWithRealSessionData();
    
    console.log('🔍 Debug Diagnostic Complete:', this.results);
    return this.results;
  }

  private async checkEnvironmentConfig(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const envConfig = {
        VITE_HETZNER_SERVICE_URL: import.meta.env.VITE_HETZNER_SERVICE_URL,
        VITE_AI_SERVICE_URL: import.meta.env.VITE_AI_SERVICE_URL,
        configuredAiUrl: config.services.ai.url,
        configuredTimeout: config.services.ai.timeout,
        configuredRetries: config.services.ai.retries,
        aiEndpoint: API_ENDPOINTS.ai.analysis,
        healthEndpoint: API_ENDPOINTS.ai.health,
        isProduction: import.meta.env.PROD,
        isDevelopment: import.meta.env.DEV,
        currentUrl: window.location.origin
      };
      
      console.log('🔧 Environment Config:', envConfig);
      
      const hasHetznerUrl = !!import.meta.env.VITE_HETZNER_SERVICE_URL;
      const isUsingLocalhost = config.services.ai.url.includes('localhost');
      
      this.results.push({
        step: 'Environment Config',
        success: hasHetznerUrl || isUsingLocalhost,
        data: envConfig,
        timing: Date.now() - startTime,
        error: !hasHetznerUrl && !isUsingLocalhost ? 'No Hetzner URL configured and not using localhost' : undefined
      });
    } catch (error) {
      this.results.push({
        step: 'Environment Config',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: Date.now() - startTime
      });
    }
  }

  private async testBasicConnectivity(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const baseUrl = config.services.ai.url;
      console.log(`🌐 Testing basic connectivity to: ${baseUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(baseUrl, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      this.results.push({
        step: 'Basic Connectivity',
        success: true,
        data: {
          url: baseUrl,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        },
        timing: Date.now() - startTime
      });
    } catch (error) {
      console.error('❌ Basic connectivity failed:', error);
      
      this.results.push({
        step: 'Basic Connectivity',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: Date.now() - startTime
      });
    }
  }

  private async testHealthEndpoint(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const healthUrl = `${config.services.ai.url}${API_ENDPOINTS.ai.health}`;\n      console.log(`🏥 Testing health endpoint: ${healthUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      let responseData;
      try {
        responseData = await response.text();
        if (responseData) {
          try {
            responseData = JSON.parse(responseData);
          } catch {
            // Keep as text if not JSON
          }
        }
      } catch {
        responseData = 'Could not read response';
      }
      
      this.results.push({
        step: 'Health Endpoint',
        success: response.ok,
        data: {
          url: healthUrl,
          status: response.status,
          statusText: response.statusText,
          response: responseData,
          headers: Object.fromEntries(response.headers.entries())
        },
        timing: Date.now() - startTime,
        error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : undefined
      });
    } catch (error) {
      console.error('❌ Health endpoint failed:', error);
      
      this.results.push({
        step: 'Health Endpoint',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: Date.now() - startTime
      });
    }
  }

  private async testAIAnalysisEndpoint(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const aiUrl = `${config.services.ai.url}${API_ENDPOINTS.ai.analysis}`;
      console.log(`🤖 Testing AI analysis endpoint: ${aiUrl}`);
      
      const testPayload = {
        provider: 'openai',
        session_data: {
          patternName: 'Debug Test',
          sessionDuration: 60,
          breathHoldTime: 10,
          restlessnessScore: 30,
          landmarks: 68,
          timestamp: new Date().toISOString()
        },
        analysis_type: 'session'
      };
      
      console.log('📤 Sending test payload:', testPayload);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(aiUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload),
        mode: 'cors',
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      let responseData;
      try {
        const responseText = await response.text();
        console.log('📥 Raw response:', responseText);
        
        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
          } catch {
            responseData = responseText;
          }
        }
      } catch {
        responseData = 'Could not read response';
      }
      
      this.results.push({
        step: 'AI Analysis Endpoint',
        success: response.ok,
        data: {
          url: aiUrl,
          status: response.status,
          statusText: response.statusText,
          request: testPayload,
          response: responseData,
          headers: Object.fromEntries(response.headers.entries())
        },
        timing: Date.now() - startTime,
        error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : undefined
      });
    } catch (error) {
      console.error('❌ AI analysis endpoint failed:', error);
      
      this.results.push({
        step: 'AI Analysis Endpoint',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: Date.now() - startTime
      });
    }
  }

  private async testWithRealSessionData(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Simulate real session data from a completed session
      const realSessionData = {
        patternName: 'Box Breathing',
        sessionDuration: 300,
        breathHoldTime: 15,
        restlessnessScore: 25,
        landmarks: 68,
        timestamp: new Date().toISOString(),
        visionMetrics: {
          confidence: 0.85,
          postureScore: 0.75,
          movementLevel: 0.2,
          stillnessPercentage: 80,
          consistencyScore: 0.9
        }
      };
      
      const aiUrl = `${config.services.ai.url}${API_ENDPOINTS.ai.analysis}`;
      console.log(`🎯 Testing with real session data: ${aiUrl}`);
      console.log('📤 Real session payload:', realSessionData);
      
      const payload = {
        provider: 'openai',
        session_data: realSessionData,
        analysis_type: 'session'
      };
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(aiUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        mode: 'cors',
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      let responseData;
      try {
        const responseText = await response.text();
        console.log('📥 Real session response:', responseText);
        
        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
          } catch {
            responseData = responseText;
          }
        }
      } catch {
        responseData = 'Could not read response';
      }
      
      this.results.push({
        step: 'Real Session Data Test',
        success: response.ok,
        data: {
          url: aiUrl,
          status: response.status,
          statusText: response.statusText,
          request: payload,
          response: responseData,
          headers: Object.fromEntries(response.headers.entries())
        },
        timing: Date.now() - startTime,
        error: !response.ok ? `HTTP ${response.status}: ${response.statusText}` : undefined
      });
    } catch (error) {
      console.error('❌ Real session data test failed:', error);
      
      this.results.push({
        step: 'Real Session Data Test',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timing: Date.now() - startTime
      });
    }
  }

  generateReport(): string {
    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    
    let report = `\n🔍 AI Analysis Debug Report\n`;
    report += `═══════════════════════════════════\n`;
    report += `Overall: ${successCount}/${totalCount} tests passed\n\n`;
    
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const timing = result.timing ? ` (${result.timing}ms)` : '';
      
      report += `${index + 1}. ${status} ${result.step}${timing}\n`;
      
      if (result.error) {
        report += `   Error: ${result.error}\n`;
      }
      
      if (result.data && !result.success) {
        report += `   Data: ${JSON.stringify(result.data, null, 2)}\n`;
      }
      
      report += `\n`;
    });
    
    return report;
  }
}

// Export convenience function
export const debugAIAnalysis = async (): Promise<DebugResult[]> => {
  const debugger = new AIAnalysisDebugger();
  return await debugger.runFullDiagnostic();
};

// Global debug function for browser console
if (typeof window !== 'undefined') {
  (window as any).debugAIAnalysis = async () => {
    const debugger = new AIAnalysisDebugger();
    const results = await debugger.runFullDiagnostic();
    console.log(debugger.generateReport());
    return results;
  };
}