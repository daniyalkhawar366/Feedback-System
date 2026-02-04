from typing import cast

from langchain_core.language_models import BaseChatModel, LanguageModelInput
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable, RunnableConfig
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph
from pydantic import BaseModel

from consensus.types import Discussion, Category


CATEGORY_EXTRACTION_SYSTEM_PROMPT = """You are a classifier for EVENT FEEDBACK analysis. Your task is to read event information and assign EXACTLY ONE category.

For event feedback systems (conferences, talks, seminars), the category is USUALLY "FEEDBACK_RETROSPECTIVE" since attendees are reviewing a past event.

However, classify based on the DOMINANT INTENT if the event description indicates a different purpose:

1) BINARY_PROPOSAL — yes/no or approve/reject decisions. Examples: "Should we adopt Tool X?", "Approve design v3?"
2) PRIORITIZATION_RANKING — ordering, top-N lists, what to do first. Examples: "Which features first?", "Rank backlog items."
3) BRAINSTORMING_IDEATION — divergent idea generation, suggestions. Examples: "Ideas to reduce downtime?", "Ways to improve onboarding?"
4) FEEDBACK_RETROSPECTIVE — reflections, ratings, lessons learned, event reviews. Examples: "How was the speaker?", "Rate the conference", "Post-event feedback."
5) FORECASTING_PLANNING — timelines, estimates, roadmaps. Examples: "When will Feature Y be ready?", "Expected ROI?"

Decision rules for EVENT FEEDBACK:
- If the event is about collecting opinions on a past talk/session → FEEDBACK_RETROSPECTIVE (MOST COMMON)
- If attendees are asked to decide on something → BINARY_PROPOSAL
- If feedback is about prioritizing next steps → PRIORITIZATION_RANKING
- If event was a brainstorming session → BRAINSTORMING_IDEATION
- If discussing timelines/planning → FORECASTING_PLANNING

Input:
- topic: event title
- description: event description + speaker + date

Output format (STRICT):
Return ONLY a single-line JSON object:
{{"category":"<one of: BINARY_PROPOSAL | PRIORITIZATION_RANKING | BRAINSTORMING_IDEATION | FEEDBACK_RETROSPECTIVE | FORECASTING_PLANNING>"}}

Examples:
- topic: "AI in Healthcare - Dr. Smith", description: "Keynote talk about AI applications" → {{"category":"FEEDBACK_RETROSPECTIVE"}}
- topic: "Q1 Product Review", description: "Team feedback on product features" → {{"category":"FEEDBACK_RETROSPECTIVE"}}
- topic: "Should we migrate to Kubernetes?", description: "Decision meeting" → {{"category":"BINARY_PROPOSAL"}}

Now classify the provided event and return ONLY the JSON object."""

CATEGORY_EXTRACTION_PROMPT_TEMPLATE = ChatPromptTemplate.from_messages(
    [
        ("system", CATEGORY_EXTRACTION_SYSTEM_PROMPT),
        ("user", "Topic: {topic}\nDescription: {description}"),
    ]
)


class CategorySelectionGraphState(BaseModel):
    discussion: Discussion
    category: Category | None = None


def has_discussion_template(state: CategorySelectionGraphState) -> bool:
    return state.discussion.template is not None


def extract_category_from_discussion_template(state: CategorySelectionGraphState) -> dict:
    return {"category": state.discussion.template}


def extract_category_from_discussion(state: CategorySelectionGraphState, config: RunnableConfig) -> dict:
    llm = cast(BaseChatModel, config["configurable"]["llm"])
    structured_llm = cast(
        Runnable[LanguageModelInput, Category],
        llm.with_structured_output(Category),
    )

    chain = CATEGORY_EXTRACTION_PROMPT_TEMPLATE | structured_llm

    category = chain.invoke(
        {
            "topic": state.discussion.name,
            "description": state.discussion.description,
        }
    )

    return {"category": category}


category_selection_graph_builder = StateGraph(CategorySelectionGraphState)
category_selection_graph_builder.add_node(extract_category_from_discussion_template)
category_selection_graph_builder.add_node(extract_category_from_discussion)

category_selection_graph_builder.add_conditional_edges(
    START,
    has_discussion_template,
    path_map={
        True: "extract_category_from_discussion_template",
        False: "extract_category_from_discussion",
    },
)

category_selection_graph_builder.add_edge("extract_category_from_discussion_template", END)
category_selection_graph_builder.add_edge("extract_category_from_discussion", END)

category_selection_graph: CompiledStateGraph = category_selection_graph_builder.compile()
