
from fastapi import APIRouter, Depends, HTTPException, Query
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
from db.db import SessionDep
from db.model import Speaker
from helpers.auth import get_current_speaker

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats_route(
    session: SessionDep,
    current_speaker: Speaker = Depends(get_current_speaker)
):
    """
    Get overview statistics across all speaker's events
    
    Returns:
    - Total events and active events count
    - Overall sentiment distribution
    - Average confidence across all feedback
    - Feedback count per event
    """
    return get_dashboard_stats(session, current_speaker.id)


@router.get("/events/{event_id}/stats", response_model=EventStats)
def get_event_stats_route(
    event_id: int,
    session: SessionDep,
    current_speaker: Speaker = Depends(get_current_speaker)
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
    return get_event_stats(session, event_id, current_speaker.id)


@router.get("/events/{event_id}/trends", response_model=SentimentTrends)
def get_sentiment_trends_route(
    event_id: int,
    session: SessionDep,
    current_speaker: Speaker = Depends(get_current_speaker)
):
    """
    Get sentiment trends over time for an event
    
    Returns sentiment distribution grouped by date
    Useful for tracking feedback sentiment changes during/after event
    """
    return get_sentiment_trends(session, event_id, current_speaker.id)


@router.get("/events/{event_id}/keywords", response_model=TopKeywords)
def get_keywords_route(
    event_id: int,
    session: SessionDep,
    current_speaker: Speaker = Depends(get_current_speaker),
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
    return get_top_keywords(session, event_id, current_speaker.id, sentiment)


@router.get("/events/{event_id}/quality", response_model=QualityMetrics)
def get_quality_metrics_route(
    event_id: int,
    session: SessionDep,
    current_speaker: Speaker = Depends(get_current_speaker)
):
    """
    Get quality gate analysis for feedback
    
    Returns:
    - Quality decision breakdown (ACCEPT/FLAG/REJECT)
    - Common quality flags that were triggered
    - Helps identify recurring quality issues
    """
    return get_quality_metrics(session, event_id, current_speaker.id)