"""
Analytics Routes - MongoDB Version (Async)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from collections import Counter

from handlers.analytics import (
    get_event_stats,
    get_dashboard_stats,
    get_sentiment_trends,
    get_top_keywords,
    get_quality_metrics
)
from models.analytics import (
    EventStats,
    DashboardStats,
    SentimentTrends,
    TopKeywords,
    QualityMetrics
)
from helpers.auth import get_current_speaker
from db.mongo_models import SpeakerDocument, EventDocument, FeedbackDocument, FeedbackAnalysisDocument

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats_route(
    current_speaker: SpeakerDocument = Depends(get_current_speaker)
):
    """
    Get overview statistics across all speaker's events
    
    Returns:
    - Total events and active events count
    - Overall sentiment distribution
    - Average confidence across all feedback
    - Feedback count per event
    """
    return await get_dashboard_stats(str(current_speaker.id))


@router.get("/events/{event_id}/stats", response_model=EventStats)
async def get_event_stats_route(
    event_id: str,
    current_speaker: SpeakerDocument = Depends(get_current_speaker)
):
    """
    Get detailed statistics for a specific event
    
    Returns:
    - Total feedback count
    - Sentiment distribution (positive/negative/neutral)
    - Quality breakdown (accepted/flagged/rejected)
    - Input type breakdown (text/audio)
    - Average confidence score
    - Feedback collection period
    """
    return await get_event_stats(event_id, str(current_speaker.id))


@router.get("/events/{event_id}/trends", response_model=SentimentTrends)
async def get_sentiment_trends_route(
    event_id: str,
    current_speaker: SpeakerDocument = Depends(get_current_speaker)
):
    """
    Get sentiment trends over time for an event
    
    Returns sentiment distribution grouped by date
    Useful for tracking feedback sentiment changes during/after event
    """
    return await get_sentiment_trends(event_id, str(current_speaker.id))


@router.get("/events/{event_id}/keywords", response_model=TopKeywords)
async def get_keywords_route(
    event_id: str,
    current_speaker: SpeakerDocument = Depends(get_current_speaker),
    sentiment: str = Query(None, description="Filter by sentiment: positive, negative, or neutral")
):
    """
    Extract and rank keywords from feedback
    
    Parameters:
    - sentiment (optional): Filter keywords by sentiment type
    
    Returns:
    - Top keywords with frequency and percentage
    - Useful for understanding what attendees liked/didn't like
    """
    return await get_top_keywords(event_id, str(current_speaker.id), sentiment)


@router.get("/events/{event_id}/quality", response_model=QualityMetrics)
async def get_quality_metrics_route(
    event_id: str,
    current_speaker: SpeakerDocument = Depends(get_current_speaker)
):
    """
    Get quality gate analysis for feedback
    
    Returns:
    - Quality decision breakdown (ACCEPT/FLAG/REJECT)
    - Common quality flags that were triggered
    - Helps identify recurring quality issues
    """
    return await get_quality_metrics(event_id, str(current_speaker.id))


@router.get("/events/{event_id}/dimensions")
async def get_dimension_analytics(
    event_id: str,
    current_speaker: SpeakerDocument = Depends(get_current_speaker)
):
    """
    Get extracted dimension analytics for an event's feedback.
    Shows themes, emotions, impact directions, and other LLM-extracted insights.
    
    Returns detailed breakdown of all analyzed dimensions including:
    - Theme clusters
    - Emotion distribution  
    - Impact direction (HELPED/HURT/NEUTRAL)
    - Evidence types
    - Critical opinions vs general feedback
    """
    # Verify ownership
    event = await EventDocument.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    
    if str(event.speaker_id) != str(current_speaker.id):
        raise HTTPException(status_code=403, detail="You don't have access to this event")
    
    # Get all feedback for this event
    all_feedbacks = await FeedbackDocument.find(
        FeedbackDocument.event_id == event_id
    ).to_list()
    
    if not all_feedbacks:
        return {
            "event_id": event_id,
            "event_title": event.title,
            "total_analyzed": 0,
            "message": "No dimension analysis available yet. Generate a report to extract dimensions."
        }
    
    # Get all analyses
    feedback_ids = [str(f.id) for f in all_feedbacks]
    all_analyses = await FeedbackAnalysisDocument.find(
        {"feedback_id": {"$in": feedback_ids}}
    ).to_list()
    
    if not all_analyses:
        return {
            "event_id": event_id,
            "event_title": event.title,
            "total_analyzed": 0,
            "message": "No dimension analysis available yet. Generate a report to extract dimensions."
        }
    
    # Create feedback map
    feedback_map = {str(f.id): f for f in all_feedbacks}
    
    # Aggregate dimensions
    themes = []
    sentiments = []
    emotions = []
    impact_directions = []
    evidence_types = []
    critical_opinions = 0
    risk_flags = 0
    
    feedback_details = []
    confidence_scores = []
    relevancy_scores = []
    
    for analysis in all_analyses:
        feedback = feedback_map.get(str(analysis.feedback_id))
        if not feedback:
            continue
            
        if analysis.theme:
            themes.append(analysis.theme)
        if analysis.sentiment:
            sentiments.append(analysis.sentiment)
        if analysis.emotion:
            emotions.append(analysis.emotion)
        if analysis.impact_direction:
            impact_directions.append(analysis.impact_direction)
        if analysis.evidence_type:
            evidence_types.append(analysis.evidence_type)
        if analysis.is_critical_opinion:
            critical_opinions += 1
        if analysis.risk_flag:
            risk_flags += 1
        if analysis.confidence:
            confidence_scores.append(analysis.confidence)
        if analysis.relevancy:
            relevancy_scores.append(analysis.relevancy)
        
        feedback_details.append({
            "id": str(feedback.id),
            "text": feedback.normalized_text or feedback.raw_text,
            "theme": analysis.theme,
            "sentiment": analysis.sentiment,
            "emotion": analysis.emotion,
            "impact_direction": analysis.impact_direction,
            "evidence_type": analysis.evidence_type,
            "confidence": analysis.confidence,
            "relevancy": analysis.relevancy,
            "is_critical": analysis.is_critical_opinion,
            "created_at": feedback.created_at.isoformat()
        })
    
    # Calculate distributions
    theme_dist = Counter(themes).most_common(10)
    sentiment_dist = Counter(sentiments)
    emotion_dist = Counter(emotions).most_common()
    impact_dist = Counter(impact_directions)
    evidence_dist = Counter(evidence_types)
    
    return {
        "event_id": event_id,
        "event_title": event.title,
        "total_analyzed": len(all_analyses),
        "summary": {
            "critical_opinions": critical_opinions,
            "risk_flags": risk_flags,
            "avg_confidence": sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0,
            "avg_relevancy": sum(relevancy_scores) / len(relevancy_scores) if relevancy_scores else 0
        },
        "distributions": {
            "themes": [{"theme": theme, "count": count} for theme, count in theme_dist],
            "sentiments": dict(sentiment_dist),
            "emotions": [{"emotion": emotion, "count": count} for emotion, count in emotion_dist if emotion],
            "impact_directions": dict(impact_dist),
            "evidence_types": dict(evidence_dist)
        },
        "feedback_details": feedback_details
    }
