"""
STEP 3: Event-Level Report Generation (ONE LLM CALL)

Uses aggregated analytics to generate a professional report.
NO raw feedback is sent to the LLM.
"""
import json
from typing import Dict
from consensus.llm_client import call_llm


REPORT_SYSTEM_PROMPT = """You are an expert event feedback analyst.
Generate a professional, concise feedback report for event organizers.
Be insightful, constructive, and actionable."""


def build_report_prompt(event_name: str, analytics: Dict) -> str:
    """Build the user prompt for report generation."""
    
    total = analytics["total_responses"]
    positive_pct = round((analytics["positive_count"] / total) * 100, 1) if total > 0 else 0
    neutral_pct = round((analytics["neutral_count"] / total) * 100, 1) if total > 0 else 0
    negative_pct = round((analytics["negative_count"] / total) * 100, 1) if total > 0 else 0
    
    # NEW: Format specific issues (granular, actionable)
    specific_issues = analytics.get("specific_issues", {})
    if specific_issues:
        issues_text = "SPECIFIC ISSUES (with evidence):\n"
        for issue_label, data in sorted(specific_issues.items(), key=lambda x: x[1]["count"], reverse=True):
            readable_label = issue_label.replace("_", " ").title()
            count = data["count"]
            quotes = data.get("evidence_quotes", [])
            issues_text += f"  - {readable_label} ({count} mentions)\n"
            if quotes:
                issues_text += f'    Evidence: "{quotes[0]}"\n'
    else:
        # Fallback to generic aspects
        issues_text = "Top concerns (generic):\n"
        issues_text += "\n".join([
            f"  - {aspect}: {count} mentions"
            for aspect, count in analytics.get("top_issues", {}).items()
        ]) or "  (None)"
    
    # NEW: Format specific strengths (granular, actionable)
    specific_strengths = analytics.get("specific_strengths", {})
    if specific_strengths:
        strengths_text = "SPECIFIC STRENGTHS (with evidence):\n"
        for strength_label, data in sorted(specific_strengths.items(), key=lambda x: x[1]["count"], reverse=True):
            readable_label = strength_label.replace("_", " ").title()
            count = data["count"]
            quotes = data.get("evidence_quotes", [])
            strengths_text += f"  - {readable_label} ({count} mentions)\n"
            if quotes:
                strengths_text += f'    Evidence: "{quotes[0]}"\n'
    else:
        # Fallback to generic aspects
        strengths_text = "Top strengths (generic):\n"
        strengths_text += "\n".join([
            f"  - {aspect}: {count} mentions"
            for aspect, count in analytics.get("top_strengths", {}).items()
        ]) or "  (None)"
    
    # Format intent counts
    intent_text = "\n".join([
        f"  - {intent}: {count}"
        for intent, count in analytics.get("intent_summary", {}).items()
    ])
    
    return f"""Generate a feedback analysis report based on the following aggregated data.

Event Name: {event_name}
Total Responses: {total}

Sentiment Distribution:
  - Positive: {analytics['positive_count']} ({positive_pct}%)
  - Neutral: {analytics['neutral_count']} ({neutral_pct}%)
  - Negative: {analytics['negative_count']} ({negative_pct}%)
  - Satisfaction Score: {analytics['satisfaction_score']}%

{strengths_text}

{issues_text}

Common Feedback Intents:
{intent_text}

CRITICAL INSTRUCTIONS:
1. Write a concise executive summary (3-4 sentences) that mentions SPECIFIC issues and strengths by name.
2. List strengths as SPECIFIC, ACTIONABLE bullet points. Use the actual evidence quotes to make each point concrete.
3. List improvements as SPECIFIC, ACTIONABLE bullet points. Each should clearly state:
   - What the problem is (use evidence)
   - Why it matters
4. Provide CONCRETE recommendations that address the specific issues identified.
5. Avoid generic language like "organization needs improvement" - be specific about WHAT needs improvement.

Return JSON with this structure:
{{
  "executive_summary": "...",
  "strengths": "Point 1\\nPoint 2\\nPoint 3",
  "improvements": "Point 1\\nPoint 2\\nPoint 3",
  "recommendations": "Step 1\\nStep 2\\nStep 3"
}}"""


def generate_event_report(event_name: str, analytics: Dict, model: str = None) -> Dict:
    """
    Generate event-level report using aggregated analytics.
    
    Args:
        event_name: Name of the event
        analytics: Aggregated analytics dict
        model: LLM model to use (default: from env)
        
    Returns:
        Dict with executive_summary, strengths, improvements, recommendations
        
    Raises:
        Exception if report generation fails
    """
    if analytics["total_responses"] == 0:
        return {
            "executive_summary": "No feedback received for this event yet.",
            "strengths": "N/A",
            "improvements": "N/A",
            "recommendations": "Encourage attendees to provide feedback."
        }
    
    user_prompt = build_report_prompt(event_name, analytics)
    
    try:
        response = call_llm(
            system_prompt=REPORT_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            model=model,
            temperature=0.3,  # Slightly creative for better prose
            json_mode=True
        )
        
        print(f"📄 LLM Response (first 200 chars): {response[:200]}")
        
        result = json.loads(response)
        
        # Validate structure
        required_keys = {"executive_summary", "strengths", "improvements", "recommendations"}
        if not required_keys.issubset(result.keys()):
            raise ValueError(f"Missing required keys in report. Got: {result.keys()}")
        
        return result
        
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse LLM report response as JSON: {e}")
    except Exception as e:
        raise Exception(f"Report generation failed: {e}")


def generate_report_with_fallback(event_name: str, analytics: Dict) -> Dict:
    """
    Generate report with fallback handling.
    
    Args:
        event_name: Name of the event
        analytics: Aggregated analytics dict
        
    Returns:
        Report dict
    """
    try:
        # Use default model from env (Groq)
        return generate_event_report(event_name, analytics)
    except Exception as e:
        import traceback
        print(f"❌ Report generation failed: {e}")
        print(f"❌ Full traceback:")
        traceback.print_exc()
        
        # Generate a basic report from analytics without LLM
        print(f"⚠️  Using fallback report generation...")
        
        # Extract top strengths and issues
        top_strengths = analytics.get("top_strengths", {})
        top_issues = analytics.get("top_issues", {})
        
        # Build strengths list
        strengths_list = []
        for aspect, count in sorted(top_strengths.items(), key=lambda x: x[1], reverse=True)[:3]:
            strengths_list.append(f"{aspect.replace('_', ' ').title()} ({count} mentions)")
        
        # Build improvements list  
        improvements_list = []
        for aspect, count in sorted(top_issues.items(), key=lambda x: x[1], reverse=True)[:3]:
            improvements_list.append(f"{aspect.replace('_', ' ').title()} needs attention ({count} mentions)")
        
        satisfaction = analytics.get("satisfaction_score", 0)
        total = analytics.get("total_responses", 0)
        positive = analytics.get("positive_count", 0)
        
        return {
            "executive_summary": f"Analysis of {total} feedback responses. Overall satisfaction: {satisfaction}% ({positive}/{total} positive). {'The event was well-received.' if satisfaction >= 70 else 'There are areas that need improvement.'}",
            "strengths": "\n".join(strengths_list) if strengths_list else "Check detailed analytics for strengths.",
            "improvements": "\n".join(improvements_list) if improvements_list else "Check detailed analytics for areas to improve.",
            "recommendations": "Review the detailed analytics dashboard for specific insights and trends."
        }
