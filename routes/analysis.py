"""
API routes for analysis pipeline control and monitoring
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from sqlmodel import select
from db.db import SessionDep
from db.model import Event, AnalysisRun, EventMetrics, EventInsights, ThemeSummary
from consensus.pipeline import run_analysis_pipeline, check_and_trigger_analysis
import json

router = APIRouter(prefix="/api/analysis", tags=["Analysis Pipeline"])


@router.post("/events/{event_id}/trigger")
async def trigger_analysis(
    event_id: int,
    session: SessionDep,
    background_tasks: BackgroundTasks,
    force: bool = False
):
    """
    Manually trigger analysis pipeline for an event.
    
    - **event_id**: Event ID to analyze
    - **force**: If True, re-run analysis even if already completed
    
    Returns analysis run details.
    """
    
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    
    # Check if analysis is already running
    if event.analysis_status == "RUNNING":
        raise HTTPException(
            status_code=409,
            detail="Analysis is already running for this event"
        )
    
    # Check if already completed (unless force=True)
    if event.analysis_status == "COMPLETED" and not force:
        raise HTTPException(
            status_code=409,
            detail="Analysis already completed. Use force=true to re-run."
        )
    
    try:
        # Run pipeline synchronously (for now)
        result = run_analysis_pipeline(event_id, session)
        
        return {
            "message": "Analysis completed successfully",
            "result": result
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/check-pending")
async def check_pending_analysis(session: SessionDep):
    """
    Check for events with closed feedback windows and trigger analysis.
    This endpoint can be called by a cron job or scheduler.
    
    Returns list of events that were analyzed.
    """
    
    try:
        analyzed_ids = check_and_trigger_analysis(session)
        
        return {
            "message": f"Checked and analyzed {len(analyzed_ids)} events",
            "event_ids": analyzed_ids
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check pending: {str(e)}")


@router.get("/events/{event_id}/status")
async def get_analysis_status(event_id: int, session: SessionDep):
    """
    Get analysis status and metadata for an event.
    
    Returns current status, run history, and latest results if available.
    """
    
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    
    # Get analysis runs
    runs = session.exec(
        select(AnalysisRun)
        .where(AnalysisRun.event_id == event_id)
        .order_by(AnalysisRun.started_at.desc())
    ).all()
    
    # Get latest completed run
    latest_run = next((r for r in runs if r.status == "COMPLETED"), None)
    
    result = {
        "event_id": event_id,
        "event_title": event.title,
        "analysis_status": event.analysis_status,
        "feedback_window": {
            "open_at": event.feedback_open_at.isoformat() if event.feedback_open_at else None,
            "close_at": event.feedback_close_at.isoformat() if event.feedback_close_at else None,
        },
        "total_runs": len(runs),
        "runs": [
            {
                "run_id": r.id,
                "status": r.status,
                "model": r.model_name,
                "started_at": r.started_at.isoformat(),
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
                "error": r.error_message if r.status == "FAILED" else None,
            }
            for r in runs
        ]
    }
    
    # Add latest results if available
    if latest_run:
        # Get metrics
        metrics = session.exec(
            select(EventMetrics)
            .where(EventMetrics.analysis_run_id == latest_run.id)
        ).first()
        
        if metrics:
            result["latest_metrics"] = {
                "total_feedback": metrics.total_feedback,
                "accepted_feedback": metrics.accepted_feedback,
                "satisfaction_index": metrics.satisfaction_index,
                "sentiment_distribution": json.loads(metrics.sentiment_distribution) if metrics.sentiment_distribution else {},
            }
    
    return result


@router.get("/events/{event_id}/results")
async def get_analysis_results(event_id: int, session: SessionDep, run_id: int = None):
    """
    Get complete analysis results for an event.
    
    - **event_id**: Event ID
    - **run_id**: Specific analysis run ID (optional, defaults to latest completed)
    
    Returns themes, metrics, and insights.
    """
    
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    
    # Get analysis run
    if run_id:
        analysis_run = session.get(AnalysisRun, run_id)
        if not analysis_run or analysis_run.event_id != event_id:
            raise HTTPException(status_code=404, detail="Analysis run not found")
    else:
        # Get latest completed run
        analysis_run = session.exec(
            select(AnalysisRun)
            .where(AnalysisRun.event_id == event_id)
            .where(AnalysisRun.status == "COMPLETED")
            .order_by(AnalysisRun.completed_at.desc())
        ).first()
    
    if not analysis_run:
        raise HTTPException(
            status_code=404,
            detail="No completed analysis found for this event"
        )
    
    if analysis_run.status != "COMPLETED":
        raise HTTPException(
            status_code=400,
            detail=f"Analysis run {analysis_run.id} is not completed (status: {analysis_run.status})"
        )
    
    # Get theme summaries
    themes = session.exec(
        select(ThemeSummary)
        .where(ThemeSummary.analysis_run_id == analysis_run.id)
        .order_by(ThemeSummary.total_weight.desc())
    ).all()
    
    # Get metrics
    metrics = session.exec(
        select(EventMetrics)
        .where(EventMetrics.analysis_run_id == analysis_run.id)
    ).first()
    
    # Get insights
    insights = session.exec(
        select(EventInsights)
        .where(EventInsights.analysis_run_id == analysis_run.id)
    ).first()
    
    return {
        "event_id": event_id,
        "event_title": event.title,
        "analysis_run_id": analysis_run.id,
        "analyzed_at": analysis_run.completed_at.isoformat(),
        "themes": [
            {
                "theme": t.theme_label,
                "consensus": t.consensus,
                "polarity": t.polarity,
                "feedback_count": t.feedback_count,
                "total_weight": t.total_weight,
                "top_quotes": json.loads(t.top_quotes) if t.top_quotes else [],
            }
            for t in themes
        ],
        "metrics": {
            "total_feedback": metrics.total_feedback,
            "accepted_feedback": metrics.accepted_feedback,
            "satisfaction_index": metrics.satisfaction_index,
            "sentiment_distribution": json.loads(metrics.sentiment_distribution) if metrics.sentiment_distribution else {},
        } if metrics else None,
        "insights": {
            "what_went_well": insights.what_went_well,
            "what_needs_improvement": insights.what_needs_improvement,
            "contentious_topics": insights.contentious_topics,
            "overall_summary": insights.overall_summary,
        } if insights else None,
    }


@router.get("/events/{event_id}/themes")
async def get_theme_breakdown(event_id: int, session: SessionDep):
    """
    Get detailed theme breakdown for an event.
    
    Returns list of themes with statistics and quotes.
    """
    
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    
    # Get latest completed analysis run
    latest_run = session.exec(
        select(AnalysisRun)
        .where(AnalysisRun.event_id == event_id)
        .where(AnalysisRun.status == "COMPLETED")
        .order_by(AnalysisRun.completed_at.desc())
    ).first()
    
    if not latest_run:
        raise HTTPException(
            status_code=404,
            detail="No completed analysis found for this event"
        )
    
    # Get themes
    themes = session.exec(
        select(ThemeSummary)
        .where(ThemeSummary.analysis_run_id == latest_run.id)
        .order_by(ThemeSummary.total_weight.desc())
    ).all()
    
    return {
        "event_id": event_id,
        "event_title": event.title,
        "total_themes": len(themes),
        "themes": [
            {
                "theme": t.theme_label,
                "consensus": t.consensus,
                "polarity": t.polarity,
                "polarity_label": (
                    "Very Positive" if t.polarity > 0.6 else
                    "Positive" if t.polarity > 0.2 else
                    "Neutral" if t.polarity > -0.2 else
                    "Negative" if t.polarity > -0.6 else
                    "Very Negative"
                ),
                "avg_confidence": t.avg_confidence,
                "feedback_count": t.feedback_count,
                "total_weight": t.total_weight,
                "importance": "High" if t.total_weight > 2.0 else "Medium" if t.total_weight > 1.0 else "Low",
                "top_quotes": json.loads(t.top_quotes) if t.top_quotes else [],
            }
            for t in themes
        ]
    }
