"""
Main report generation orchestrator.
Simplified workflow for event feedback (always FEEDBACK_RETROSPECTIVE).
"""

from typing import Optional
from consensus.llm_config import get_llm
from consensus.types import Discussion, Category, Summary
from consensus.dimension_extraction import dimension_extraction_graph
from consensus.summary import summary_graph


def generate_report(
    discussion: Discussion,
    llm_provider: Optional[str] = None,
    llm_model: Optional[str] = None,
) -> dict:
    """
    Generate comprehensive report from event feedback.
    
    Simplified pipeline for event feedback:
    1. Skip category selection (always FEEDBACK_RETROSPECTIVE)
    2. Extract dimensions from all feedback
    3. Generate summary with statistics
    
    Args:
        discussion: Discussion object with event info and feedback messages
        llm_provider: Override LLM provider (groq|openai|anthropic)
        llm_model: Override model name
    
    Returns:
        Dict with:
            - category: Category.FEEDBACK_RETROSPECTIVE
            - dimensions: List of extracted dimensions
            - summary: Summary object with main_summary, conflicting_statement, top_weighted_points
            - what_we_agree_on: List of highlight bullets
            - where_we_disagree: List of concern bullets
            - what_to_decide_next: List of action item bullets
            - theme_board: DataFrame with theme leaderboard
            - evidence_board: DataFrame with top evidence
            - sentiment_table: DataFrame with sentiment breakdown
            - emotion_table: DataFrame with emotion distribution
    
    Raises:
        ValueError: If discussion has no messages or invalid data
        Exception: If LLM calls fail
    """
    # Initialize LLM
    llm = get_llm(provider=llm_provider, model=llm_model)
    config = {"configurable": {"llm": llm}}
    
    # Event feedback is always retrospective
    category = Category.FEEDBACK_RETROSPECTIVE
    
    print(f"📊 Generating report for: {discussion.name}")
    print(f"   Category: {category.value}")
    print(f"   Feedback count: {len(discussion.messages)}")
    
    # Step 1: Extract dimensions from all feedback
    print("\n🔍 Step 1/2: Extracting dimensions...")
    dim_result = dimension_extraction_graph.invoke(
        {
            "discussion": discussion,
            "category": category,
            "dimensions": None,
        },
        config=config,
    )
    dimensions = dim_result["dimensions"]
    print(f"   ✅ Extracted {len(dimensions)} dimension sets")
    
    # Step 2: Generate summary and analytics
    print("\n📝 Step 2/2: Generating summary...")
    summary_result = summary_graph.invoke(
        {
            "discussion": discussion,
            "category": category,
            "dimensions": dimensions,
        },
        config=config,
    )
    
    print("   ✅ Report generated successfully!")
    
    # Return complete report
    return {
        "category": category.value,
        "dimensions": [d.model_dump() for d in dimensions],
        "summary": summary_result["summary"].model_dump(),
        "what_we_agree_on": summary_result.get("what_we_agree_on", []),
        "where_we_disagree": summary_result.get("where_we_disagree", []),
        "what_to_decide_next": summary_result.get("what_to_decide_next", []),
        "theme_board": summary_result.get("theme_board"),
        "evidence_board": summary_result.get("evidence_board"),
        "sentiment_table": summary_result.get("sentiment_table"),
        "emotion_table": summary_result.get("emotion_table"),
    }


def generate_report_for_event(
    event_id: int,
    db_session,
    min_feedback_count: int = 5,
) -> dict:
    """
    Generate report for event by fetching from database.
    
    Args:
        event_id: Event ID to generate report for
        db_session: SQLAlchemy database session
        min_feedback_count: Minimum ACCEPT-quality feedback required
    
    Returns:
        Complete report dict (same as generate_report)
    
    Raises:
        ValueError: If event not found or insufficient feedback
    """
    from consensus.adapters import adapt_event_for_report
    
    # Fetch event and feedback, convert to Discussion
    discussion = adapt_event_for_report(
        event_id=event_id,
        db_session=db_session,
        category=Category.FEEDBACK_RETROSPECTIVE,
        min_feedback_count=min_feedback_count,
    )
    
    # Generate report
    report = generate_report(discussion)
    
    # Add event metadata
    report["event_id"] = event_id
    report["event_name"] = discussion.name
    report["feedback_count"] = len(discussion.messages)
    
    return report
