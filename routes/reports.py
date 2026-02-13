"""
API routes for feedback analysis and report generation.

Three-step architecture:
1. Per-feedback classification (parallel)
2. Analytics aggregation (pure Python)
3. Event report generation (single LLM call)
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlmodel import Session, select
from db.db import SessionDep
from db.model import Event, EventReport, EventAnalytics, Speaker
from helpers.auth import get_current_speaker
from consensus.pipeline import run_analysis_sync
import time

router = APIRouter(prefix="/api/reports", tags=["reports"])




@router.post("/events/{event_id}/generate")
async def generate_event_report(
    event_id: int,
    session: SessionDep,
    min_feedback: int = 1,
    model: str = None,
    current_speaker: Speaker = Depends(get_current_speaker)
):
    """
    Generate comprehensive feedback analysis report for an event.
    
    Architecture:
    - Step 1: Classify each feedback in parallel (sentiment, intent, aspects)
    - Step 2: Aggregate results into analytics (no LLM, pure Python)
    - Step 3: Generate professional report (single LLM call)
    
    Args:
        event_id: ID of the event to analyze
        min_feedback: Minimum number of feedbacks required (default: 1)
        model: LLM model for classification (default: from env GROQ_MODEL)
    
    Returns:
        Generated report with analytics and insights
        
    Processing time: ~10-60 seconds depending on feedback count
    """
    
    # Check if event exists and belongs to speaker
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    
    if event.speaker_id != current_speaker.id:
        raise HTTPException(status_code=403, detail="You don't have access to this event")
    
    # Quick feedback count check
    from db.model import Feedback
    feedback_count = session.exec(
        select(Feedback).where(Feedback.event_id == event_id)
    ).all()
    
    if len(feedback_count) < min_feedback:
        raise HTTPException(
            status_code=400, 
            detail=f"Need at least {min_feedback} feedbacks to generate a report. Found {len(feedback_count)}."
        )
    
    # Update event status
    event.analysis_status = "processing"
    session.commit()
    
    try:
        start_time = time.time()
        
        # Run the three-step pipeline (await since it's async)
        analytics, report = await run_analysis_sync(session, event_id, model=model)
        
        generation_time = time.time() - start_time
        
        # Fetch the saved report from database
        latest_report = session.exec(
            select(EventReport)
            .where(EventReport.event_id == event_id)
            .order_by(EventReport.created_at.desc())
        ).first()
        
        # Construct sentiment_distribution from analytics
        total = analytics.get("total_responses", 1)  # Avoid division by zero
        sentiment_distribution = {
            "positive": {"count": analytics.get("positive_count", 0), "percentage": (analytics.get("positive_count", 0) / total) * 100},
            "neutral": {"count": analytics.get("neutral_count", 0), "percentage": (analytics.get("neutral_count", 0) / total) * 100},
            "negative": {"count": analytics.get("negative_count", 0), "percentage": (analytics.get("negative_count", 0) / total) * 100}
        }
        
        return {
            "report_id": latest_report.id if latest_report else None,
            "event_id": event_id,
            "event_title": event.title,
            "category": "FEEDBACK_RETROSPECTIVE",
            "feedback_count": analytics.get("total_responses", 0),
            "generation_time": round(generation_time, 2),
            "generated_at": latest_report.created_at.isoformat() if latest_report else None,
            "summary": {
                "main_summary": report.get("executive_summary", ""),
                "conflicting_statement": "",
                "top_weighted_points": []
            },
            "analytics": {
                "satisfaction_score": analytics.get("satisfaction_score", 0),
                "sentiment_distribution": sentiment_distribution,
                "top_strengths": analytics.get("top_strengths", {}),
                "top_issues": analytics.get("top_issues", {}),
                "intent_summary": analytics.get("intent_summary", {})
            },
            "report": {
                "executive_summary": report.get("executive_summary", ""),
                "strengths": report.get("strengths", ""),
                "improvements": report.get("improvements", ""),
                "recommendations": report.get("recommendations", "")
            },
            "highlights": [s.strip() for s in report.get("strengths", "").split("\n") if s.strip()],
            "concerns": [s.strip() for s in report.get("improvements", "").split("\n") if s.strip()],
            "next_steps": [s.strip() for s in report.get("recommendations", "").split("\n") if s.strip()]
        }
        
    except ValueError as e:
        event.analysis_status = "pending"
        session.commit()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        event.analysis_status = "pending"
        session.commit()
        
        # Log the full error for debugging
        import traceback
        print("\n❌ ERROR generating report:")
        print(traceback.format_exc())
        
        # Check if it's a rate limit error
        error_str = str(e)
        if "rate_limit" in error_str.lower() or "429" in error_str:
            raise HTTPException(
                status_code=429, 
                detail="API rate limit reached. Please wait a moment and try again."
            )
        
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.get("/events/{event_id}/analytics")
async def get_event_analytics(
    event_id: int,
    session: SessionDep,
    current_speaker: Speaker = Depends(get_current_speaker)
):
    """
    Get aggregated analytics for an event.
    
    Returns sentiment distribution, top strengths/issues, and satisfaction score.
    """
    
    # Verify ownership
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    
    if event.speaker_id != current_speaker.id:
        raise HTTPException(status_code=403, detail="You don't have access to this event")
    
    # Fetch analytics
    analytics = session.get(EventAnalytics, event_id)
    
    if not analytics:
        raise HTTPException(
            status_code=404, 
            detail=f"No analytics found for event {event_id}. Generate a report first."
        )
    
    total = analytics.total_responses
    
    return {
        "event_id": event_id,
        "event_title": event.title,
        "total_responses": total,
        "satisfaction_score": analytics.satisfaction_score,
        "sentiment_distribution": {
            "positive": {
                "count": analytics.positive_count,
                "percentage": round((analytics.positive_count / total) * 100, 1) if total > 0 else 0
            },
            "neutral": {
                "count": analytics.neutral_count,
                "percentage": round((analytics.neutral_count / total) * 100, 1) if total > 0 else 0
            },
            "negative": {
                "count": analytics.negative_count,
                "percentage": round((analytics.negative_count / total) * 100, 1) if total > 0 else 0
            }
        },
        "top_strengths": analytics.top_strengths or {},
        "top_issues": analytics.top_issues or {},
        "intent_summary": analytics.intent_summary or {},
        "generated_at": analytics.generated_at
    }


@router.get("/events/{event_id}/latest")
async def get_latest_report(
    event_id: int, 
    session: SessionDep,
    current_speaker: Speaker = Depends(get_current_speaker)
):
    """
    Get the most recent report for an event.
    
    Returns 404 if no report has been generated yet.
    """
    
    # Verify ownership
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    
    if event.speaker_id != current_speaker.id:
        raise HTTPException(status_code=403, detail="You don't have access to this event")
    
    statement = (
        select(EventReport)
        .where(EventReport.event_id == event_id)
        .order_by(EventReport.created_at.desc())
    )
    
    report = session.exec(statement).first()
    
    if not report:
        raise HTTPException(
            status_code=404, 
            detail=f"No report found for event {event_id}. Generate one first."
        )
    
    # Fetch analytics to include in response
    analytics = session.get(EventAnalytics, event_id)
    
    # Construct sentiment distribution from analytics
    sentiment_distribution = {}
    if analytics:
        total = analytics.total_responses or 1  # Avoid division by zero
        sentiment_distribution = {
            "positive": {"count": analytics.positive_count, "percentage": (analytics.positive_count / total) * 100},
            "neutral": {"count": analytics.neutral_count, "percentage": (analytics.neutral_count / total) * 100},
            "negative": {"count": analytics.negative_count, "percentage": (analytics.negative_count / total) * 100}
        }
    
    return {
        "report_id": report.id,
        "event_id": report.event_id,
        "event_title": event.title,
        "category": "FEEDBACK_RETROSPECTIVE",
        "feedback_count": analytics.total_responses if analytics else 0,
        "generated_at": report.created_at.isoformat(),
        "generation_time": report.generation_time_seconds,
        "summary": {
            "main_summary": report.executive_summary,
            "conflicting_statement": "",
            "top_weighted_points": []
        },
        "analytics": {
            "satisfaction_score": analytics.satisfaction_score if analytics else 0,
            "sentiment_distribution": sentiment_distribution,
            "top_strengths": analytics.top_strengths if analytics else {},
            "top_issues": analytics.top_issues if analytics else {},
            "intent_summary": analytics.intent_summary if analytics else {}
        },
        "report": {
            "executive_summary": report.executive_summary,
            "strengths": report.strengths,
            "improvements": report.improvements,
            "recommendations": report.recommendations
        },
        "highlights": [s.strip() for s in (report.strengths or "").split("\n") if s.strip()],
        "concerns": [s.strip() for s in (report.improvements or "").split("\n") if s.strip()],
        "next_steps": [s.strip() for s in (report.recommendations or "").split("\n") if s.strip()],
        "representative_quotes": report.representative_quotes or {}
    }




@router.get("/events/{event_id}/history")
async def get_report_history(
    event_id: int, 
    session: SessionDep, 
    limit: int = 10,
    current_speaker: Speaker = Depends(get_current_speaker)
):
    """
    Get report generation history for an event.
    
    Args:
        limit: Maximum number of reports to return (default: 10)
    """
    
    # Verify ownership
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    
    if event.speaker_id != current_speaker.id:
        raise HTTPException(status_code=403, detail="You don't have access to this event")
    
    statement = (
        select(EventReport)
        .where(EventReport.event_id == event_id)
        .order_by(EventReport.created_at.desc())
        .limit(limit)
    )
    
    reports = session.exec(statement).all()
    
    # Get analytics for feedback count
    analytics = session.get(EventAnalytics, event_id)
    feedback_count = analytics.total_responses if analytics else 0
    
    return {
        "event_id": event_id,
        "total_reports": len(reports),
        "reports": [
            {
                "report_id": r.id,
                "generated_at": r.created_at,
                "feedback_count": feedback_count,
                "generation_time": r.generation_time_seconds,
            }
            for r in reports
        ]
    }
