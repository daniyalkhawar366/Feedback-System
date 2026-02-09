"""
STEP 2: Aggregation (NO LLM, Pure Python)

Aggregates classified feedback data into event-level analytics.
Single pass over all classified feedbacks.
"""
from typing import List, Dict, Tuple
from collections import Counter


def aggregate_feedback_analytics(
    classified_feedbacks: List[Dict],
    feedback_texts: Dict[int, str]
) -> Dict:
    """
    Aggregate classified feedback into event-level analytics.
    
    Args:
        classified_feedbacks: List of classification results
        feedback_texts: Dict mapping feedback_id to original text
        
    Returns:
        Dict with aggregated analytics matching EventAnalytics schema
    """
    total = len(classified_feedbacks)
    
    if total == 0:
        return {
            "total_responses": 0,
            "positive_count": 0,
            "neutral_count": 0,
            "negative_count": 0,
            "satisfaction_score": 0.0,
            "top_strengths": {},
            "top_issues": {},
            "intent_summary": {},
            "representative_quotes": {}
        }
    
    # Count sentiments
    sentiment_counts = Counter(fb["sentiment"] for fb in classified_feedbacks)
    positive_count = sentiment_counts.get("positive", 0)
    neutral_count = sentiment_counts.get("neutral", 0)
    negative_count = sentiment_counts.get("negative", 0)
    
    # Calculate satisfaction score
    satisfaction_score = round((positive_count / total) * 100, 2)
    
    # Count intents
    intent_counts = Counter(fb["intent"] for fb in classified_feedbacks)
    
    # NEW: Aggregate by specific issue_label (preserves detail!)
    specific_issues = {}  # {issue_label: {count, evidence_quotes[], sentiment}}
    specific_strengths = {}
    
    for fb in classified_feedbacks:
        issue_label = fb.get("issue_label")
        evidence_quote = fb.get("evidence_quote")
        
        if not issue_label:
            continue
        
        if fb["sentiment"] in ["negative", "neutral"] and fb["intent"] in ["complaint", "suggestion"]:
            if issue_label not in specific_issues:
                specific_issues[issue_label] = {
                    "count": 0,
                    "evidence_quotes": [],
                    "sentiment": fb["sentiment"]
                }
            specific_issues[issue_label]["count"] += 1
            if evidence_quote and len(specific_issues[issue_label]["evidence_quotes"]) < 2:
                specific_issues[issue_label]["evidence_quotes"].append(evidence_quote)
        
        elif fb["sentiment"] == "positive" and fb["intent"] == "praise":
            if issue_label not in specific_strengths:
                specific_strengths[issue_label] = {
                    "count": 0,
                    "evidence_quotes": [],
                    "sentiment": fb["sentiment"]
                }
            specific_strengths[issue_label]["count"] += 1
            if evidence_quote and len(specific_strengths[issue_label]["evidence_quotes"]) < 2:
                specific_strengths[issue_label]["evidence_quotes"].append(evidence_quote)
    
    # Fallback: Aggregate aspects by sentiment (for feedbacks without issue_label)
    positive_aspects = []
    negative_aspects = []
    
    for fb in classified_feedbacks:
        if fb["sentiment"] == "positive":
            positive_aspects.extend(fb.get("aspects", []))
        elif fb["sentiment"] == "negative":
            negative_aspects.extend(fb.get("aspects", []))
    
    # Top strengths (positive aspects)
    strength_counts = Counter(positive_aspects)
    top_strengths = dict(strength_counts.most_common(5))
    
    # Top issues (negative aspects)
    issue_counts = Counter(negative_aspects)
    top_issues = dict(issue_counts.most_common(5))
    
    # Extract representative quotes (one per aspect)
    representative_quotes = extract_representative_quotes(
        classified_feedbacks,
        feedback_texts
    )
    
    return {
        "total_responses": total,
        "positive_count": positive_count,
        "neutral_count": neutral_count,
        "negative_count": negative_count,
        "satisfaction_score": satisfaction_score,
        "top_strengths": top_strengths,  # Fallback: generic aspects
        "top_issues": top_issues,  # Fallback: generic aspects
        "specific_strengths": specific_strengths,  # NEW: Granular strengths with evidence
        "specific_issues": specific_issues,  # NEW: Granular issues with evidence
        "intent_summary": dict(intent_counts),
        "representative_quotes": representative_quotes
    }


def extract_representative_quotes(
    classified_feedbacks: List[Dict],
    feedback_texts: Dict[int, str],
    max_quotes_per_aspect: int = 2
) -> Dict[str, List[str]]:
    """
    Extract representative quotes for each aspect.
    
    Args:
        classified_feedbacks: List of classification results
        feedback_texts: Dict mapping feedback_id to original text
        max_quotes_per_aspect: Maximum quotes per aspect
        
    Returns:
        Dict mapping aspect to list of representative quotes
    """
    aspect_quotes = {}
    
    # Group feedback by aspects
    for fb in classified_feedbacks:
        feedback_id = fb.get("feedback_id")
        if feedback_id not in feedback_texts:
            continue
        
        text = feedback_texts[feedback_id]
        confidence = fb.get("confidence", 0.0)
        
        # Only use high-confidence feedback as quotes
        if confidence < 0.7:
            continue
        
        for aspect in fb.get("aspects", []):
            if aspect not in aspect_quotes:
                aspect_quotes[aspect] = []
            
            # Add quote with confidence score
            aspect_quotes[aspect].append({
                "text": text,
                "confidence": confidence,
                "sentiment": fb["sentiment"]
            })
    
    # Select top quotes per aspect (highest confidence)
    representative_quotes = {}
    for aspect, quotes in aspect_quotes.items():
        # Sort by confidence, take top N
        sorted_quotes = sorted(quotes, key=lambda q: q["confidence"], reverse=True)
        selected = sorted_quotes[:max_quotes_per_aspect]
        representative_quotes[aspect] = [q["text"] for q in selected]
    
    return representative_quotes


def format_analytics_for_display(analytics: Dict) -> Dict:
    """
    Format analytics for UI display.
    
    Args:
        analytics: Raw analytics dict
        
    Returns:
        Formatted dict with percentages and labels
    """
    total = analytics["total_responses"]
    
    if total == 0:
        return analytics
    
    return {
        **analytics,
        "sentiment_distribution": {
            "positive": {
                "count": analytics["positive_count"],
                "percentage": round((analytics["positive_count"] / total) * 100, 1)
            },
            "neutral": {
                "count": analytics["neutral_count"],
                "percentage": round((analytics["neutral_count"] / total) * 100, 1)
            },
            "negative": {
                "count": analytics["negative_count"],
                "percentage": round((analytics["negative_count"] / total) * 100, 1)
            }
        }
    }
