"""
Cerebras API Client - HACKATHON INTEGRATION
Lightning-fast AI analysis with Cerebras + Meta Llama
"""

import os
import json
import asyncio
from typing import Dict, Any
import httpx

async def call_cerebras_api(prompt: str) -> Dict[str, Any]:
    """HACKATHON: Lightning-fast AI analysis with Cerebras"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://api.cerebras.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {os.getenv('CEREBRAS_API_KEY')}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-4-scout-17b-16e-instruct",  # Meta Llama via Cerebras
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 400,
                    "temperature": 0.3,
                    "stream": False
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result["choices"][0]["message"]["content"]
                
                # Try to parse as JSON, fallback to text
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    return {"analysis": content, "provider": "cerebras"}
            else:
                raise Exception(f"Cerebras API error: {response.status_code}")
                
    except Exception as e:
        print(f"Cerebras API failed: {e}")
        raise

def create_enhanced_prompt(session_data: Dict, context: Dict) -> str:
    """HACKATHON: Rich prompt with phase-specific data and premium language"""
    phase_analysis = session_data.get('phase_analysis', {})
    temporal_data = session_data.get('temporal_progression', [])
    stability_trend = session_data.get('movement_pattern', {}).get('stability_trend', 'unknown')
    
    # Build phase insights
    phase_text = ""
    for phase, data in phase_analysis.items():
        phase_text += f"- {phase}: {data['avg_stillness']:.1f}% stillness (consistency: {data['consistency']:.2f})\n"
    
    # Build temporal progression
    temporal_text = ""
    if temporal_data:
        for i, snapshot in enumerate(temporal_data):
            temporal_text += f"  {snapshot['timestamp']:.0f}s: {snapshot['stillness']:.1f}% stillness\n"
    
    return f"""You are a premium meditation coach analyzing a user's {context.get('patternName', 'breathing')} session. 

SESSION DATA:
Pattern: {context.get('patternName', 'Unknown')} ({context.get('difficulty', 'intermediate')} level)
Duration: {session_data.get('duration', 0):.0f}s | Cycles: {context.get('cycleCount', 0)}

BIOMETRIC ANALYSIS:
{phase_text or "No phase-specific data available"}

PROGRESSION OVER TIME:
{temporal_text or "No temporal data available"}

STABILITY PATTERN: {stability_trend}
OVERALL STILLNESS: {session_data.get('stillness_percentage', 0):.1f}%

Provide coaching insights using warm, encouraging language focused on the user's journey. Avoid technical jargon.

Respond with JSON:
{{
  "overallScore": number (0-100),
  "phaseInsights": {{
    "inhale": "gentle guidance for drawing breath in",
    "exhale": "supportive tip for releasing breath",
    "hold": "calming advice for moments of stillness"
  }},
  "temporalInsights": "encouraging observation about their progress during the session",
  "nextSteps": ["warm, actionable guidance", "supportive next step"],
  "encouragement": "personalized, uplifting message celebrating their practice and progress"
}}"""
