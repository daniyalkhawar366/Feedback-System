from pydantic import BaseModel
from typing import Dict, List, Optional

class SentimentCount(BaseModel):
    count: int
    percentage: float

class SentimentDistribution(BaseModel):
    positive: SentimentCount
    negative: SentimentCount
    neutral: SentimentCount

class QualityBreakdown(BaseModel):
    accepted: int
    flagged: int
    rejected: int

class InputTypeBreakdown(BaseModel):
    text: int
    audio: int

class FeedbackCollectionPeriod(BaseModel):
    start_date: str
    end_date: Optional[str] = None

class EventStats(BaseModel):
    event_id: str
    event_title: str
    event_date: Optional[str] = None
    total_feedback: int
    valid_feedback: int
    sentiment_distribution: SentimentDistribution
    quality_breakdown: QualityBreakdown
    input_type_breakdown: InputTypeBreakdown
    avg_confidence: float
    feedback_collection_period: FeedbackCollectionPeriod

class FeedbackByEvent(BaseModel):
    event_id: str
    event_title: str
    feedback_count: int

class DashboardStats(BaseModel):
    total_events: int
    active_events: int
    total_feedback_count: int
    overall_sentiment: SentimentDistribution
    avg_confidence: float
    feedback_by_event: List[FeedbackByEvent]

class TrendDataPoint(BaseModel):
    date: str
    positive: int
    negative: int
    neutral: int
    total: int
    positive_pct: float
    negative_pct: float
    neutral_pct: float

class SentimentTrends(BaseModel):
    event_id: str
    total_feedback: int
    trends: List[TrendDataPoint]

class Keyword(BaseModel):
    word: str
    count: int
    percentage: float

class TopKeywords(BaseModel):
    event_id: str
    sentiment_filter: str
    total_keywords_extracted: int
    keywords: List[Keyword]

class QualityFlag(BaseModel):
    flag: str
    count: int

class QualityMetrics(BaseModel):
    event_id: str
    total_feedback: int
    quality_decision_breakdown: QualityBreakdown
    common_flags: List[QualityFlag]
