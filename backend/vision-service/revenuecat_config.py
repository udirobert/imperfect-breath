"""
RevenueCat Configuration Endpoint

This module provides secure access to RevenueCat API keys for the frontend.
Keys are stored as environment variables on the server and never exposed
in client-side code.
"""

import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Create router for RevenueCat configuration
router = APIRouter(prefix="/api/config", tags=["configuration"])

class RevenueCatConfig(BaseModel):
    """RevenueCat configuration response model"""
    ios: str
    android: str
    available: bool

@router.get("/revenuecat", response_model=RevenueCatConfig)
async def get_revenuecat_config():
    """
    Get RevenueCat API keys for client initialization.
    
    Returns:
        RevenueCatConfig: Configuration with iOS and Android API keys
        
    Note:
        Keys are stored as environment variables:
        - REVENUECAT_IOS_KEY
        - REVENUECAT_ANDROID_KEY
    """
    try:
        # Get keys from environment variables (without VITE_ prefix)
        ios_key = os.getenv("REVENUECAT_IOS_KEY", "")
        android_key = os.getenv("REVENUECAT_ANDROID_KEY", "")
        
        # Check if at least one key is available
        available = bool(ios_key or android_key)
        
        if not available:
            logger.warning("RevenueCat keys not configured in environment")
            # Return empty keys but indicate service is available
            return RevenueCatConfig(
                ios="",
                android="",
                available=False
            )
        
        logger.info("RevenueCat configuration requested - keys available")
        
        return RevenueCatConfig(
            ios=ios_key,
            android=android_key,
            available=available
        )
        
    except Exception as e:
        logger.error(f"Error retrieving RevenueCat configuration: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve RevenueCat configuration"
        )

@router.get("/revenuecat/status")
async def get_revenuecat_status():
    """
    Check if RevenueCat is properly configured.
    
    Returns:
        dict: Status information about RevenueCat configuration
    """
    ios_key = os.getenv("REVENUECAT_IOS_KEY", "")
    android_key = os.getenv("REVENUECAT_ANDROID_KEY", "")
    
    return {
        "ios_configured": bool(ios_key),
        "android_configured": bool(android_key),
        "available": bool(ios_key or android_key),
        "message": "RevenueCat configuration status"
    }
