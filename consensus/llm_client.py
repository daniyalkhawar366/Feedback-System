"""
Simple LLM client wrapper for classification and report generation using LangChain + OpenAI.
Includes token usage and cost tracking for monitoring.
Supports cached input tokens for static system prompts (discounted rate).
"""
import os
import json
import time
import asyncio
import hashlib
import threading
from typing import Dict, Any, Optional, Set
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from helpers.cost_calculator import calculate_cost

# ---------------------------------------------------------------------------
# Event-loop reference for cross-thread usage tracking.
# When call_llm runs inside a ThreadPoolExecutor (e.g. parallel classification)
# there is no running event loop in that thread.  We capture the main loop so
# _track_usage_async can schedule coroutines via run_coroutine_threadsafe.
# ---------------------------------------------------------------------------
_MAIN_LOOP: Optional[asyncio.AbstractEventLoop] = None
_LOOP_LOCK = threading.Lock()


def init_event_loop() -> None:
    """Capture the currently-running event loop for cross-thread scheduling.

    Call this from any async context (e.g. the pipeline entry point) **before**
    dispatching synchronous work to a thread pool.
    """
    global _MAIN_LOOP
    try:
        loop = asyncio.get_running_loop()
        with _LOOP_LOCK:
            _MAIN_LOOP = loop
    except RuntimeError:
        pass


# ---------------------------------------------------------------------------
# Cached-prompt registry
# System prompts registered here are treated as "cached input" and billed at
# the discounted cached-input rate.  The set stores SHA-256 hashes so we never
# keep prompt text in memory longer than needed.
# ---------------------------------------------------------------------------
_CACHED_PROMPT_HASHES: Set[str] = set()


def register_cached_prompt(prompt_text: str) -> None:
    """Register a system prompt as cacheable (static / reusable)."""
    _CACHED_PROMPT_HASHES.add(hashlib.sha256(prompt_text.encode()).hexdigest())


def _is_cached_prompt(prompt_text: str) -> bool:
    """Check whether a system prompt has been registered as cached."""
    return hashlib.sha256(prompt_text.encode()).hexdigest() in _CACHED_PROMPT_HASHES


def get_llm(model: str = None, temperature: float = 0.0) -> ChatOpenAI:
    """
    Get configured LangChain LLM client for OpenAI.

    Args:
        model: Model name (default: from env OPENAI_MODEL or gpt-5-mini)
        temperature: Sampling temperature

    Returns:
        Configured ChatOpenAI instance
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables")

    model_name = model or os.getenv("OPENAI_MODEL", "gpt-5-mini")

    return ChatOpenAI(
        api_key=api_key,
        model=model_name,
        temperature=temperature,
    )


def call_llm(
    system_prompt: str, 
    user_prompt: str, 
    model: str = None,
    temperature: float = 0.0,
    json_mode: bool = False,
    operation: str = "llm_call",
    event_id: Optional[str] = None,
    track_usage: bool = True
) -> str:
    """
    Make a single LLM call and return the response text.
    Automatically tracks token usage and costs for monitoring.
    
    Args:
        system_prompt: System instructions
        user_prompt: User message
        model: Model identifier (default: from env)
        temperature: Sampling temperature (0 = deterministic)
        json_mode: Whether to request JSON output
        operation: Operation name for tracking (e.g., "classify_feedback", "generate_report")
        event_id: Related event ID for context tracking
        track_usage: Whether to track token usage and costs (default: True)
        
    Returns:
        Response text from the LLM
    """
    # Get model info
    provider = os.getenv("LLM_PROVIDER", "openai")
    model_name = model or os.getenv("OPENAI_MODEL", "gpt-5-mini")
    
    llm = get_llm(model=model, temperature=temperature)
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]
    
    # Add JSON instruction explicitly for the model
    if json_mode:
        messages.append(HumanMessage(content="Return ONLY valid JSON. No markdown, no code blocks, no explanations."))
    
    # Track timing
    start_time = time.time()
    status = "success"
    error_message = None
    
    try:
        response = llm.invoke(messages)
        latency_ms = (time.time() - start_time) * 1000

        # -----------------------------------------------------------------
        # Extract token usage from OpenAI response.usage (NOT response_metadata)
        # OpenAI responses expose usage via response.usage_metadata or the
        # underlying response object.  LangChain surfaces it in
        # response.response_metadata["token_usage"] as well, but we prefer
        # the canonical response.usage_metadata added by langchain-openai.
        # -----------------------------------------------------------------
        if track_usage:
            prompt_tokens = 0
            completion_tokens = 0
            total_tokens = 0
            cached_tokens = 0

            # Primary path: response.usage_metadata (langchain-openai >=0.1)
            usage_meta = getattr(response, "usage_metadata", None)
            if usage_meta:
                prompt_tokens = getattr(usage_meta, "input_tokens", 0) or usage_meta.get("input_tokens", 0) if isinstance(usage_meta, dict) else getattr(usage_meta, "input_tokens", 0)
                completion_tokens = getattr(usage_meta, "output_tokens", 0) or usage_meta.get("output_tokens", 0) if isinstance(usage_meta, dict) else getattr(usage_meta, "output_tokens", 0)
                total_tokens = getattr(usage_meta, "total_tokens", 0) or usage_meta.get("total_tokens", 0) if isinstance(usage_meta, dict) else getattr(usage_meta, "total_tokens", 0)

            # Fallback: response_metadata.token_usage (dict)
            if total_tokens == 0 and hasattr(response, "response_metadata"):
                usage_dict = response.response_metadata.get("token_usage", {})
                prompt_tokens = usage_dict.get("prompt_tokens", 0)
                completion_tokens = usage_dict.get("completion_tokens", 0)
                total_tokens = usage_dict.get("total_tokens", 0)

            # Determine cached tokens ---
            # If the system prompt is registered as cached, the entire
            # system-prompt portion of prompt_tokens is treated as cached.
            if _is_cached_prompt(system_prompt):
                # Estimate cached tokens: we know the system message token
                # count isn't returned separately by OpenAI, so we treat
                # ALL prompt tokens as cached when the prompt is registered.
                # This is accurate when the system prompt dominates the
                # input (which it does for our classification / report
                # generation prompts).  For a more precise split, callers
                # can pass the user-prompt separately in the future.
                cached_tokens = prompt_tokens  # conservative: full prompt cached

            _track_usage_async(
                provider=provider,
                model=model_name,
                operation=operation,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                cached_tokens=cached_tokens,
                latency_ms=latency_ms,
                event_id=event_id,
                status=status,
                error_message=error_message,
            )
        
        # Clean response - remove markdown code blocks if present
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:]  # Remove ```json
        if content.startswith("```"):
            content = content[3:]  # Remove ```
        if content.endswith("```"):
            content = content[:-3]  # Remove trailing ```
        
        return content.strip()
        
    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000
        status = "error"
        error_message = str(e)
        
        if track_usage:
            _track_usage_async(
                provider=provider,
                model=model_name,
                operation=operation,
                prompt_tokens=0,
                completion_tokens=0,
                total_tokens=0,
                cached_tokens=0,
                latency_ms=latency_ms,
                event_id=event_id,
                status=status,
                error_message=error_message,
            )

        raise


def _track_usage_async(
    provider: str,
    model: str,
    operation: str,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
    cached_tokens: int,
    latency_ms: float,
    event_id: Optional[str],
    status: str,
    error_message: Optional[str],
):
    """
    Track API usage in background (non-blocking).
    Separates cached-input cost from regular prompt cost.

    Works in two modes:
    1. Called from an async context (e.g. report generation) → create_task()
    2. Called from a thread-pool worker (e.g. parallel classification) →
       run_coroutine_threadsafe() on the captured main event loop.
    """
    try:
        # Calculate costs (with cached-input discount)
        costs = calculate_cost(
            provider, model, prompt_tokens, completion_tokens,
            cached_tokens=cached_tokens,
        )

        coro = _store_usage(
            provider=provider,
            model=model,
            operation=operation,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cached_tokens=cached_tokens,
            prompt_cost=costs["prompt_cost"],
            completion_cost=costs["completion_cost"],
            cached_cost=costs["cached_cost"],
            total_cost=costs["total_cost"],
            latency_ms=latency_ms,
            event_id=event_id,
            status=status,
            error_message=error_message,
        )

        # --- schedule the coroutine on whatever loop is available ---
        try:
            # Fast path: we are inside an async context in this thread
            loop = asyncio.get_running_loop()
            loop.create_task(coro)
            return
        except RuntimeError:
            pass

        # Slow path: no running loop in this thread (thread-pool worker).
        # Use the captured main-thread loop.
        with _LOOP_LOCK:
            loop = _MAIN_LOOP

        if loop is not None and loop.is_running():
            asyncio.run_coroutine_threadsafe(coro, loop)
        else:
            print("Warning: No event loop available for usage tracking")

    except Exception as e:
        # Don't let tracking errors break the main flow
        print(f"Warning: Failed to track usage: {e}")


async def _store_usage(
    provider: str,
    model: str,
    operation: str,
    prompt_tokens: int,
    completion_tokens: int,
    total_tokens: int,
    cached_tokens: int,
    prompt_cost: float,
    completion_cost: float,
    cached_cost: float,
    total_cost: float,
    latency_ms: float,
    event_id: Optional[str],
    status: str,
    error_message: Optional[str],
):
    """
    Store usage data in MongoDB
    """
    try:
        from db.usage_models import APIUsageDocument
        from datetime import datetime

        usage_doc = APIUsageDocument(
            timestamp=datetime.utcnow(),
            provider=provider,
            model=model,
            operation=operation,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cached_tokens=cached_tokens,
            prompt_cost=prompt_cost,
            completion_cost=completion_cost,
            cached_cost=cached_cost,
            total_cost=total_cost,
            latency_ms=latency_ms,
            event_id=event_id,
            status=status,
            error_message=error_message,
        )

        await usage_doc.insert()
    except Exception as e:
        print(f"Warning: Failed to store usage data: {e}")
