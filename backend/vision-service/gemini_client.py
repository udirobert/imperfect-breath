"""
Google Gemini AI Client - ENHANCEMENT FIRST
Unified AI analysis with Google Generative AI integration
Follows core principles: DRY, CLEAN, PERFORMANT, MODULAR
"""

import os
import json
import asyncio
from typing import Dict, Any, Optional, AsyncGenerator
import logging
from dataclasses import dataclass

# MODULAR: Import Google Generative AI with graceful fallback
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logging.warning("Google Generative AI SDK not available. Install with: pip install google-generativeai")

logger = logging.getLogger(__name__)

# CLEAN: Configuration with environment-aware defaults
@dataclass
class GeminiConfig:
    """ORGANIZED: Centralized configuration for Gemini integration"""
    api_key: Optional[str] = None
    model: str = "gemini-1.5-flash"
    temperature: float = 0.3
    timeout: float = 15.0
    
    def __post_init__(self):
        if not self.api_key:
            self.api_key = os.getenv('GEMINI_API_KEY')
    
    @property
    def is_configured(self) -> bool:
        """Check if Gemini is properly configured"""
        return bool(self.api_key and GEMINI_AVAILABLE)

# DRY: Single configuration instance
config = GeminiConfig()

class GeminiClient:
    """MODULAR: Unified Gemini client with structured outputs and error handling"""
    
    def __init__(self, config: GeminiConfig):
        self.config = config
        self._model = None
        
    def _get_model(self) -> Optional[Any]:
        """PERFORMANT: Lazy model initialization"""
        if not self.config.is_configured:
            return None
            
        if self._model is None:
            genai.configure(api_key=self.config.api_key)
            self._model = genai.GenerativeModel(self.config.model)
        return self._model
    
    async def analyze_session(self, session_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """ENHANCEMENT FIRST: Enhanced session analysis"""
        model = self._get_model()
        if not model:
            raise Exception("Gemini not configured or SDK not available")
        
        try:
            prompt = self._create_enhanced_prompt(session_data, context)
            
            # Use structured instruction if possible OR just parse JSON
            generation_config = {
                "temperature": self.config.temperature,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 1024,
                "response_mime_type": "application/json",
            }
            
            # PERFORMANT: Use await for thread-safe execution in async context
            response = await asyncio.to_thread(
                model.generate_content,
                prompt,
                generation_config=generation_config
            )
            
            # CLEAN: Parse JSON response
            result = json.loads(response.text)
            
            # ENHANCEMENT FIRST: Add metadata
            result["_metadata"] = {
                "provider": "google",
                "model": self.config.model,
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Gemini analysis failed: {e}")
            raise
    
    def _create_enhanced_prompt(self, session_data: Dict[str, Any], context: Dict[str, Any]) -> str:
        """ENHANCEMENT FIRST: Reuse prompt logic from Cerebras for consistency"""
        # We can eventually share this logic in a base class
        from cerebras_client import client as cerebras_client
        return cerebras_client._create_enhanced_prompt(session_data, context) + \
               "\nIMPORTANT: Your response MUST be valid JSON matching the defined schema."

# DRY: Single client instance
client = GeminiClient(config)

# CLEAN: Public API functions
async def analyze_breathing_session(session_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """ENHANCEMENT FIRST: Entry point for Gemini session analysis"""
    return await client.analyze_session(session_data, context)

def is_available() -> bool:
    """MODULAR: Check availability"""
    return config.is_configured

def get_status() -> Dict[str, Any]:
    """ORGANIZED: Get status for health checks"""
    return {
        "available": is_available(),
        "sdk_installed": GEMINI_AVAILABLE,
        "api_key_configured": bool(config.api_key),
        "model": config.model
    }
