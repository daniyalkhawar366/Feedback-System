"""
Main pipeline orchestrator for feedback analysis.

Coordinates the three-step process:
1. Per-feedback classification (parallel)
2. Analytics aggregation (pure Python)
3. Event report generation (single LLM call)
"""
import asyncio
from typing import List, Dict, Tuple
from datetime import datetime
from db.mongo_models import (
    EventDocument, 
    FeedbackDocument, 
    FeedbackAnalysisDocument,
    EventAnalyticsDocument,
    EventReportDocument
)
from consensus.feedback_classifier import classify_feedbacks_parallel
from consensus.analytics_aggregator import aggregate_feedback_analytics, format_analytics_for_display
from consensus.report_generator import generate_report_with_fallback


async def run_feedback_analysis_pipeline(
    event_id: str,
    model: str = None
) -> Tuple[Dict, Dict]:
    """
    Run the complete feedback analysis pipeline for an event.
    
    Args:
        event_id: ID of the event to analyze (MongoDB ObjectId as string)
        model: LLM model for classification (default: from env)
        
    Returns:
        Tuple of (analytics_dict, report_dict)
        
    Steps:
        1. Fetch all feedbacks for the event
        2. Classify each feedback in parallel (Step 1)
        3. Save classifications to FeedbackAnalysis collection
        4. Aggregate analytics (Step 2)
        5. Save analytics to EventAnalytics collection
        6. Generate report (Step 3)
        7. Save report to EventReport collection
    """
    start_time = datetime.utcnow()
    
    # Fetch event
    event = await EventDocument.get(event_id)
    if not event:
        raise ValueError(f"Event {event_id} not found")
    
    event_name = event.title or f"Event {event_id}"
    
    print(f"🚀 Starting feedback analysis pipeline for: {event_name}")
    
    # ============================================================
    # STEP 1: FETCH FEEDBACKS (EXCLUDE FLAGGED)
    # ============================================================
    print(f"📋 Fetching feedbacks for event {event_id}...")
    
    # Only include ACCEPTED feedbacks in report generation
    # Flagged feedbacks are shown in UI but excluded from analysis
    feedbacks = await FeedbackDocument.find(
        FeedbackDocument.event_id == event_id,
        FeedbackDocument.quality_decision == "ACCEPT"
    ).to_list()
    
    if not feedbacks:
        print("⚠️ No accepted feedbacks found for this event")
        return {}, {}
    
    print(f"✅ Found {len(feedbacks)} accepted feedbacks for analysis")
    
    # Prepare feedback data for classification
    feedback_data = [
        {
            "id": str(fb.id),
            "text": fb.normalized_text or fb.raw_text
        }
        for fb in feedbacks
    ]
    
    # ============================================================
    # STEP 2: PARALLEL CLASSIFICATION
    # ============================================================
    print(f"🔍 Classifying {len(feedback_data)} feedbacks in parallel...")
    
    classifications = await classify_feedbacks_parallel(feedback_data, model=model)
    
    # Count successes and failures
    successful = [c for c in classifications if c.get("status") == "success"]
    failed = [c for c in classifications if c.get("status") == "failed"]
    
    print(f"✅ Successfully classified: {len(successful)}")
    if failed:
        print(f"⚠️ Failed classifications: {len(failed)}")
        for fail in failed:
            print(f"   - Feedback {fail['feedback_id']}: {fail.get('error')}")
    
    # ============================================================
    # STEP 3: SAVE CLASSIFICATIONS TO DATABASE
    # ============================================================
    print(f"💾 Saving classifications to database...")
    
    for classification in successful:
        feedback_id = classification["feedback_id"]
        
        # Check if analysis already exists
        existing = await FeedbackAnalysisDocument.find_one(
            FeedbackAnalysisDocument.feedback_id == feedback_id
        )
        
        if existing:
            # Update existing
            existing.sentiment = classification["sentiment"]
            existing.confidence = classification["confidence"]
            existing.intent = classification["intent"]
            existing.aspects = classification["aspects"]
            existing.issue_label = classification.get("issue_label")
            existing.evidence_quote = classification.get("evidence_quote")
            await existing.save()
        else:
            # Create new
            analysis = FeedbackAnalysisDocument(
                feedback_id=feedback_id,
                sentiment=classification["sentiment"],
                confidence=classification["confidence"],
                intent=classification["intent"],
                aspects=classification["aspects"],
                issue_label=classification.get("issue_label"),
                evidence_quote=classification.get("evidence_quote")
            )
            await analysis.insert()
    
    print(f"✅ Saved {len(successful)} classifications")
    
    # ============================================================
    # STEP 4: AGGREGATE ANALYTICS (NO LLM)
    # ============================================================
    print(f"📊 Aggregating analytics...")
    
    # Build feedback text mapping
    feedback_texts = {str(fb.id): (fb.normalized_text or fb.raw_text) for fb in feedbacks}
    
    analytics = aggregate_feedback_analytics(successful, feedback_texts)
    
    print(f"✅ Analytics computed:")
    print(f"   - Total: {analytics['total_responses']}")
    print(f"   - Satisfaction: {analytics['satisfaction_score']}%")
    print(f"   - Positive: {analytics['positive_count']}")
    print(f"   - Neutral: {analytics['neutral_count']}")
    print(f"   - Negative: {analytics['negative_count']}")
    
    # ============================================================
    # STEP 5: SAVE ANALYTICS TO DATABASE
    # ============================================================
    print(f"💾 Saving analytics to database...")
    
    # Check if analytics already exist
    existing_analytics = await EventAnalyticsDocument.find_one(
        EventAnalyticsDocument.event_id == event_id
    )
    
    if existing_analytics:
        # Update existing
        existing_analytics.total_responses = analytics["total_responses"]
        existing_analytics.positive_count = analytics["positive_count"]
        existing_analytics.neutral_count = analytics["neutral_count"]
        existing_analytics.negative_count = analytics["negative_count"]
        existing_analytics.satisfaction_score = analytics["satisfaction_score"]
        existing_analytics.top_strengths = analytics["top_strengths"]
        existing_analytics.top_issues = analytics["top_issues"]
        existing_analytics.intent_summary = analytics["intent_summary"]
        existing_analytics.generated_at = datetime.utcnow()
        await existing_analytics.save()
    else:
        # Create new
        event_analytics = EventAnalyticsDocument(
            event_id=event_id,
            total_responses=analytics["total_responses"],
            positive_count=analytics["positive_count"],
            neutral_count=analytics["neutral_count"],
            negative_count=analytics["negative_count"],
            satisfaction_score=analytics["satisfaction_score"],
            top_strengths=analytics["top_strengths"],
            top_issues=analytics["top_issues"],
            intent_summary=analytics["intent_summary"]
        )
        await event_analytics.insert()
    
    print(f"✅ Analytics saved")
    
    # ============================================================
    # STEP 6: GENERATE REPORT (ONE LLM CALL)
    # ============================================================
    print(f"📝 Generating event report...")
    
    report = generate_report_with_fallback(event_name, analytics)
    
    print(f"✅ Report generated")
    
    # ============================================================
    # STEP 7: SAVE REPORT TO DATABASE
    # ============================================================
    print(f"💾 Saving report to database...")
    
    generation_time = (datetime.utcnow() - start_time).total_seconds()
    
    event_report = EventReportDocument(
        event_id=event_id,
        executive_summary=report["executive_summary"],
        strengths=report["strengths"],
        improvements=report["improvements"],
        recommendations=report["recommendations"],
        representative_quotes=analytics.get("representative_quotes", {}),
        generation_time_seconds=generation_time
    )
    
    await event_report.insert()
    
    print(f"✅ Report saved (took {generation_time:.2f}s)")
    print(f"🎉 Pipeline complete!")
    
    # Update event status
    event.analysis_status = "done"
    await event.save()
    
    # Return formatted data for API response
    formatted_analytics = format_analytics_for_display(analytics)
    
    return formatted_analytics, report


async def run_analysis_sync(event_id: str, model: str = None) -> Tuple[Dict, Dict]:
    """
    Async wrapper for the pipeline - can be called from FastAPI async endpoints.
    
    Args:
        event_id: Event ID to analyze (MongoDB ObjectId as string)
        model: LLM model for classification
        
    Returns:
        Tuple of (analytics_dict, report_dict)
    """
    return await run_feedback_analysis_pipeline(event_id, model)
