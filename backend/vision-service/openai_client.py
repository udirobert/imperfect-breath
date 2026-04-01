"""
OpenAI GPT Client - ENHANCEMENT FIRST
Unified AI analysis with OpenAI API integration
Follows core principles: DRY, CLEAN, PERFORMANT, MODULAR
"""

import os
import json
import asyncio
from typing import Dict, Any, Optional, AsyncGenerator
import logging
from dataclasses import dataclass

# MODULAR: Import OpenAI with graceful fallback
try:
    from openai import OpenAI, AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logging.warning("OpenAI SDK not available. Install with: pip install openai")

logger = logging.getLogger(__name__)

# CLEAN: Configuration with environment-aware defaults
@dataclass
class OpenAIConfig:
    """ORGANIZED: Centralized configuration for OpenAI integration"""
    api_key: Optional[str] = None
    model: str = "gpt-4o-mini"
    max_tokens: int = 500
    temperature: float = 0.3
    timeout: float = 15.0
    
    def __post_init__(self):
        if not self.api_key:
            self.api_key = os.getenv('OPENAI_API_KEY')
    
    @property
    def is_configured(self) -> bool:
        """Check if OpenAI is properly configured"""
        return bool(self.api_key and OPENAI_AVAILABLE)

# DRY: Single configuration instance
config = OpenAIConfig()

class OpenAIClient:
    """MODULAR: Unified OpenAI client with structured outputs and error handling"""
    
    def __init__(self, config: OpenAIConfig):
        self.config = config
        self._client = None
        
    def _get_client(self) -> Optional[Any]:
        """PERFORMANT: Lazy client initialization"""
        if not self.config.is_configured:
            return None
            
        if self._client is None:
            # We'll use synchronous client wrapped in asyncio.to_thread for stability
            self._client = OpenAI(api_key=self.config.api_key)
        return self._client
    
    async def analyze_session(self, session_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """ENHANCEMENT FIRST: Enhanced session analysis"""
        client = self._get_client()
        if not client:
            raise Exception("OpenAI not configured or SDK not available")
        
        try:
            from cerebras_client import client as cerebras_client
            schema = cerebras_client._get_analysis_schema()
            prompt = cerebras_client._create_enhanced_prompt(session_data, context)
            
            # PERFORMANT: Use structured outputs with timeout
            response = await asyncio.to_thread(
                client.chat.completions.create,
                model=self.config.model,
                messages=[
                    {"role": "system", "content": "You are an expert meditation coach providing personalized breathing session analysis."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
                response_format={ "type": "json_object" } # Using JSON object mode
            )
            
            # CLEAN: Parse structured response
            content = response.choices[0].message.content
            result = json.loads(content)
            
            # ENHANCEMENT FIRST: Add metadata
            result["_metadata"] = {
                "provider": "openai",
                "model": self.config.model,
            }
            
            return result
            
        except Exception as e:
            logger.error(f"OpenAI analysis failed: {e}")
            raise

# DRY: Single client instance
client = OpenAIClient(config)

# CLEAN: Public API functions
async def analyze_breathing_session(session_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """ENHANCEMENT FIRST: Entry point for OpenAI session analysis"""
    return await client.analyze_session(session_data, context)

def is_available() -> bool:
    """MODULAR: Check availability"""
    return config.is_configured

def get_status() -> Dict[str, Any]:
    """ORGANIZED: Get status for health checks"""
    return {
        "available": is_available(),
        "sdk_installed": OPENAI_AVAILABLE,
        "api_key_configured": bool(config.api_key),
        "model": config.model
    }
