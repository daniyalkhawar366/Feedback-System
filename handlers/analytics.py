from sqlmodel import Session, select, func
from fastapi import HTTPException, status
from db.model import Event, Feedback, FeedbackAnalysis, Speaker
from typing import Dict, List
from datetime import datetime, timedelta
from collections import Counter
import json


def get_event_stats(session: Session, event_id: int, speaker_id: int) -> Dict:
    """
    Get comprehensive statistics for a specific event
    
    Returns sentiment breakdown, quality metrics, feedback counts
    """
    # Verify speaker owns this event
    event = session.exec(
        select(Event).where(
            (Event.id == event_id) & 
            (Event.speaker_id == speaker_id)
        )
    ).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Get all feedback for this event with analysis
    feedback_query = session.exec(
        select(Feedback, FeedbackAnalysis)
        .join(FeedbackAnalysis, FeedbackAnalysis.feedback_id == Feedback.id)
        .where(Feedback.event_id == event_id)
    ).all()
    
    if not feedback_query:
        return {
            "event_id": event_id,
            "event_title": event.title,
            "total_feedback": 0,
            "sentiment_distribution": {
                "positive": {"count": 0, "percentage": 0.0},
                "negative": {"count": 0, "percentage": 0.0},
                "neutral": {"count": 0, "percentage": 0.0}
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
    total_feedback = len(feedback_query)
    sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
    quality_counts = {"ACCEPT": 0, "FLAG": 0, "REJECT": 0}
    input_counts = {"text": 0, "audio": 0}
    confidence_scores = []
    latest_feedback_date = event.created_at
    
    for feedback, analysis in feedback_query:
        # Count sentiments
        sentiment = analysis.sentiment.lower()
        if sentiment in sentiment_counts:
            sentiment_counts[sentiment] += 1
        
        # Count quality decisions
        if feedback.quality_decision in quality_counts:
            quality_counts[feedback.quality_decision] += 1
        
        # Count input types
        if feedback.input_type in input_counts:
            input_counts[feedback.input_type] += 1
        
        # Collect confidence scores
        confidence_scores.append(analysis.confidence)
        
        # Track latest feedback date
        if feedback.created_at > latest_feedback_date:
            latest_feedback_date = feedback.created_at
    
    # Calculate percentages
    sentiment_distribution = {}
    for sentiment, count in sentiment_counts.items():
        percentage = (count / total_feedback * 100) if total_feedback > 0 else 0
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


def get_dashboard_stats(session: Session, speaker_id: int) -> Dict:
    """
    Get overview statistics across all speaker's events
    
    Used for speaker dashboard
    """
    # Get all events for this speaker
    events = session.exec(
        select(Event).where(Event.speaker_id == speaker_id)
    ).all()
    
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
    
    event_ids = [e.id for e in events]
    
    # Get all feedback and analysis for these events
    all_feedback_query = session.exec(
        select(Feedback, FeedbackAnalysis)
        .join(FeedbackAnalysis, FeedbackAnalysis.feedback_id == Feedback.id)
        .where(Feedback.event_id.in_(event_ids))
    ).all()
    
    # Aggregate statistics
    sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
    confidence_scores = []
    total_feedback = len(all_feedback_query)
    
    for feedback, analysis in all_feedback_query:
        sentiment = analysis.sentiment.lower()
        if sentiment in sentiment_counts:
            sentiment_counts[sentiment] += 1
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
        event_feedback = [f for f, a in all_feedback_query if f.event_id == event.id]
        feedback_by_event.append({
            "event_id": event.id,
            "event_title": event.title,
            "feedback_count": len(event_feedback)
        })
    
    return {
        "total_events": len(events),
        "active_events": sum(1 for e in events if e.is_active),
        "total_feedback_count": total_feedback,
        "overall_sentiment": overall_sentiment,
        "avg_confidence": round(avg_confidence, 3),
        "feedback_by_event": feedback_by_event
    }


def get_sentiment_trends(session: Session, event_id: int, speaker_id: int) -> Dict:
    """
    Get sentiment trends over time for an event
    
    Returns sentiment distribution grouped by time periods
    """
    # Verify speaker owns this event
    event = session.exec(
        select(Event).where(
            (Event.id == event_id) & 
            (Event.speaker_id == speaker_id)
        )
    ).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Get all feedback with analysis
    feedback_query = session.exec(
        select(Feedback, FeedbackAnalysis)
        .join(FeedbackAnalysis, FeedbackAnalysis.feedback_id == Feedback.id)
        .where(Feedback.event_id == event_id)
        .order_by(Feedback.created_at)
    ).all()
    
    if not feedback_query:
        return {
            "event_id": event_id,
            "total_feedback": 0,
            "trends": []
        }
    
    # Group by date
    trends_by_date = {}
    for feedback, analysis in feedback_query:
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
        "total_feedback": len(feedback_query),
        "trends": trends
    }


def get_top_keywords(
    session: Session, 
    event_id: int, 
    speaker_id: int,
    sentiment_filter: str = None,
    limit: int = 20
) -> Dict:
    """
    Extract and rank keywords from feedback
    
    Can filter by sentiment (positive/negative/neutral)
    """
    # Verify speaker owns this event
    event = session.exec(
        select(Event).where(
            (Event.id == event_id) & 
            (Event.speaker_id == speaker_id)
        )
    ).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Get feedback based on filter
    query = (
        select(Feedback, FeedbackAnalysis)
        .join(FeedbackAnalysis, FeedbackAnalysis.feedback_id == Feedback.id)
        .where(Feedback.event_id == event_id)
    )
    
    if sentiment_filter and sentiment_filter.lower() in ["positive", "negative", "neutral"]:
        query = query.where(FeedbackAnalysis.sentiment == sentiment_filter.capitalize())
    
    feedback_query = session.exec(query).all()
    
    if not feedback_query:
        return {
            "event_id": event_id,
            "sentiment_filter": sentiment_filter,
            "keywords": []
        }
    
    # Extract words from feedback text
    stop_words = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", 
        "with", "is", "are", "was", "were", "be", "been", "it", "this", "that",
        "um", "uh", "like", "yeah", "so", "ok", "okay", "well", "just"
    }
    
    all_words = []
    for feedback, analysis in feedback_query:
        text = feedback.normalized_text or feedback.raw_text
        # Simple word extraction
        words = text.lower().split()
        for word in words:
            # Remove punctuation and filter
            word = ''.join(c for c in word if c.isalnum())
            if len(word) > 3 and word not in stop_words:
                all_words.append(word)
    
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


def get_quality_metrics(session: Session, event_id: int, speaker_id: int) -> Dict:
    """
    Get quality gate analysis for all feedback in an event
    
    Shows breakdown of quality flags and decisions
    """
    # Verify speaker owns this event
    event = session.exec(
        select(Event).where(
            (Event.id == event_id) & 
            (Event.speaker_id == speaker_id)
        )
    ).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Get all feedback for this event
    all_feedback = session.exec(
        select(Feedback).where(Feedback.event_id == event_id)
    ).all()
    
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