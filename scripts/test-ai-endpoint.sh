#!/bin/bash

# 🧪 Test AI Analysis Endpoint
# Run this on snel-bot to test the AI analysis functionality

echo "🧪 Testing AI Analysis Endpoint"
echo "==============================="

# Test data that matches what the frontend sends
TEST_DATA='{
  "provider": "openai",
  "session_data": {
    "patternName": "Box Breathing",
    "sessionDuration": 300,
    "breathHoldTime": 15,
    "restlessnessScore": 25,
    "landmarks": 68,
    "timestamp": "2024-01-05T12:00:00.000Z",
    "visionMetrics": {
      "confidence": 0.85,
      "postureScore": 0.75,
      "movementLevel": 0.2,
      "stillnessPercentage": 80,
      "consistencyScore": 0.9
    }
  },
  "analysis_type": "session"
}'

echo "Test data:"
echo "$TEST_DATA" | jq . 2>/dev/null || echo "$TEST_DATA"
echo ""

echo "Testing endpoint: http://localhost:8001/api/ai-analysis"
echo "Method: POST"
echo "Content-Type: application/json"
echo ""

if command -v curl > /dev/null; then
    echo "Sending request..."
    echo "=================="
    
    # Make the request and capture both response and status
    response=$(curl -s -w "\n---\nHTTP Status: %{http_code}\nTime: %{time_total}s\nSize: %{size_download} bytes\n" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "$TEST_DATA" \
        http://localhost:8001/api/ai-analysis)
    
    echo "Response:"
    echo "$response"
    echo ""
    
    # Check if response contains expected fields
    if echo "$response" | grep -q "analysis"; then
        echo "✅ Response contains 'analysis' field"
    else
        echo "❌ Response missing 'analysis' field"
    fi
    
    if echo "$response" | grep -q "suggestions"; then
        echo "✅ Response contains 'suggestions' field"
    else
        echo "❌ Response missing 'suggestions' field"
    fi
    
    if echo "$response" | grep -q "score"; then
        echo "✅ Response contains 'score' field"
    else
        echo "❌ Response missing 'score' field"
    fi
    
else
    echo "❌ curl not available"
    echo "Install curl: apt-get install curl"
fi

echo ""
echo "🎯 Test Complete"
echo "================"
echo "If the test fails, check:"
echo "1. Is the service running? (ps aux | grep main.py)"
echo "2. Is port 8001 open? (netstat -tlnp | grep 8001)"
echo "3. Are API keys configured?"
echo "4. Check service logs for errors"