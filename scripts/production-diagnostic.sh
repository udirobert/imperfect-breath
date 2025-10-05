#!/bin/bash

echo "🔍 Production Backend Diagnostic for api.imperfectform.fun"
echo "=========================================================="

# Test the current frontend URL
echo "1. Testing Frontend URL (HTTPS):"
curl -v -X OPTIONS \
  -H "Origin: https://imperfectbreath.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://api.imperfectform.fun/api/ai-analysis 2>&1 | head -20

echo -e "\n2. Testing HTTP version:"
curl -v -X OPTIONS \
  -H "Origin: https://imperfectbreath.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  http://api.imperfectform.fun/api/ai-analysis 2>&1 | head -20

echo -e "\n3. Testing Direct Port Access:"
curl -v -X OPTIONS \
  -H "Origin: https://imperfectbreath.netlify.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  http://157.180.36.156:8001/api/ai-analysis 2>&1 | head -20

echo -e "\n4. Testing Health Endpoints:"
echo "HTTPS Health:"
curl -s https://api.imperfectform.fun/health || echo "HTTPS health failed"

echo "HTTP Health:"
curl -s http://api.imperfectform.fun/health || echo "HTTP health failed"

echo "Direct Port Health:"
curl -s http://157.180.36.156:8001/health || echo "Direct port health failed"

echo -e "\n5. DNS Resolution:"
nslookup api.imperfectform.fun

echo -e "\n🎯 Run this script to diagnose the current state"