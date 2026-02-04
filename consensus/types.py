"""
Type definitions for consensus reporting system.
Includes categories, dimensions, and output schemas.
"""

from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


# ============================================================================
# CATEGORIES
# ============================================================================

class Category(str, Enum):
    """Discussion/Event category types."""
    BINARY_PROPOSAL = "BINARY_PROPOSAL"
    PRIORITIZATION_RANKING = "PRIORITIZATION_RANKING"
    BRAINSTORMING_IDEATION = "BRAINSTORMING_IDEATION"
    FEEDBACK_RETROSPECTIVE = "FEEDBACK_RETROSPECTIVE"  # Default for event feedback
    FORECASTING_PLANNING = "FORECASTING_PLANNING"


# ============================================================================
# COMMON DIMENSIONS
# ============================================================================

class Sentiment(str, Enum):
    """Sentiment classification."""
    POSITIVE = "POSITIVE"
    NEUTRAL = "NEUTRAL"
    NEGATIVE = "NEGATIVE"


class Emotion(str, Enum):
    """Plutchik's 8 basic emotions."""
    ANTICIPATION = "ANTICIPATION"
    JOY = "JOY"
    TRUST = "TRUST"
    SURPRISE = "SURPRISE"
    ANGER = "ANGER"
    FEAR = "FEAR"
    SADNESS = "SADNESS"
    DISGUST = "DISGUST"


class EvidenceType(str, Enum):
    """Type of evidence supporting the opinion."""
    DATA = "DATA"                    # Quantitative data/metrics
    BENCHMARK = "BENCHMARK"          # Comparison/benchmarking
    CITATION = "CITATION"            # External sources/references
    EXPERT_OPINION = "EXPERT_OPINION"  # Professional opinion
    ANECDOTE = "ANECDOTE"           # Personal experience
    ASSUMPTION = "ASSUMPTION"        # Unsubstantiated claim


class IsAgainst(str, Enum):
    """Opposition stance."""
    YES = "YES"
    NO = "NO"
    MIXED = "MIXED"


# ============================================================================
# CATEGORY-SPECIFIC DIMENSIONS
# ============================================================================

class IsAgreeing(str, Enum):
    """Agreement stance (BINARY_PROPOSAL)."""
    YES = "YES"
    NO = "NO"
    MAYBE = "MAYBE"


class PriorityClass(str, Enum):
    """MoSCoW prioritization (PRIORITIZATION_RANKING)."""
    MUST = "MUST"      # Must have
    SHOULD = "SHOULD"  # Should have
    COULD = "COULD"    # Could have (nice to have)
    WONT = "WONT"      # Won't have (explicitly excluded)


class Actionability(str, Enum):
    """Idea actionability (BRAINSTORMING_IDEATION)."""
    QUICK_WIN = "QUICK_WIN"          # Low effort, high value
    NEEDS_RESEARCH = "NEEDS_RESEARCH"  # Requires investigation
    BIG_BET = "BIG_BET"              # High effort, strategic
    NOT_USEFUL = "NOT_USEFUL"        # Infeasible/duplicate/irrelevant


class ImpactDirection(str, Enum):
    """Impact on outcomes (FEEDBACK_RETROSPECTIVE)."""
    HELPED = "HELPED"    # Positive impact
    NEUTRAL = "NEUTRAL"  # No significant impact
    HURT = "HURT"        # Negative impact


class DeliveryStatus(str, Enum):
    """Delivery/timeline status (FORECASTING_PLANNING)."""
    AHEAD = "AHEAD"           # Ahead of schedule
    ON_TRACK = "ON_TRACK"     # On schedule
    AT_RISK = "AT_RISK"       # Behind but recoverable
    BLOCKED = "BLOCKED"       # Blocked/severely delayed


# ============================================================================
# DIMENSION SCHEMAS
# ============================================================================

class BaseDimensions(BaseModel):
    """Common dimensions extracted from all feedback."""
    theme: str = Field(..., description="Primary topic cluster (1-4 words)")
    sentiment: Sentiment
    emotion: Optional[Emotion] = None
    is_critical_opinion: bool = Field(
        ..., description="Contains substantive claim that could influence decisions"
    )
    risk_flag: bool = Field(..., description="Contains unsafe/inappropriate content")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Speaker's confidence level")
    relevancy: int = Field(..., ge=0, le=100, description="Text-to-topic relevancy score")
    is_against: IsAgainst
    evidence_type: EvidenceType
    text: str = Field(..., description="Original or redacted user text")


class BinaryProposal(BaseDimensions):
    """Dimensions for yes/no decision discussions."""
    is_agreeing: IsAgreeing


class PrioritizationRanking(BaseDimensions):
    """Dimensions for prioritization/ranking discussions."""
    priority_class: PriorityClass


class BrainstormingIdeation(BaseDimensions):
    """Dimensions for idea generation discussions."""
    actionability: Actionability


class FeedbackRetrospective(BaseDimensions):
    """Dimensions for retrospective/review discussions (EVENT FEEDBACK DEFAULT)."""
    impact_direction: ImpactDirection


class ForecastingPlanning(BaseDimensions):
    """Dimensions for timeline/planning discussions."""
    delivery_status: DeliveryStatus


# Union type for all dimension types
Dimensions = (
    BinaryProposal
    | PrioritizationRanking
    | BrainstormingIdeation
    | FeedbackRetrospective
    | ForecastingPlanning
)


# ============================================================================
# DISCUSSION/MESSAGE MODELS
# ============================================================================

class Message(BaseModel):
    """Individual feedback message."""
    id: int
    message: str


class Discussion(BaseModel):
    """Discussion/Event container."""
    name: str
    description: str
    template: Optional[Category] = None  # Pre-assigned category
    messages: List[Message]


# ============================================================================
# SUMMARY OUTPUT
# ============================================================================

class Summary(BaseModel):
    """Final LLM-generated summary output."""
    main_summary: str = Field(
        ..., description="5-7 sentence cohesive summary of agreed-upon themes"
    )
    conflicting_statement: str = Field(
        ..., description="2-4 sentence summary of disagreements and conflicts"
    )
    top_weighted_points: List[str] = Field(
        default_factory=list,
        description="Top 3 most important feedback quotes (exact text)",
    )
