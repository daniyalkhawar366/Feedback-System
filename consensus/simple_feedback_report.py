"""
Simplified feedback report generator for event speakers.
Produces clear, actionable insights without technical jargon.
"""

from typing import List, Dict
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from consensus.llm_config import get_llm


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


def generate_simple_report(feedbacks: List[Dict]) -> Dict:
    """
    Generate a simple, actionable feedback report.
    
    Args:
        feedbacks: List of feedback dicts with 'text' and 'sentiment' keys
        
    Returns:
        Dict with overall_summary, positive_themes, improvement_areas
    """
    if not feedbacks:
        return {
            "overall_summary": "No feedback received yet.",
            "positive_themes": [],
            "improvement_areas": []
        }
    
    # Group by sentiment
    positive = [f['text'] for f in feedbacks if f.get('sentiment') == 'Positive']
    negative = [f['text'] for f in feedbacks if f.get('sentiment') == 'Negative']
    neutral = [f['text'] for f in feedbacks if f.get('sentiment') == 'Neutral']
    
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
            "improvement_areas": improvements
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
            ]
        }
    except Exception as e:
        print(f"❌ LLM invocation failed: {e}")
        raise
