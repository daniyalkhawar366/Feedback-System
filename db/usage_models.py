"""
MongoDB Model for API Usage Monitoring
Tracks LLM API token usage and costs
"""
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class APIUsageDocument(Document):
    """
    Track LLM API usage (tokens, costs, latency) per request
    """
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Request details
    provider: str  # "groq", "openai", etc.
    model: str  # Model name used
    operation: str  # "classify_feedback", "generate_report", "analyze_sentiment", etc.
    
    # Token usage
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cached_tokens: int = 0  # input tokens billed at cached-input rate

    # Cost (in USD)
    prompt_cost: float
    completion_cost: float
    cached_cost: float = 0.0  # cost for cached-input tokens
    total_cost: float
    
    # Performance
    latency_ms: float  # Response time in milliseconds
    
    # Context
    event_id: Optional[str] = None  # Related event if applicable
    user_id: Optional[str] = None  # User who triggered the request
    status: str = "success"  # "success", "error", "timeout"
    error_message: Optional[str] = None
    
    class Settings:
        name = "api_usage"
        indexes = [
            "timestamp",
            "provider",
            "operation",
            "event_id",
            [("timestamp", -1), ("provider", 1)],  # Compound index for time-series queries
        ]
        
    class Config:
        json_schema_extra = {
            "example": {
                "timestamp": "2026-03-04T10:30:00",
                "provider": "openai",
                "model": "gpt-5-mini",
                "operation": "classify_feedback",
                "prompt_tokens": 1250,
                "completion_tokens": 150,
                "total_tokens": 1400,
                "cached_tokens": 800,
                "prompt_cost": 0.0001125,
                "completion_cost": 0.0003,
                "cached_cost": 0.00002,
                "total_cost": 0.0004325,
                "latency_ms": 1250.5,
                "event_id": "507f1f77bcf86cd799439011",
                "status": "success"
            }
        }
