"""
Cost Calculator for LLM API Providers
Calculates costs based on token usage and provider pricing.
Supports cached-input discount for reusable system prompts.
"""
from typing import Dict

# Pricing per 1M tokens (as of 2026)
# Update these based on current provider pricing
PRICING = {
    "groq": {
        "llama-3.3-70b-versatile": {
            "prompt": 0.59,  # per 1M tokens
            "completion": 0.79,  # per 1M tokens
            "cached_input": 0.59,  # Groq has no cached discount
        },
        "llama-3.1-70b-versatile": {
            "prompt": 0.59,
            "completion": 0.79,
            "cached_input": 0.59,
        },
        "llama-3.1-8b-instant": {
            "prompt": 0.05,
            "completion": 0.08,
            "cached_input": 0.05,
        },
        "mixtral-8x7b-32768": {
            "prompt": 0.24,
            "completion": 0.24,
            "cached_input": 0.24,
        },
    },
    "openai": {
        "gpt-5-mini": {
            "prompt": 0.25,       # $0.25 per 1M input tokens
            "completion": 2.00,   # $2.00 per 1M output tokens
            "cached_input": 0.025,  # $0.025 per 1M cached input tokens
        },
        "gpt-4-turbo": {
            "prompt": 10.0,
            "completion": 30.0,
            "cached_input": 5.0,
        },
        "gpt-4": {
            "prompt": 30.0,
            "completion": 60.0,
            "cached_input": 15.0,
        },
        "gpt-3.5-turbo": {
            "prompt": 0.50,
            "completion": 1.50,
            "cached_input": 0.25,
        },
    },
    "anthropic": {
        "claude-3-opus": {
            "prompt": 15.0,
            "completion": 75.0,
            "cached_input": 7.5,
        },
        "claude-3-sonnet": {
            "prompt": 3.0,
            "completion": 15.0,
            "cached_input": 1.5,
        },
        "claude-3-haiku": {
            "prompt": 0.25,
            "completion": 1.25,
            "cached_input": 0.125,
        },
    },
}


def calculate_cost(
    provider: str,
    model: str,
    prompt_tokens: int,
    completion_tokens: int,
    cached_tokens: int = 0,
) -> Dict[str, float]:
    """
    Calculate cost for an LLM API call.

    When *cached_tokens* > 0 the corresponding portion of prompt tokens is
    billed at the discounted ``cached_input`` rate instead of the regular
    ``prompt`` rate.  The remaining ``(prompt_tokens - cached_tokens)`` are
    billed at the normal prompt rate.

    Args:
        provider: API provider name (e.g., "openai")
        model: Model name (e.g., "gpt-5-mini")
        prompt_tokens: Total number of input tokens (including cached)
        completion_tokens: Number of output tokens
        cached_tokens: Number of input tokens treated as cached

    Returns:
        Dictionary with prompt_cost, cached_cost, completion_cost, and total_cost in USD
    """
    # Get pricing for provider and model
    provider_pricing = PRICING.get(provider.lower(), {})
    model_pricing = provider_pricing.get(model, None)

    # If pricing not found, estimate with generic pricing
    if not model_pricing:
        # Default fallback pricing (conservative estimate)
        model_pricing = {"prompt": 1.0, "completion": 2.0, "cached_input": 0.5}

    cached_tokens = min(cached_tokens, prompt_tokens)  # safety clamp
    non_cached_prompt_tokens = prompt_tokens - cached_tokens

    # Calculate costs (pricing is per 1M tokens)
    prompt_cost = (non_cached_prompt_tokens / 1_000_000) * model_pricing["prompt"]
    cached_cost = (cached_tokens / 1_000_000) * model_pricing.get("cached_input", model_pricing["prompt"])
    completion_cost = (completion_tokens / 1_000_000) * model_pricing["completion"]
    total_cost = prompt_cost + cached_cost + completion_cost

    return {
        "prompt_cost": round(prompt_cost, 8),
        "cached_cost": round(cached_cost, 8),
        "completion_cost": round(completion_cost, 8),
        "total_cost": round(total_cost, 8),
    }


def get_model_pricing(provider: str, model: str) -> Dict[str, float]:
    """
    Get pricing information for a specific model

    Returns:
        Dictionary with prompt, completion, and cached_input pricing per 1M tokens
    """
    provider_pricing = PRICING.get(provider.lower(), {})
    return provider_pricing.get(model, {"prompt": 0.0, "completion": 0.0, "cached_input": 0.0})
