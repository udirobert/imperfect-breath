#!/usr/bin/env node

/**
 * Hetzner Server Health Check Script
 * 
 * Run this script to test your Hetzner server from command line:
 * node test-hetzner-server.js YOUR_HETZNER_URL
 */

const https = require('https');
const http = require('http');

const HETZNER_URL = process.argv[2] || 'http://localhost:8001';

console.log(`🔍 Testing Hetzner server: ${HETZNER_URL}`);
console.log('═'.repeat(50));

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    const req = client.request(url, {
      method: 'GET',
      timeout: 5000,
      ...options
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const timing = Date.now() - startTime;
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: data,
          timing: timing
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    console.log(`   URL: ${url}`);
    
    const result = await makeRequest(url, options);
    
    const success = result.status >= 200 && result.status < 300;
    const icon = success ? '✅' : '❌';
    
    console.log(`   ${icon} Status: ${result.status} ${result.statusText} (${result.timing}ms)`);
    
    if (result.headers['content-type']) {
      console.log(`   📄 Content-Type: ${result.headers['content-type']}`);
    }
    
    if (result.data && result.data.length < 500) {
      console.log(`   📥 Response: ${result.data}`);
    } else if (result.data) {
      console.log(`   📥 Response: ${result.data.length} bytes`);
    }
    
    return success;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testAIAnalysis(baseUrl) {
  const url = `${baseUrl}/api/ai-analysis`;
  const payload = JSON.stringify({
    provider: 'openai',
    session_data: {
      patternName: 'Test Pattern',
      sessionDuration: 60,
      breathHoldTime: 10,
      restlessnessScore: 30,
      landmarks: 68,
      timestamp: new Date().toISOString()
    },
    analysis_type: 'session'
  });
  
  return await testEndpoint('AI Analysis', url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: payload
  });
}

async function main() {
  console.log(`🚀 Starting health check for: ${HETZNER_URL}\n`);
  
  const tests = [
    () => testEndpoint('Basic Connectivity', HETZNER_URL),
    () => testEndpoint('Health Endpoint', `${HETZNER_URL}/health`),
    () => testEndpoint('Vision Health', `${HETZNER_URL}/api/vision/health`),
    () => testAIAnalysis(HETZNER_URL),
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await test();
    results.push(result);
  }
  
  console.log('\n' + '═'.repeat(50));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(50));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All tests passed! Your Hetzner server looks healthy.');
  } else {
    console.log('❌ Some tests failed. Check the errors above.');
    
    if (!results[0]) {
      console.log('\n🔧 TROUBLESHOOTING:');
      console.log('- Check if server is running');
      console.log('- Verify the URL is correct');
      console.log('- Check firewall/security group settings');
    }
    
    if (results[0] && !results[1]) {
      console.log('\n🔧 TROUBLESHOOTING:');
      console.log('- Server is reachable but /health endpoint missing');
      console.log('- Check server implementation');
    }
    
    if (results[1] && !results[3]) {
      console.log('\n🔧 TROUBLESHOOTING:');
      console.log('- Health endpoint works but AI analysis fails');
      console.log('- Check /api/ai-analysis endpoint implementation');
      console.log('- Verify AI provider configuration');
    }
  }
  
  console.log('\n🌐 Test your server in browser:');
  console.log(`   Health: ${HETZNER_URL}/health`);
  console.log(`   AI API: ${HETZNER_URL}/api/ai-analysis`);
}

if (require.main === module) {
  main().catch(console.error);
}