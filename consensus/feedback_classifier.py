"""
STEP 1: Per-Feedback Classification (Parallel, Cheap LLM)

Each feedback is classified independently.
Returns structured labels only - no prose, no summaries.
"""
import json
from typing import Dict, List
from consensus.llm_client import call_llm, get_llm


CLASSIFICATION_SYSTEM_PROMPT = """You are an NLP classification engine.
Your task is to analyze event feedback and return a strict JSON object.
Do not explain anything.
Do not add extra text."""


def build_classification_prompt(feedback_text: str) -> str:
    """Build the user prompt for feedback classification."""
    return f"""Analyze the following event feedback.

Feedback:
"{feedback_text}"

Return JSON with:
- sentiment: one of ["positive", "neutral", "negative"]
- confidence: float between 0 and 1
- intent: one of ["praise", "complaint", "suggestion", "neutral"]
- aspects: list from:
  ["content", "speaker", "organization", "time_management", "interaction", "venue", "audio", "overall"]
- issue_label: (CRITICAL for specificity)
  * If feedback is negative/complaint/suggestion: return a short snake_case label describing the SPECIFIC issue
    Examples: "poor_internet_connectivity", "insufficient_mentor_availability", "judging_bias_toward_demos", 
              "unclear_instructions", "noisy_venue", "poor_audio_quality", "lack_of_breaks"
  * If feedback is positive/praise: return a short snake_case label for the SPECIFIC strength
    Examples: "excellent_networking_opportunities", "knowledgeable_mentors", "well_organized_schedule"
  * If neutral or no specific issue: return null
- evidence_quote: extract the KEY PHRASE (max 80 chars) from the feedback that captures the core issue/strength
  Example: For "The internet was terrible and slow" → "internet was terrible and slow"
  If no clear phrase, return null

JSON format:
{{
  "sentiment": "",
  "confidence": 0.0,
  "intent": "",
  "aspects": [],
  "issue_label": null,
  "evidence_quote": null
}}"""


def classify_single_feedback(feedback_text: str, model: str = None) -> Dict:
    """
    Classify a single feedback using LLM.
    
    Args:
        feedback_text: The feedback text to classify
        model: LLM model to use (default: from env)
        
    Returns:
        Dict with sentiment, confidence, intent, aspects
        
    Raises:
        Exception if classification fails
    """
    user_prompt = build_classification_prompt(feedback_text)
    
    try:
        response = call_llm(
            system_prompt=CLASSIFICATION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            model=model,
            temperature=0.0,
            json_mode=True
        )
        
        result = json.loads(response)
        
        # Validate structure
        required_keys = {"sentiment", "confidence", "intent", "aspects"}
        if not required_keys.issubset(result.keys()):
            raise ValueError(f"Missing required keys. Got: {result.keys()}")
        
        # Add optional fields if missing
        if "issue_label" not in result:
            result["issue_label"] = None
        if "evidence_quote" not in result:
            result["evidence_quote"] = None
        
        # Validate values
        valid_sentiments = {"positive", "neutral", "negative"}
        valid_intents = {"praise", "complaint", "suggestion", "neutral"}
        valid_aspects = {
            "content", "speaker", "organization", "time_management", 
            "interaction", "venue", "audio", "overall"
        }
        
        if result["sentiment"] not in valid_sentiments:
            raise ValueError(f"Invalid sentiment: {result['sentiment']}")
        
        if result["intent"] not in valid_intents:
            raise ValueError(f"Invalid intent: {result['intent']}")
        
        if not isinstance(result["aspects"], list):
            raise ValueError("aspects must be a list")
        
        # Filter invalid aspects
        result["aspects"] = [a for a in result["aspects"] if a in valid_aspects]
        
        # Ensure confidence is float between 0 and 1
        result["confidence"] = max(0.0, min(1.0, float(result["confidence"])))
        
        return result
        
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse LLM response as JSON: {e}")
    except Exception as e:
        raise Exception(f"Classification failed: {e}")


async def classify_feedbacks_parallel(feedbacks: List[Dict], model: str = None) -> List[Dict]:
    """
    Classify multiple feedbacks in parallel using asyncio.
    
    Args:
        feedbacks: List of dicts with 'id' and 'text' keys
        model: LLM model to use
        
    Returns:
        List of classification results with feedback_id
    """
    import asyncio
    from concurrent.futures import ThreadPoolExecutor
    
    def classify_with_id(feedback: Dict) -> Dict:
        """Classify feedback and attach its ID."""
        try:
            result = classify_single_feedback(feedback["text"], model=model)
            result["feedback_id"] = feedback["id"]
            result["status"] = "success"
            return result
        except Exception as e:
            return {
                "feedback_id": feedback["id"],
                "status": "failed",
                "error": str(e)
            }
    
    # Run classifications in parallel using thread pool
    with ThreadPoolExecutor(max_workers=10) as executor:
        loop = asyncio.get_event_loop()
        tasks = [
            loop.run_in_executor(executor, classify_with_id, fb)
            for fb in feedbacks
        ]
        results = await asyncio.gather(*tasks)
    
    return results
