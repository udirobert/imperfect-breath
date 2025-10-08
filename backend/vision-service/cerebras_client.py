"""
Cerebras AI Client - ENHANCEMENT FIRST
Unified AI analysis with Cerebras Cloud SDK integration
Follows core principles: DRY, CLEAN, PERFORMANT, MODULAR
"""

import os
import json
import asyncio
from typing import Dict, Any, Optional, AsyncGenerator
import logging
from dataclasses import dataclass

# MODULAR: Import Cerebras SDK with graceful fallback
try:
    from cerebras.cloud.sdk import Cerebras
    CEREBRAS_AVAILABLE = True
except ImportError:
    CEREBRAS_AVAILABLE = False
    # Create a dummy class for type annotations
    class Cerebras:
        pass
    logging.warning("Cerebras SDK not available. Install with: pip install cerebras-cloud-sdk")

logger = logging.getLogger(__name__)

# CLEAN: Configuration with environment-aware defaults
@dataclass
class CerebrasConfig:
    """ORGANIZED: Centralized configuration for Cerebras integration"""
    api_key: Optional[str] = None
    model: str = "llama-4-scout-17b-16e-instruct"
    max_tokens: int = 500
    temperature: float = 0.3
    timeout: float = 15.0
    
    def __post_init__(self):
        if not self.api_key:
            self.api_key = os.getenv('CEREBRAS_API_KEY')
    
    @property
    def is_configured(self) -> bool:
        """Check if Cerebras is properly configured"""
        return bool(self.api_key and CEREBRAS_AVAILABLE)

# DRY: Single configuration instance
config = CerebrasConfig()

class CerebrasClient:
    """MODULAR: Unified Cerebras client with structured outputs and error handling"""
    
    def __init__(self, config: CerebrasConfig):
        self.config = config
        self._client = None
        
    def _get_client(self) -> Optional[Cerebras]:
        """PERFORMANT: Lazy client initialization with caching"""
        if not self.config.is_configured:
            return None
            
        if self._client is None:
            self._client = Cerebras(api_key=self.config.api_key)
        return self._client
    
    async def analyze_session(self, session_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """ENHANCEMENT FIRST: Enhanced session analysis with structured outputs"""
        client = self._get_client()
        if not client:
            raise Exception("Cerebras not configured or SDK not available")
        
        try:
            # CLEAN: Use structured outputs for reliable JSON responses
            schema = self._get_analysis_schema()
            prompt = self._create_enhanced_prompt(session_data, context)
            
            # PERFORMANT: Use structured outputs with timeout
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    client.chat.completions.create,
                    model=self.config.model,
                    messages=[
                        {"role": "system", "content": "You are an expert meditation coach providing personalized breathing session analysis."},
                        {"role": "user", "content": prompt}
                    ],
                    max_completion_tokens=self.config.max_tokens,
                    temperature=self.config.temperature,
                    response_format={
                        "type": "json_schema",
                        "json_schema": {
                            "name": "session_analysis",
                            "strict": True,
                            "schema": schema
                        }
                    }
                ),
                timeout=self.config.timeout
            )
            
            # CLEAN: Parse structured response
            content = response.choices[0].message.content
            result = json.loads(content)
            
            # ENHANCEMENT FIRST: Add metadata for tracking
            result["_metadata"] = {
                "provider": "cerebras",
                "model": self.config.model,
                "processing_time": getattr(response, 'processing_time', None),
                "tokens_used": getattr(response.usage, 'total_tokens', None) if hasattr(response, 'usage') else None
            }
            
            return result
            
        except asyncio.TimeoutError:
            logger.error(f"Cerebras API timeout after {self.config.timeout}s")
            raise Exception("AI analysis timed out")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Cerebras response as JSON: {e}")
            raise Exception("Invalid AI response format")
        except Exception as e:
            logger.error(f"Cerebras analysis failed: {e}")
            raise
    
    async def analyze_session_streaming(self, session_data: Dict[str, Any], context: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """ENHANCEMENT FIRST: Enhanced session analysis with streaming responses"""
        client = self._get_client()
        if not client:
            raise Exception("Cerebras not configured or SDK not available")
        
        try:
            # CLEAN: Use structured outputs for reliable JSON responses
            schema = self._get_analysis_schema()
            prompt = self._create_enhanced_prompt(session_data, context)
            
            # PERFORMANT: Use streaming with structured outputs
            stream = await asyncio.to_thread(
                client.chat.completions.create,
                model=self.config.model,
                messages=[
                    {"role": "system", "content": "You are an expert meditation coach providing personalized breathing session analysis."},
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
                stream=True,  # Enable streaming
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "session_analysis",
                        "strict": True,
                        "schema": schema
                    }
                }
            )
            
            # Yield each chunk as it arrives
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"Cerebras streaming analysis failed: {e}")
            yield json.dumps({"error": str(e)})
    
    def _get_analysis_schema(self) -> Dict[str, Any]:
        """ORGANIZED: JSON schema for structured outputs"""
        return {
            "type": "object",
            "properties": {
                "overallScore": {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 100,
                    "description": "Overall session quality score"
                },
                "phaseInsights": {
                    "type": "object",
                    "properties": {
                        "inhale": {"type": "string"},
                        "exhale": {"type": "string"},
                        "hold": {"type": "string"}
                    },
                    "required": ["inhale", "exhale", "hold"],
                    "additionalProperties": False
                },
                "temporalInsights": {
                    "type": "string",
                    "description": "Observations about progress during the session"
                },
                "nextSteps": {
                    "type": "array",
                    "items": {"type": "string"},
                    "minItems": 2,
                    "maxItems": 4,
                    "description": "Actionable recommendations"
                },
                "encouragement": {
                    "type": "string",
                    "description": "Personalized encouraging message"
                }
            },
            "required": ["overallScore", "phaseInsights", "temporalInsights", "nextSteps", "encouragement"],
            "additionalProperties": False
        }
    
    def _create_enhanced_prompt(self, session_data: Dict[str, Any], context: Dict[str, Any]) -> str:
        """ENHANCEMENT FIRST: Rich prompt with comprehensive session data"""
        # Extract enhanced data
        phase_analysis = session_data.get('phase_analysis', {})
        temporal_data = session_data.get('temporal_progression', [])
        movement_pattern = session_data.get('movement_pattern', {})
        stability_trend = movement_pattern.get('stability_trend', 'unknown')
        
        # CLEAN: Build phase insights section
        phase_text = self._format_phase_analysis(phase_analysis)
        
        # CLEAN: Build temporal progression section
        temporal_text = self._format_temporal_progression(temporal_data)
        
        # ORGANIZED: Build comprehensive prompt
        return f"""Analyze this breathing meditation session and provide personalized coaching insights.

## SESSION OVERVIEW
Pattern: {context.get('patternName', 'Custom')} ({context.get('difficulty', 'intermediate')} level)
Duration: {session_data.get('duration', 0):.0f} seconds
Completed Cycles: {context.get('cycleCount', 0)}
Target BPM: {context.get('bpm', 'N/A')}

## BIOMETRIC ANALYSIS
{phase_text}

## TEMPORAL PROGRESSION
{temporal_text}

## STABILITY ASSESSMENT
Movement Trend: {stability_trend}
Overall Stillness: {session_data.get('stillness_percentage', 0):.1f}%
Consistency Score: {session_data.get('consistency_score', 0):.1f}/100

## COACHING GUIDELINES
- Use warm, encouraging language
- Focus on progress and growth mindset
- Provide specific, actionable guidance
- Avoid technical jargon
- Celebrate achievements while suggesting improvements

Provide analysis in the specified JSON format with personalized insights based on this data."""
    
    def _format_phase_analysis(self, phase_analysis: Dict[str, Any]) -> str:
        """CLEAN: Format phase analysis data"""
        if not phase_analysis:
            return "No phase-specific data available (session too short or no camera data)"
        
        formatted = []
        for phase, data in phase_analysis.items():
            stillness = data.get('avg_stillness', 0)
            consistency = data.get('consistency', 0)
            sample_count = data.get('sample_count', 0)
            
            formatted.append(
                f"• {phase.title()}: {stillness:.1f}% stillness, "
                f"{consistency:.2f} consistency ({sample_count} samples)"
            )
        
        return "\n".join(formatted)
    
    def _format_temporal_progression(self, temporal_data: list) -> str:
        """CLEAN: Format temporal progression data"""
        if not temporal_data:
            return "No temporal progression data available"
        
        formatted = []
        for i, snapshot in enumerate(temporal_data):
            timestamp = snapshot.get('timestamp', 0)
            stillness = snapshot.get('stillness', 0)
            confidence = snapshot.get('confidence', 0)
            
            formatted.append(
                f"• {timestamp:.0f}s: {stillness:.1f}% stillness "
                f"(confidence: {confidence:.2f})"
            )
        
        return "\n".join(formatted)

# DRY: Single client instance
client = CerebrasClient(config)

# CLEAN: Public API functions
async def analyze_breathing_session(session_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """ENHANCEMENT FIRST: Main entry point for session analysis"""
    return await client.analyze_session(session_data, context)

async def analyze_breathing_session_streaming(session_data: Dict[str, Any], context: Dict[str, Any]) -> AsyncGenerator[str, None]:
    """ENHANCEMENT FIRST: Main entry point for streaming session analysis"""
    async for chunk in client.analyze_session_streaming(session_data, context):
        yield chunk

def is_available() -> bool:
    """MODULAR: Check if Cerebras integration is available"""
    return config.is_configured

def get_status() -> Dict[str, Any]:
    """ORGANIZED: Get integration status for health checks"""
    return {
        "available": is_available(),
        "sdk_installed": CEREBRAS_AVAILABLE,
        "api_key_configured": bool(config.api_key),
        "model": config.model
    }

# AGGRESSIVE CONSOLIDATION: Legacy functions removed
# Deprecated: call_cerebras_api, create_enhanced_prompt
# Use analyze_breathing_session instead