#!/bin/bash

# 🚀 Quick Server Check for AI Analysis
# Run this on snel-bot to quickly check AI service status

echo "🔍 Quick AI Service Check"
echo "========================"

# 1. Check if service is running
echo "1. Service Status:"
if pgrep -f "main.py" > /dev/null; then
    echo "   ✅ AI service is running"
    ps aux | grep main.py | grep -v grep | head -1
else
    echo "   ❌ AI service not running"
fi

# 2. Check port
echo ""
echo "2. Port 8001 Status:"
if netstat -tlnp 2>/dev/null | grep :8001 > /dev/null || ss -tlnp 2>/dev/null | grep :8001 > /dev/null; then
    echo "   ✅ Port 8001 is listening"
else
    echo "   ❌ Port 8001 not listening"
fi

# 3. Quick health check
echo ""
echo "3. Health Check:"
if command -v curl > /dev/null; then
    response=$(curl -s -w "%{http_code}" http://localhost:8001/health)
    if [[ "$response" == *"200" ]]; then
        echo "   ✅ Health endpoint responding"
    else
        echo "   ❌ Health endpoint failed: $response"
    fi
else
    echo "   ⚠️  curl not available"
fi

# 4. Quick AI test
echo ""
echo "4. AI Endpoint Test:"
if command -v curl > /dev/null; then
    response=$(curl -s -w "%{http_code}" -H "Content-Type: application/json" \
        -d '{"provider":"openai","session_data":{"patternName":"Test","sessionDuration":60,"breathHoldTime":10,"restlessnessScore":30},"analysis_type":"session"}' \
        http://localhost:8001/api/ai-analysis)
    
    if [[ "$response" == *"200" ]]; then
        echo "   ✅ AI endpoint responding"
    else
        echo "   ❌ AI endpoint failed: $response"
    fi
else
    echo "   ⚠️  curl not available"
fi

# 5. Recent logs
echo ""
echo "5. Recent Logs:"
if [ -f "app.log" ]; then
    echo "   Last 3 log entries:"
    tail -3 app.log
elif [ -f "main.log" ]; then
    echo "   Last 3 log entries:"
    tail -3 main.log
else
    echo "   No log files found"
fi

echo ""
echo "🎯 Quick Check Complete"
echo "======================"