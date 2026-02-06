"""
Analysis Pipeline Orchestrator - Runs after feedback window closes
Integrates dimension extraction and summary generation
"""

import json
import time
from datetime import datetime
from typing import List, Dict, Optional
from sqlmodel import Session, select
import pandas as pd

from db.model import (
    Event,
    Feedback,
    FeedbackAnalysis,
    AnalysisRun,
    ThemeSummary,
    EventMetrics,
    EventInsights,
)
from consensus.types import Discussion, Message, Category, FeedbackRetrospective
from consensus.dimension_extraction import dimension_extraction_graph
from consensus.summary import summary_graph
from consensus.llm_config import get_llm


def run_analysis_pipeline(
    event_id: int,
    session: Session,
    llm_provider: Optional[str] = None,
    llm_model: Optional[str] = None,
) -> Dict:
    """
    Execute complete analysis pipeline for an event.
    
    Pipeline Steps:
    1. Validate event status
    2. Fetch ACCEPTED feedback
    3. Extract dimensions using LLM (per feedback)
    4. Compute aggregations (themes, metrics)
    5. Generate executive summary using LLM
    6. Save all results to database
    
    Args:
        event_id: Event ID to analyze
        session: Database session
        llm_provider: Optional LLM provider override
        llm_model: Optional model name override
        
    Returns:
        Dict with pipeline results and metadata
        
    Raises:
        ValueError: If event not found or insufficient feedback
        Exception: If pipeline fails
    """
    
    # Step 1: Validate event
    event = session.get(Event, event_id)
    if not event:
        raise ValueError(f"Event {event_id} not found")
    
    # Prevent duplicate runs
    if event.analysis_status == "RUNNING":
        raise ValueError(f"Analysis already running for event {event_id}")
    
    if event.analysis_status == "COMPLETED":
        print(f"⚠️  Analysis already completed for event {event_id}. Re-running...")
    
    # Step 2: Create analysis run record
    llm = get_llm(provider=llm_provider, model=llm_model)
    model_info = {
        "provider": llm_provider or "groq",
        "model": llm_model or "llama-3.3-70b-versatile"
    }
    
    analysis_run = AnalysisRun(
        event_id=event_id,
        model_name=model_info["provider"],
        model_version=model_info["model"],
        parameters=json.dumps(model_info),
        status="RUNNING",
        started_at=datetime.utcnow(),
    )
    
    session.add(analysis_run)
    event.analysis_status = "RUNNING"
    session.commit()
    session.refresh(analysis_run)
    
    try:
        start_time = time.time()
        
        # Step 3: Fetch ACCEPTED feedback
        print(f"\n🔍 Step 1/5: Fetching ACCEPTED feedback for event {event_id}...")
        feedbacks = session.exec(
            select(Feedback)
            .where(Feedback.event_id == event_id)
            .where(Feedback.quality_decision == "ACCEPT")
        ).all()
        
        if len(feedbacks) < 3:
            raise ValueError(
                f"Insufficient feedback for analysis. "
                f"Found {len(feedbacks)} ACCEPT-quality feedback, minimum required: 3"
            )
        
        print(f"   ✅ Found {len(feedbacks)} feedback messages")
        
        # Step 4: Prepare Discussion object
        print(f"\n📝 Step 2/5: Preparing discussion data...")
        discussion = Discussion(
            name=event.title,
            description=event.description or "",
            template=Category.FEEDBACK_RETROSPECTIVE,
            messages=[
                Message(id=fb.id, message=fb.normalized_text or fb.raw_text)
                for fb in feedbacks
            ]
        )
        print(f"   ✅ Discussion prepared with {len(discussion.messages)} messages")
        
        # Step 5: Extract dimensions (LLM call per feedback)
        print(f"\n🤖 Step 3/5: Extracting dimensions using LLM...")
        print(f"   (This will make {len(feedbacks)} LLM API calls)")
        
        config = {"configurable": {"llm": llm}}
        
        dim_result = dimension_extraction_graph.invoke(
            {
                "discussion": discussion,
                "category": Category.FEEDBACK_RETROSPECTIVE,
                "dimensions": None,
            },
            config=config,
        )
        
        dimensions = dim_result["dimensions"]
        print(f"   ✅ Extracted {len(dimensions)} dimension sets")
        
        # Step 6: Save dimension data to FeedbackAnalysis
        print(f"\n💾 Step 4/5: Saving dimension data to database...")
        saved_count = 0
        for fb, dim in zip(feedbacks, dimensions):
            # Check if analysis already exists
            existing = session.exec(
                select(FeedbackAnalysis).where(FeedbackAnalysis.feedback_id == fb.id)
            ).first()
            
            if existing:
                # Update existing record
                existing.analysis_run_id = analysis_run.id
                existing.theme = dim.theme
                existing.sentiment = dim.sentiment.value
                existing.emotion = dim.emotion.value if dim.emotion else None
                existing.is_against = dim.is_against.value
                existing.impact_direction = dim.impact_direction.value
                existing.llm_confidence = dim.confidence
                existing.relevancy = float(dim.relevancy)
                existing.evidence_type = dim.evidence_type.value
                existing.is_critical_opinion = dim.is_critical_opinion
                existing.risk_flag = dim.risk_flag
            else:
                # Create new record
                analysis = FeedbackAnalysis(
                    feedback_id=fb.id,
                    analysis_run_id=analysis_run.id,
                    theme=dim.theme,
                    sentiment=dim.sentiment.value,
                    emotion=dim.emotion.value if dim.emotion else None,
                    is_against=dim.is_against.value,
                    impact_direction=dim.impact_direction.value,
                    llm_confidence=dim.confidence,
                    relevancy=float(dim.relevancy),
                    evidence_type=dim.evidence_type.value,
                    is_critical_opinion=dim.is_critical_opinion,
                    risk_flag=dim.risk_flag,
                    model_name=model_info["model"],
                )
                session.add(analysis)
            
            saved_count += 1
        
        session.commit()
        print(f"   ✅ Saved {saved_count} dimension records")
        
        # Step 7: Generate summary and analytics
        print(f"\n📊 Step 5/5: Generating summary and analytics...")
        summary_result = summary_graph.invoke(
            {
                "discussion": discussion,
                "category": Category.FEEDBACK_RETROSPECTIVE,
                "dimensions": dimensions,
            },
            config=config,
        )
        
        summary = summary_result["summary"]
        theme_board = summary_result.get("theme_board")
        sentiment_table = summary_result.get("sentiment_table")
        
        print(f"   ✅ Summary generated")
        
        # Step 8: Save theme summaries
        if theme_board is not None and not theme_board.empty:
            print(f"\n💾 Saving theme summaries...")
            for _, row in theme_board.iterrows():
                theme_summary = ThemeSummary(
                    event_id=event_id,
                    analysis_run_id=analysis_run.id,
                    theme_label=row["theme_cluster_label"],
                    consensus=int(row.get("consensus", 0)),
                    polarity=float(row.get("polarity", 0)),
                    avg_confidence=float(row.get("avg_confidence")) if row.get("avg_confidence") else None,
                    total_weight=float(row.get("total_weight", 0)),
                    feedback_count=int(row.get("count", 0)),
                    top_quotes=json.dumps(row.get("quotes", [])),
                )
                session.add(theme_summary)
            session.commit()
            print(f"   ✅ Saved {len(theme_board)} theme summaries")
        
        # Step 9: Save event metrics
        if sentiment_table is not None and not sentiment_table.empty:
            sentiment_dist = sentiment_table.to_dict('records')[0] if len(sentiment_table) > 0 else {}
            
            # Calculate satisfaction index (0-100)
            # Formula: (positive% * 100 + neutral% * 50) / 100
            pos = sentiment_dist.get("POSITIVE", 0)
            neu = sentiment_dist.get("NEUTRAL", 0)
            satisfaction = (pos * 100 + neu * 50) / 100 if (pos + neu) > 0 else 50
            
            metrics = EventMetrics(
                event_id=event_id,
                analysis_run_id=analysis_run.id,
                total_feedback=len(feedbacks),
                accepted_feedback=len(feedbacks),
                sentiment_distribution=json.dumps(sentiment_dist),
                satisfaction_index=satisfaction,
            )
            session.add(metrics)
            session.commit()
            print(f"   ✅ Saved event metrics (satisfaction: {satisfaction:.1f}/100)")
        
        # Step 10: Save insights
        insights = EventInsights(
            event_id=event_id,
            analysis_run_id=analysis_run.id,
            what_went_well="\n".join(summary_result.get("what_we_agree_on", [])),
            what_needs_improvement="\n".join(summary_result.get("where_we_disagree", [])),
            contentious_topics=summary.conflicting_statement,
            overall_summary=summary.main_summary,
            model_name=model_info["model"],
        )
        session.add(insights)
        session.commit()
        print(f"   ✅ Saved event insights")
        
        # Step 11: Mark analysis as completed
        analysis_run.status = "COMPLETED"
        analysis_run.completed_at = datetime.utcnow()
        event.analysis_status = "COMPLETED"
        session.commit()
        
        elapsed = time.time() - start_time
        print(f"\n✨ Pipeline completed successfully in {elapsed:.1f}s")
        
        return {
            "analysis_run_id": analysis_run.id,
            "event_id": event_id,
            "status": "COMPLETED",
            "feedback_count": len(feedbacks),
            "themes_count": len(theme_board) if theme_board is not None else 0,
            "execution_time_seconds": elapsed,
            "summary": {
                "main_summary": summary.main_summary,
                "conflicting_statement": summary.conflicting_statement,
                "top_weighted_points": summary.top_weighted_points,
            },
            "highlights": summary_result.get("what_we_agree_on", []),
            "concerns": summary_result.get("where_we_disagree", []),
        }
        
    except Exception as e:
        # Mark as failed
        analysis_run.status = "FAILED"
        analysis_run.error_message = str(e)
        analysis_run.completed_at = datetime.utcnow()
        event.analysis_status = "FAILED"
        session.commit()
        
        print(f"\n❌ Pipeline failed: {e}")
        raise


def check_and_trigger_analysis(session: Session):
    """
    Check for events past their feedback_close_at and trigger analysis.
    This should be called periodically (e.g., every minute via cron or scheduler).
    
    Args:
        session: Database session
        
    Returns:
        List of event IDs that were analyzed
    """
    now = datetime.utcnow()
    
    # Find events that:
    # 1. Have closed feedback windows
    # 2. Haven't been analyzed yet (PENDING status)
    # 3. Are active
    events_to_analyze = session.exec(
        select(Event)
        .where(Event.feedback_close_at <= now)
        .where(Event.analysis_status == "PENDING")
        .where(Event.is_active == True)
    ).all()
    
    if not events_to_analyze:
        return []
    
    print(f"\n🔔 Found {len(events_to_analyze)} events ready for analysis")
    
    analyzed_ids = []
    for event in events_to_analyze:
        try:
            print(f"\n📊 Analyzing event {event.id}: {event.title}")
            run_analysis_pipeline(event.id, session)
            analyzed_ids.append(event.id)
        except Exception as e:
            print(f"❌ Failed to analyze event {event.id}: {e}")
            continue
    
    return analyzed_ids
