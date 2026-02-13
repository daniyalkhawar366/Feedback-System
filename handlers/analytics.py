"""
Analytics Handlers - MongoDB Version (Async)
"""
from fastapi import HTTPException, status
from typing import Dict, List, Optional
from collections import Counter
from datetime import datetime, timedelta
import json

from db.mongo_models import EventDocument, FeedbackDocument, FeedbackAnalysisDocument


async def get_event_stats(event_id: str, speaker_id: str) -> Dict:
    """
    Get comprehensive statistics for a specific event
    
    Returns sentiment breakdown, quality metrics, feedback counts
    """
    # Verify speaker owns this event
    event = await EventDocument.get(event_id)
    
    if not event or str(event.speaker_id) != speaker_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Get all feedback for this event
    all_feedbacks = await FeedbackDocument.find(
        FeedbackDocument.event_id == event_id
    ).to_list()
    
    if not all_feedbacks:
        return {
            "event_id": event_id,
            "event_title": event.title,
            "total_feedback": 0,
            "sentiment_distribution": {
                "positive": {"count": 0, "percentage": 0.0},
                "negative": {"count": 0, "percentage": 0.0},
                "neutral": {"count": 0, "percentage": 0.0},
                "pending": {"count": 0, "percentage": 0.0}
            },
            "quality_breakdown": {
                "accepted": 0,
                "flagged": 0,
                "rejected": 0
            },
            "input_type_breakdown": {
                "text": 0,
                "audio": 0
            },
            "avg_confidence": 0.0,
            "feedback_collection_period": {
                "start_date": event.created_at.isoformat(),
                "end_date": None
            }
        }
    
    # Process feedback data
    total_feedback = len(all_feedbacks)
    sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0, "pending": 0}
    quality_counts = {"ACCEPT": 0, "FLAG": 0, "REJECT": 0}
    input_counts = {"text": 0, "audio": 0}
    confidence_scores = []
    latest_feedback_date = event.created_at
    
    # Count non-flagged feedbacks for percentage calculations
    valid_feedback_count = 0
    
    for feedback in all_feedbacks:
        # Get analysis for this feedback
        analysis = await FeedbackAnalysisDocument.find_one(
            FeedbackAnalysisDocument.feedback_id == str(feedback.id)
        )
        
        # Only count ACCEPTED feedbacks for sentiment distribution percentages
        if feedback.quality_decision == "ACCEPT":
            valid_feedback_count += 1
            
            # Count sentiments (handle pending analysis)
            if analysis and analysis.sentiment:
                sentiment = analysis.sentiment.lower()
                if sentiment in sentiment_counts:
                    sentiment_counts[sentiment] += 1
                # Collect confidence scores only if analyzed
                if analysis.confidence:
                    confidence_scores.append(analysis.confidence)
            else:
                sentiment_counts["pending"] += 1
        
        # Count quality decisions
        if feedback.quality_decision in quality_counts:
            quality_counts[feedback.quality_decision] += 1
        
        # Count input types
        if feedback.input_type in input_counts:
            input_counts[feedback.input_type] += 1
        
        # Track latest feedback date
        if feedback.created_at > latest_feedback_date:
            latest_feedback_date = feedback.created_at
    
    # Calculate percentages based on valid (non-flagged) feedback only
    sentiment_distribution = {}
    for sentiment, count in sentiment_counts.items():
        percentage = (count / valid_feedback_count * 100) if valid_feedback_count > 0 else 0
        sentiment_distribution[sentiment] = {
            "count": count,
            "percentage": round(percentage, 2)
        }
    
    # Calculate average confidence
    avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
    
    return {
        "event_id": event_id,
        "event_title": event.title,
        "event_date": event.event_date.isoformat() if event.event_date else None,
        "total_feedback": total_feedback,
        "valid_feedback": valid_feedback_count,  # Non-flagged/rejected feedbacks
        "sentiment_distribution": sentiment_distribution,
        "quality_breakdown": {
            "accepted": quality_counts["ACCEPT"],
            "flagged": quality_counts["FLAG"],
            "rejected": quality_counts["REJECT"]
        },
        "input_type_breakdown": {
            "text": input_counts["text"],
            "audio": input_counts["audio"]
        },
        "avg_confidence": round(avg_confidence, 3),
        "feedback_collection_period": {
            "start_date": event.created_at.isoformat(),
            "end_date": latest_feedback_date.isoformat()
        }
    }


async def get_dashboard_stats(speaker_id: str) -> Dict:
    """
    Get overview statistics across all speaker's events
    
    Used for speaker dashboard
    """
    # Get all events for this speaker
    events = await EventDocument.find(
        EventDocument.speaker_id == speaker_id
    ).to_list()
    
    if not events:
        return {
            "total_events": 0,
            "active_events": 0,
            "total_feedback_count": 0,
            "overall_sentiment": {
                "positive": {"count": 0, "percentage": 0.0},
                "negative": {"count": 0, "percentage": 0.0},
                "neutral": {"count": 0, "percentage": 0.0}
            },
            "avg_confidence": 0.0,
            "feedback_by_event": []
        }
    
    event_ids = [str(e.id) for e in events]
    
    # Get all feedback for these events
    all_feedbacks = await FeedbackDocument.find(
        {"event_id": {"$in": event_ids}}
    ).to_list()
    
    # Get all analyses for the feedbacks
    feedback_ids = [str(f.id) for f in all_feedbacks]
    all_analyses = await FeedbackAnalysisDocument.find(
        {"feedback_id": {"$in": feedback_ids}}
    ).to_list()
    
    # Create a map of feedback_id to analysis
    analysis_map = {str(a.feedback_id): a for a in all_analyses}
    
    # Aggregate statistics
    sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
    confidence_scores = []
    total_feedback = 0
    
    for feedback in all_feedbacks:
        analysis = analysis_map.get(str(feedback.id))
        if analysis and analysis.sentiment:
            total_feedback += 1
            sentiment = analysis.sentiment.lower()
            if sentiment in sentiment_counts:
                sentiment_counts[sentiment] += 1
            if analysis.confidence:
                confidence_scores.append(analysis.confidence)
    
    # Calculate percentages
    overall_sentiment = {}
    for sentiment, count in sentiment_counts.items():
        percentage = (count / total_feedback * 100) if total_feedback > 0 else 0
        overall_sentiment[sentiment] = {
            "count": count,
            "percentage": round(percentage, 2)
        }
    
    avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
    
    # Feedback per event
    feedback_by_event = []
    for event in events:
        event_feedback_count = len([f for f in all_feedbacks if f.event_id == str(event.id)])
        feedback_by_event.append({
            "event_id": str(event.id),
            "event_title": event.title,
            "feedback_count": event_feedback_count
        })
    
    return {
        "total_events": len(events),
        "active_events": sum(1 for e in events if e.is_active),
        "total_feedback_count": total_feedback,
        "overall_sentiment": overall_sentiment,
        "avg_confidence": round(avg_confidence, 3),
        "feedback_by_event": feedback_by_event
    }


async def get_sentiment_trends(event_id: str, speaker_id: str) -> Dict:
    """
    Get sentiment trends over time for an event
    
    Returns sentiment distribution grouped by time periods
    """
    # Verify speaker owns this event
    event = await EventDocument.get(event_id)
    
    if not event or str(event.speaker_id) != speaker_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Get all feedback with analysis
    all_feedbacks = await FeedbackDocument.find(
        FeedbackDocument.event_id == event_id
    ).sort("+created_at").to_list()
    
    if not all_feedbacks:
        return {
            "event_id": event_id,
            "total_feedback": 0,
            "trends": []
        }
    
    # Get all analyses
    feedback_ids = [str(f.id) for f in all_feedbacks]
    all_analyses = await FeedbackAnalysisDocument.find(
        {"feedback_id": {"$in": feedback_ids}}
    ).to_list()
    
    # Create analysis map
    analysis_map = {str(a.feedback_id): a for a in all_analyses}
    
    # Group by date
    trends_by_date = {}
    valid_count = 0
    
    for feedback in all_feedbacks:
        analysis = analysis_map.get(str(feedback.id))
        if not analysis or not analysis.sentiment:
            continue
            
        valid_count += 1
        date_key = feedback.created_at.date().isoformat()
        if date_key not in trends_by_date:
            trends_by_date[date_key] = {
                "positive": 0,
                "negative": 0,
                "neutral": 0
            }
        
        sentiment = analysis.sentiment.lower()
        if sentiment in trends_by_date[date_key]:
            trends_by_date[date_key][sentiment] += 1
    
    # Convert to list with percentages
    trends = []
    for date_str in sorted(trends_by_date.keys()):
        date_data = trends_by_date[date_str]
        total = sum(date_data.values())
        
        trends.append({
            "date": date_str,
            "positive": date_data["positive"],
            "negative": date_data["negative"],
            "neutral": date_data["neutral"],
            "total": total,
            "positive_pct": round(date_data["positive"] / total * 100, 2) if total > 0 else 0,
            "negative_pct": round(date_data["negative"] / total * 100, 2) if total > 0 else 0,
            "neutral_pct": round(date_data["neutral"] / total * 100, 2) if total > 0 else 0
        })
    
    return {
        "event_id": event_id,
        "total_feedback": valid_count,
        "trends": trends
    }


async def get_top_keywords(
    event_id: str, 
    speaker_id: str,
    sentiment_filter: Optional[str] = None,
    limit: int = 20
) -> Dict:
    """
    Extract and rank keywords from feedback
    
    Can filter by sentiment (positive/negative/neutral)
    """
    # Verify speaker owns this event
    event = await EventDocument.get(event_id)
    
    if not event or str(event.speaker_id) != speaker_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Get feedback for this event
    all_feedbacks = await FeedbackDocument.find(
        FeedbackDocument.event_id == event_id
    ).to_list()
    
    if not all_feedbacks:
        return {
            "event_id": event_id,
            "sentiment_filter": sentiment_filter,
            "keywords": []
        }
    
    # Get analyses with optional sentiment filter
    feedback_ids = [str(f.id) for f in all_feedbacks]
    
    if sentiment_filter and sentiment_filter.lower() in ["positive", "negative", "neutral"]:
        all_analyses = await FeedbackAnalysisDocument.find(
            {"feedback_id": {"$in": feedback_ids}, "sentiment": sentiment_filter.capitalize()}
        ).to_list()
    else:
        all_analyses = await FeedbackAnalysisDocument.find(
            {"feedback_id": {"$in": feedback_ids}}
        ).to_list()
    
    # Create feedback map
    feedback_map = {str(f.id): f for f in all_feedbacks}
    
    # Extract words from feedback text
    stop_words = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", 
        "with", "is", "are", "was", "were", "be", "been", "it", "this", "that",
        "um", "uh", "like", "yeah", "so", "ok", "okay", "well", "just"
    }
    
    all_words = []
    for analysis in all_analyses:
        feedback = feedback_map.get(str(analysis.feedback_id))
        if not feedback:
            continue
            
        text = feedback.normalized_text or feedback.raw_text
        # Simple word extraction
        words = text.lower().split()
        for word in words:
            # Remove punctuation and filter
            word = ''.join(c for c in word if c.isalnum())
            if len(word) > 3 and word not in stop_words:
                all_words.append(word)
    
    if not all_words:
        return {
            "event_id": event_id,
            "sentiment_filter": sentiment_filter or "all",
            "total_keywords_extracted": 0,
            "keywords": []
        }
    
    # Count words
    word_counts = Counter(all_words)
    top_keywords = word_counts.most_common(limit)
    
    return {
        "event_id": event_id,
        "sentiment_filter": sentiment_filter or "all",
        "total_keywords_extracted": len(all_words),
        "keywords": [
            {"word": word, "count": count, "percentage": round(count / len(all_words) * 100, 2)}
            for word, count in top_keywords
        ]
    }


async def get_quality_metrics(event_id: str, speaker_id: str) -> Dict:
    """
    Get quality gate analysis for all feedback in an event
    
    Shows breakdown of quality flags and decisions
    """
    # Verify speaker owns this event
    event = await EventDocument.get(event_id)
    
    if not event or str(event.speaker_id) != speaker_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Get all feedback for this event
    all_feedback = await FeedbackDocument.find(
        FeedbackDocument.event_id == event_id
    ).to_list()
    
    if not all_feedback:
        return {
            "event_id": event_id,
            "total_feedback": 0,
            "quality_decision_breakdown": {
                "accepted": 0,
                "flagged": 0,
                "rejected": 0
            },
            "common_flags": []
        }
    
    # Count quality decisions
    quality_counts = {"ACCEPT": 0, "FLAG": 0, "REJECT": 0}
    all_flags = []
    
    for feedback in all_feedback:
        if feedback.quality_decision in quality_counts:
            quality_counts[feedback.quality_decision] += 1
        
        if feedback.quality_flags:
            try:
                flags = json.loads(feedback.quality_flags)
                all_flags.extend(flags)
            except:
                pass
    
    # Count flag occurrences
    flag_counts = Counter(all_flags)
    common_flags = flag_counts.most_common(10)
    
    return {
        "event_id": event_id,
        "total_feedback": len(all_feedback),
        "quality_decision_breakdown": {
            "accepted": quality_counts["ACCEPT"],
            "flagged": quality_counts["FLAG"],
            "rejected": quality_counts["REJECT"]
        },
        "common_flags": [
            {"flag": flag, "count": count}
            for flag, count in common_flags
        ]
    }