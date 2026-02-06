"""
Simplified feedback report generator for event speakers.
Produces clear, actionable insights without technical jargon.
"""

from typing import List, Dict
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from consensus.llm_config import get_llm
from consensus.dimension_extraction import dimension_extraction_graph
from consensus.types import Category, FeedbackRetrospective, Discussion, Message

class ImprovementArea(BaseModel):
    """An area that needs improvement with actionable suggestion"""
    issue: str = Field(description="What the problem is")
    suggestion: str = Field(description="Specific action the speaker can take")


class FeedbackReport(BaseModel):
    """Complete feedback analysis report"""
    overall_summary: str = Field(description="2-3 sentences summarizing the overall reception")
    positive_themes: List[str] = Field(description="List of clear descriptions of what attendees loved")
    improvement_areas: List[ImprovementArea] = Field(description="List of issues with specific suggestions")


FEEDBACK_SUMMARY_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an AI assistant helping event speakers understand their feedback.

Given a list of attendee feedback, create a clear, actionable report.

Rules:
1. Group feedback into clear themes (3-5 themes max)
2. For each positive theme, explain what worked well
3. For areas to improve, explain the issue AND suggest specific actions
4. Use simple, conversational language - no technical terms
5. Be specific and actionable - avoid vague statements
"""),
    ("user", """Analyze this feedback:

Positive feedback:
{positive_feedback}

Negative feedback:
{negative_feedback}

Neutral feedback:
{neutral_feedback}

Generate a clear, actionable report.""")
])


def extract_dimensions_for_feedbacks(feedbacks: List[Dict], event_title: str) -> List[FeedbackRetrospective]:
    """
    Extract full dimensions from feedback using LLM with batching to avoid rate limits.
    
    Args:
        feedbacks: List of feedback dicts with 'text' key
        event_title: Title of the event for context
        
    Returns:
        List of FeedbackRetrospective dimension objects
    """
    if not feedbacks:
        return []
    
    import time
    
    # Process in batches of 4 to stay under Groq's 12k token/minute limit
    BATCH_SIZE = 4
    all_dimensions = []
    
    for batch_idx in range(0, len(feedbacks), BATCH_SIZE):
        batch = feedbacks[batch_idx:batch_idx + BATCH_SIZE]
        batch_num = (batch_idx // BATCH_SIZE) + 1
        total_batches = (len(feedbacks) + BATCH_SIZE - 1) // BATCH_SIZE
        
        print(f"📦 Processing batch {batch_num}/{total_batches} ({len(batch)} feedbacks)...")
        
        # Prepare discussion format for dimension extraction
        discussion = Discussion(
            name=event_title,
            description=f"Feedback for {event_title}",
            messages=[Message(id=i, message=f['text']) for i, f in enumerate(batch)]
        )
        
        # Try up to 3 times with increasing timeout
        max_retries = 3
        batch_dimensions = []
        
        for attempt in range(max_retries):
            try:
                print(f"  🔄 Attempt {attempt + 1}/{max_retries}...")
                llm = get_llm()
                result = dimension_extraction_graph.invoke(
                    {
                        "discussion": discussion,
                        "category": Category.FEEDBACK_RETROSPECTIVE
                    },
                    config={"configurable": {"llm": llm}}
                )
                batch_dimensions = result.get("dimensions", [])
                print(f"  ✅ Extracted {len(batch_dimensions)} dimensions from batch")
                break
            except Exception as e:
                error_msg = str(e)
                print(f"  ⚠️ Batch attempt {attempt + 1} failed: {error_msg}")
                
                # Check if it's a rate limit error
                if "rate_limit" in error_msg.lower() or "429" in error_msg:
                    # Extract wait time from error message or use default
                    import re
                    match = re.search(r'try again in ([\d.]+)s', error_msg)
                    wait_time = float(match.group(1)) if match else 12
                    print(f"  ⏳ Rate limited. Waiting {wait_time:.1f}s...")
                    time.sleep(wait_time)
                elif attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 2  # 2s, 4s, 6s
                    print(f"  ⏳ Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
        
        all_dimensions.extend(batch_dimensions)
        
        # Add delay between batches to avoid hitting rate limit
        if batch_idx + BATCH_SIZE < len(feedbacks):
            print(f"  ⏸️ Waiting 3s before next batch...")
            time.sleep(3)
    
    print(f"✅ Total dimensions extracted: {len(all_dimensions)}")
    return all_dimensions


def generate_simple_report(feedbacks: List[Dict], event_title: str = "Event") -> Dict:
    """
    Generate a simple, actionable feedback report with full dimension extraction.
    
    Args:
        feedbacks: List of feedback dicts with 'text' and optionally 'sentiment' keys
        event_title: Title of the event for context
        
    Returns:
        Dict with overall_summary, positive_themes, improvement_areas, and dimensions
    """
    if not feedbacks:
        return {
            "overall_summary": "No feedback received yet.",
            "positive_themes": [],
            "improvement_areas": [],
            "dimensions": []
        }
    
    # Extract full dimensions for all feedback
    print(f"🔍 Extracting dimensions for {len(feedbacks)} feedback responses...")
    dimensions = extract_dimensions_for_feedbacks(feedbacks, event_title)
    print(f"✅ Extracted {len(dimensions)} dimension objects")
    
    # Update feedbacks with extracted sentiments if not already present
    if dimensions:
        for i, dim in enumerate(dimensions):
            if i < len(feedbacks):
                feedbacks[i]['sentiment'] = dim.sentiment.value if hasattr(dim.sentiment, 'value') else str(dim.sentiment)
                feedbacks[i]['dimension'] = dim
    
    # Group by sentiment (now from dimension extraction)
    positive = [f['text'] for f in feedbacks if f.get('sentiment') in ['Positive', 'POSITIVE']]
    negative = [f['text'] for f in feedbacks if f.get('sentiment') in ['Negative', 'NEGATIVE']]
    neutral = [f['text'] for f in feedbacks if f.get('sentiment') in ['Neutral', 'NEUTRAL']]
    
    # If too few feedbacks, provide basic summary
    if len(feedbacks) < 3:
        themes = []
        improvements = []
        
        if positive:
            themes.append("Attendees appreciated your presentation")
        if negative:
            for neg in negative:
                improvements.append({
                    "issue": neg[:100],
                    "suggestion": "Consider addressing this feedback in future events"
                })
        
        return {
            "overall_summary": f"Based on {len(feedbacks)} feedback responses, attendees had mixed reactions. More feedback would provide clearer insights.",
            "positive_themes": themes,
            "improvement_areas": improvements,
            "dimensions": dimensions
        }
    
    # Use LLM for detailed analysis
    try:
        llm = get_llm()
    except Exception as e:
        print(f"❌ Failed to initialize LLM: {e}")
        raise
    
    chain = FEEDBACK_SUMMARY_PROMPT | llm.with_structured_output(FeedbackReport)
    
    try:
        result = chain.invoke({
            "positive_feedback": "\n".join(f"- {p}" for p in positive) if positive else "None",
            "negative_feedback": "\n".join(f"- {n}" for n in negative) if negative else "None",
            "neutral_feedback": "\n".join(f"- {n}" for n in neutral) if neutral else "None",
        })
        
        print(f"📊 LLM Response: {result}")
        
        # Convert to dict for compatibility
        return {
            "overall_summary": result.overall_summary,
            "positive_themes": result.positive_themes,
            "improvement_areas": [
                {"issue": area.issue, "suggestion": area.suggestion}
                for area in result.improvement_areas
            ],
            "dimensions": dimensions
        }
    except Exception as e:
        print(f"❌ LLM invocation failed: {e}")
        raise
