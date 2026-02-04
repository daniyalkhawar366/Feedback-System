"""
API routes for consensus report generation
"""

from fastapi import APIRouter, HTTPException
from sqlmodel import Session, select
from db.db import SessionDep
from db.model import Event, Feedback, EventReport, FeedbackAnalysis
from consensus.report_generator import generate_report_for_event
from consensus.simple_feedback_report import generate_simple_report
import time
import json

router = APIRouter(prefix="/api/reports", tags=["reports"])


def clean_technical_language(text: str) -> str:
    """
    Remove technical jargon from consensus output to make it user-friendly.
    """
    import re
    
    # Remove technical patterns like "split (lead=HELPED 75%)"
    text = re.sub(r'\s*-\s*split\s*\([^)]+\)\s*-\s*', ' - ', text)
    
    # Remove "reasons: ..." technical details
    text = re.sub(r'\s*-\s*reasons:.*$', '', text)
    
    # Remove stance-sentiment mismatch details
    text = re.sub(r'Stance-sentiment mismatch.*$', '', text)
    
    # Remove lead= patterns
    text = re.sub(r'\s*\(lead=[^)]+\)', '', text)
    
    # Remove confidence scores in parentheses
    text = re.sub(r'\s*\(confidence\s+[\d.]+[^)]*\)', '', text)
    
    # Remove "needs stronger evidence"
    text = re.sub(r';\s*needs stronger evidence', '', text)
    
    # Clean up multiple spaces
    text = re.sub(r'\s+', ' ', text)
    
    # Clean up double asterisks (markdown bold)
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    
    return text.strip()


@router.post("/events/{event_id}/generate")
async def generate_event_report(
    event_id: int,
    session: SessionDep,
    min_feedback: int = 5
):
    """
    Generate comprehensive consensus report for an event.
    
    - **event_id**: ID of the event to generate report for
    - **min_feedback**: Minimum number of ACCEPT-quality feedback required (default: 5)
    
    Returns the generated report with summary, highlights, and concerns.
    Processing time: ~30-90 seconds depending on feedback count.
    """
    
    # Check if event exists
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    
    try:
        start_time = time.time()
        
        # Fetch feedback with sentiment analysis
        feedback_query = (
            select(Feedback, FeedbackAnalysis.sentiment)
            .outerjoin(FeedbackAnalysis, FeedbackAnalysis.feedback_id == Feedback.id)
            .where(Feedback.event_id == event_id)
            .where(Feedback.quality_decision == "ACCEPT")
        )
        results = session.exec(feedback_query).all()
        
        print(f"📊 Found {len(results)} ACCEPT-quality feedback for event {event_id}")
        
        if len(results) < min_feedback:
            # Lower threshold - 3 is enough for basic report
            if len(results) < 3:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Need at least 3 quality feedback to generate a report. Found {len(results)}."
                )
        
        # Prepare feedback data
        feedbacks = [
            {
                "text": fb.normalized_text or fb.raw_text or "",
                "sentiment": sentiment or "Neutral"
            }
            for fb, sentiment in results
        ]
        
        print(f"📝 Generating report for {len(feedbacks)} feedback responses...")
        
        # Generate simple, actionable report
        try:
            report_result = generate_simple_report(feedbacks)
            print(f"✅ Report generated successfully: {len(report_result.get('positive_themes', []))} themes, {len(report_result.get('improvement_areas', []))} improvements")
        except Exception as e:
            print(f"❌ Error in generate_simple_report: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")
        
        generation_time = time.time() - start_time
        
        # Save to database
        event_report = EventReport(
            event_id=event_id,
            category="FEEDBACK_RETROSPECTIVE",
            main_summary=report_result["overall_summary"],
            conflicting_statement="",
            top_weighted_points=json.dumps([]),
            what_we_agree_on=json.dumps(report_result["positive_themes"]),
            where_we_disagree=json.dumps([
                f"{item['issue']} → {item['suggestion']}" 
                for item in report_result["improvement_areas"]
            ]),
            what_to_decide_next=json.dumps([]),
            feedback_count=len(feedbacks),
            generation_time_seconds=generation_time,
        )
        
        session.add(event_report)
        session.commit()
        session.refresh(event_report)
        
        return {
            "report_id": event_report.id,
            "event_id": event_id,
            "event_title": event.title,
            "category": "FEEDBACK_RETROSPECTIVE",
            "feedback_count": len(feedbacks),
            "generation_time": round(generation_time, 2),
            "summary": {
                "main_summary": report_result["overall_summary"],
                "conflicting_statement": "",
                "top_weighted_points": []
            },
            "highlights": report_result["positive_themes"],
            "concerns": [
                f"{item['issue']} → {item['suggestion']}" 
                for item in report_result["improvement_areas"]
            ],
            "next_steps": [],
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Log the full error for debugging
        import traceback
        print("\n❌ ERROR generating report:")
        print(traceback.format_exc())
        
        # Check if it's a rate limit error
        error_str = str(e)
        if "rate_limit" in error_str.lower() or "429" in error_str:
            raise HTTPException(
                status_code=429, 
                detail="API rate limit reached. Please wait a moment and try again. Consider upgrading your API tier for higher limits."
            )
        
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.get("/events/{event_id}/latest")
async def get_latest_report(event_id: int, session: SessionDep):
    """
    Get the most recent consensus report for an event.
    
    Returns 404 if no report has been generated yet.
    """
    
    statement = (
        select(EventReport)
        .where(EventReport.event_id == event_id)
        .order_by(EventReport.generated_at.desc())
    )
    
    report = session.exec(statement).first()
    
    if not report:
        raise HTTPException(
            status_code=404, 
            detail=f"No report found for event {event_id}. Generate one first using POST /api/reports/events/{event_id}/generate"
        )
    
    # Parse JSON fields
    highlights = json.loads(report.what_we_agree_on) if report.what_we_agree_on else []
    concerns = json.loads(report.where_we_disagree) if report.where_we_disagree else []
    next_steps = json.loads(report.what_to_decide_next) if report.what_to_decide_next else []
    
    # Clean technical language for user-friendly presentation
    highlights = [clean_technical_language(h) for h in highlights]
    concerns = [clean_technical_language(c) for c in concerns]
    next_steps = [clean_technical_language(n) for n in next_steps]
    
    return {
        "report_id": report.id,
        "event_id": report.event_id,
        "category": report.category,
        "feedback_count": report.feedback_count,
        "generated_at": report.generated_at,
        "generation_time": report.generation_time_seconds,
        "summary": {
            "main_summary": report.main_summary,
            "conflicting_statement": report.conflicting_statement,
            "top_weighted_points": json.loads(report.top_weighted_points) if report.top_weighted_points else []
        },
        "highlights": highlights,
        "concerns": concerns,
        "next_steps": next_steps,
    }


@router.get("/events/{event_id}/history")
async def get_report_history(event_id: int, session: SessionDep, limit: int = 10):
    """
    Get report generation history for an event.
    
    - **limit**: Maximum number of reports to return (default: 10)
    """
    
    statement = (
        select(EventReport)
        .where(EventReport.event_id == event_id)
        .order_by(EventReport.generated_at.desc())
        .limit(limit)
    )
    
    reports = session.exec(statement).all()
    
    return {
        "event_id": event_id,
        "total_reports": len(reports),
        "reports": [
            {
                "report_id": r.id,
                "generated_at": r.generated_at,
                "feedback_count": r.feedback_count,
                "generation_time": r.generation_time_seconds,
            }
            for r in reports
        ]
    }
