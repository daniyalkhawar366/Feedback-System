"""
Simple LLM client wrapper for classification and report generation using LangChain + Groq.
"""
import os
import json
from typing import Dict, Any, Optional
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage


def get_llm(model: str = None, temperature: float = 0.0) -> ChatGroq:
    """
    Get configured LangChain LLM client for Groq.
    
    Args:
        model: Model name (default: from env GROQ_MODEL or llama-3.3-70b-versatile)
        temperature: Sampling temperature
        
    Returns:
        Configured ChatGroq instance
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in environment variables")
    
    model_name = model or os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    return ChatGroq(
        api_key=api_key,
        model=model_name,
        temperature=temperature
    )


def call_llm(
    system_prompt: str, 
    user_prompt: str, 
    model: str = None,
    temperature: float = 0.0,
    json_mode: bool = False
) -> str:
    """
    Make a single LLM call and return the response text.
    
    Args:
        system_prompt: System instructions
        user_prompt: User message
        model: Model identifier (default: from env)
        temperature: Sampling temperature (0 = deterministic)
        json_mode: Whether to request JSON output
        
    Returns:
        Response text from the LLM
    """
    llm = get_llm(model=model, temperature=temperature)
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]
    
    # Add JSON instruction more explicitly for Groq
    if json_mode:
        messages.append(HumanMessage(content="Return ONLY valid JSON. No markdown, no code blocks, no explanations."))
    
    response = llm.invoke(messages)
    
    # Clean response - remove markdown code blocks if present
    content = response.content.strip()
    if content.startswith("```json"):
        content = content[7:]  # Remove ```json
    if content.startswith("```"):
        content = content[3:]  # Remove ```
    if content.endswith("```"):
        content = content[:-3]  # Remove trailing ```
    
    return content.strip()
