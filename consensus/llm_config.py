"""
LLM configuration and initialization for report generation.
Supports multiple providers: Groq, OpenAI, Anthropic.
"""

import os
from typing import Optional
from langchain_core.language_models import BaseChatModel


def get_llm(provider: Optional[str] = None, model: Optional[str] = None) -> BaseChatModel:
    """
    Initialize and return configured LLM based on environment variables.
    
    Args:
        provider: Override provider (groq|openai|anthropic). Defaults to LLM_PROVIDER env var.
        model: Override model name. Defaults to provider-specific env var.
    
    Returns:
        Configured LangChain chat model instance.
    
    Raises:
        ValueError: If provider is unknown or API key is missing.
        ImportError: If required provider package is not installed.
    """
    provider = provider or os.getenv("LLM_PROVIDER", "groq").lower()
    
    if provider == "groq":
        try:
            from langchain_groq import ChatGroq
        except ImportError:
            raise ImportError(
                "langchain-groq not installed. Install with: pip install langchain-groq"
            )
        
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set in environment")
        
        model_name = model or os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        
        return ChatGroq(
            groq_api_key=api_key,
            model_name=model_name,
            temperature=0.1,  # Low temperature for consistent extraction
            max_tokens=4096,
            timeout=60.0,
            max_retries=3,  # Retry on rate limits
        )
    
    elif provider == "openai":
        try:
            from langchain_openai import ChatOpenAI
        except ImportError:
            raise ImportError(
                "langchain-openai not installed. Install with: pip install langchain-openai"
            )
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set in environment")
        
        model_name = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        
        return ChatOpenAI(
            openai_api_key=api_key,
            model=model_name,
            temperature=0.1,
            max_tokens=4096,
            timeout=60.0,
        )
    
    elif provider == "anthropic":
        try:
            from langchain_anthropic import ChatAnthropic
        except ImportError:
            raise ImportError(
                "langchain-anthropic not installed. Install with: pip install langchain-anthropic"
            )
        
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not set in environment")
        
        model_name = model or os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
        
        return ChatAnthropic(
            anthropic_api_key=api_key,
            model=model_name,
            temperature=0.1,
            max_tokens=4096,
            timeout=60.0,
        )
    
    else:
        raise ValueError(
            f"Unknown LLM provider: {provider}. "
            f"Supported providers: groq, openai, anthropic"
        )


def test_llm_connection() -> dict:
    """
    Test LLM connection and return provider info.
    
    Returns:
        Dict with provider, model, and test result.
    """
    try:
        llm = get_llm()
        provider = os.getenv("LLM_PROVIDER", "groq")
        
        # Get model name
        if provider == "groq":
            model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        elif provider == "openai":
            model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        else:
            model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
        
        # Test invoke
        response = llm.invoke("Say 'OK' if you can read this.")
        
        return {
            "status": "success",
            "provider": provider,
            "model": model,
            "response": response.content[:100],
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
        }
