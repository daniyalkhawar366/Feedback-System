import json

from typing import cast

import numpy as np
import pandas as pd

from langchain_core.language_models import BaseChatModel, LanguageModelInput
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable, RunnableConfig
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph
from pydantic import BaseModel

from consensus.summary_helpers import (
    CATEGORY_FIELD_OPTIONS,
    bimodal_flag,
    bullet_agree_text,
    bullet_disagree_text,
    bullet_next_text,
    cluster_similarity,
    compute_weight_row,
    consensus_for_group,
    consensus_score_for_group,
    df_to_native_records,
    dominant_share,
    emotion_distribution,
    mismatch_weight_share,
    pick_cluster_label,
    representative_quotes,
    sentiment_score,
    top_evidence_items,
    weighted_average,
)
from consensus.types import (
    Discussion,
    Actionability,
    Category,
    DeliveryStatus,
    Dimensions,
    ImpactDirection,
    IsAgreeing,
    PriorityClass,
    Sentiment,
    Summary,
)


SUMMARY_SYSTEM_PROMPT = """You are creating a user-friendly feedback report for event organizers. Write in clear, simple language that anyone can understand.

== YOUR GOAL ==
Help the event organizer understand what worked well and what needs improvement, based on attendee feedback.

== DATA PROVIDED ==
You will receive JSON data with:
- summary.agreed_topics: What most attendees agreed on
- evidence.top10_weighted_texts: Most important feedback quotes
- summary.disagreed_topics: Where attendees had different opinions
- evidence.against_top7: Critical or negative feedback
- evidence.highlights_top3: Top-rated feedback comments

== YOUR TASK ==
Write THREE sections:

1) **Main Summary** (3-4 sentences)
   - Start with the overall sentiment (mostly positive/negative/mixed)
   - Mention the key themes that stood out
   - Keep it simple and actionable
   - Example: "Attendees loved the speaker's energy and content. Many praised the interactive format. However, some found the venue too small and requested better audio equipment."

2) **Conflicting Views** (1-2 sentences, if any exist)
   - Only mention significant disagreements
   - Be specific about what the split was about
   - If no major conflicts, say "Feedback was generally consistent"

3) **Top Weighted Points** (exact quotes)
   - Copy the "text" field from evidence.highlights_top3
   - Do NOT modify or paraphrase these quotes
   - These are the most impactful feedback comments

== WRITING STYLE ==
- Use simple, everyday language
- Focus on what the organizer can LEARN and ACT on
- Avoid technical jargon (no "polarity", "confidence scores", "sentiment analysis")
- Be specific about themes (e.g., "audio quality" not "technical aspects")
- Keep it positive but honest

== IF DATA IS MISSING ==
- No agreed topics → "Insufficient feedback data to generate summary"
- No disagreements → "Feedback was generally consistent"
- No highlights → Return empty array []

== OUTPUT FORMAT ==
Return valid JSON with exactly these keys:
{{
    "main_summary": "<3-4 clear sentences about what happened>",
    "conficting_statement": "<1-2 sentences about disagreements, or 'Feedback was generally consistent'>",
    "top_weighted_points": ["<exact quote 1>", "<exact quote 2>", "<exact quote 3>"]
}}

Remember: You're helping a busy event organizer quickly understand their feedback. Be clear, concise, and actionable."""

SUMMARY_PROMPT_TEMPLATE = ChatPromptTemplate.from_messages(
    [
        ("system", SUMMARY_SYSTEM_PROMPT),
        ("user", "Data: {payload}"),
    ]
)


class SummaryGraphState(BaseModel):
    discussion: Discussion
    category: Category
    dimensions: list[Dimensions]
    df: pd.DataFrame | None = None
    cluster_summary: pd.DataFrame | None = None
    panels_df: pd.DataFrame | None = None
    dissent_df: pd.DataFrame | None = None
    what_we_agree_on: list[str] | None = None
    where_we_disagree: list[str] | None = None
    what_to_decide_next: list[str] | None = None
    theme_board: pd.DataFrame | None = None
    evidence_board: pd.DataFrame | None = None
    sentiment_table: pd.DataFrame | None = None
    emotion_table: pd.DataFrame | None = None
    payload: dict | None = None
    summary: Summary | None = None

    class Config:
        arbitrary_types_allowed = True


def prepare_dataframe(state: SummaryGraphState) -> pd.DataFrame:
    df = pd.DataFrame(
        {"id": message_id, **dimensions}
        for message_id, dimensions in zip(
            (message.id for message in state.discussion.messages),
            (dimensions_.model_dump() for dimensions_ in state.dimensions),
            strict=True,
        )
    )

    return {"df": df}


def step_a_filter(state: SummaryGraphState, min_relevancy: float = 0.6) -> dict:
    """
    Keep only rows that are safe and on-topic enough.
    - Drop rows where risk_flag == True
    - Keep rows with relevancy >= min_relevancy
    Expects columns: ['risk_flag', 'relevancy']
    """
    df = cast(pd.DataFrame, state.df).copy()

    required = {"risk_flag", "relevancy"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns for Step A: {missing}")

    df = df.loc[(~df["risk_flag"]) & (df["relevancy"] >= float(min_relevancy))].reset_index(drop=True)

    return {"df": df}


def step_b_add_weights(state: SummaryGraphState) -> pd.DataFrame:
    """
    Adds a weight column to the dataframe.
    Requires: ['relevancy', 'confidence', 'evidence_type', 'is_critical_opinion']
    """
    df = cast(pd.DataFrame, state.df).copy()

    required = {"relevancy", "confidence", "evidence_type", "is_critical_opinion"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns for Step B: {missing}")

    df["weight_score_algo"] = df.apply(compute_weight_row, axis=1)
    return {"df": df}


def step_c_cluster_themes_simple(
    state: SummaryGraphState,
    sim_threshold: float = 0.35,
    top_k: int | None = None,
) -> dict:
    """
    Cluster semantically similar themes using simple string stats (no embeddings).
    - sim_threshold: themes with similarity >= threshold are merged
    - top_k: optionally keep only top_k clusters by total weight

    Returns:
      clustered_df: df with columns:
        - 'theme_cluster_id' (int)
        - 'theme_cluster_label' (string)
      cluster_summary: one row per cluster with:
        - 'theme_cluster_id', 'theme_cluster_label', 'weight_sum', 'count'
    """
    df = cast(pd.DataFrame, state.df).copy()

    if "theme" not in df.columns:
        raise ValueError("Missing required column 'theme'.")

    # Unique themes with order stable by total weight (helps greedy clustering)
    theme_weights = df.groupby("theme", as_index=False)["weight_score_algo"].sum()
    theme_weights = theme_weights.sort_values("weight_score_algo", ascending=False).reset_index(drop=True)
    unique_themes = theme_weights["theme"].tolist()

    clusters: list[dict] = []  # list of dicts: {'id':int, 'members':[str], 'label':str}
    theme_to_cluster = {}

    next_id = 0
    for theme in unique_themes:
        # Try to attach to the best existing cluster
        best_sim, best_idx = 0.0, None
        for i, c in enumerate(clusters):
            # Compare to cluster's representative label
            sim = cluster_similarity(theme, c["label"])
            if sim > best_sim:
                best_sim, best_idx = sim, i

        if best_idx is not None and best_sim >= sim_threshold:
            clusters[best_idx]["members"].append(theme)
            theme_to_cluster[theme] = clusters[best_idx]["id"]
        else:
            clusters.append({"id": next_id, "members": [theme], "label": theme})
            theme_to_cluster[theme] = next_id
            next_id += 1

    # Derive final label per cluster using weighted choice
    # Build mapping theme -> cluster_id for all rows
    df["theme_cluster_id"] = df["theme"].map(lambda t: theme_to_cluster.get(t, -1))

    # Compute labels with weighted winner inside each cluster
    cluster_labels = {}
    for cid, group in df.groupby("theme_cluster_id"):
        label = pick_cluster_label(group["theme"], group["weight_score_algo"])
        cluster_labels[cid] = label

    df["theme_cluster_label"] = df["theme_cluster_id"].map(cluster_labels)

    # Cluster summary
    cluster_summary = (
        df.groupby(["theme_cluster_id", "theme_cluster_label"], as_index=False)
        .agg(weight_sum=("weight_score_algo", "sum"), count=("theme", "count"))
        .sort_values(["weight_sum", "count"], ascending=[False, False])
        .reset_index(drop=True)
    )

    # Optionally keep only top_k clusters
    if top_k is not None and top_k > 0:
        keep_ids = set(cluster_summary.head(top_k)["theme_cluster_id"].tolist())
        df = df.loc[df["theme_cluster_id"].isin(keep_ids)].reset_index(drop=True)
        cluster_summary = cluster_summary.head(top_k).reset_index(drop=True)

    return {
        "df": df,
        "cluster_summary": cluster_summary,
    }


def build_signal_panels(
    state: SummaryGraphState,
    top_evidence_n: int = 5,
    quotes_n: int = 3,
) -> pd.DataFrame:
    """
    Builds a per-theme signal panel table for the given category.

    Expected columns in df:
      - theme or theme_cluster_label (use theme_col param)
      - sentiment (values: positive|neutral|negative)
      - emotion (one of allowed)
      - evidence_type (Data|Benchmark|Citation|ExpertOpinion|Anecdote|Assumption)
      - confidence (float in [0,1])
      - text (string; already cleaned)
      - weight_col (from Step B)
      - category-specific field (e.g., Agree, PriorityClass, ...)

    Returns a DataFrame with one row per theme containing:
      - theme_label
      - consensus (0-100)
      - dominant_option
      - option_shares (dict)
      - polarity (float in [-1,1])
      - avg_confidence (float in [0,1] or None)
      - emotion_dist (dict of emotion -> share)
      - top_evidence (list of dicts as defined above)
      - quotes (list of strings)
      - total_weight (sum of w in theme)
      - count (rows in theme)
    """

    category = state.category
    df = cast(pd.DataFrame, state.df).copy()

    option_col, allowed_options = CATEGORY_FIELD_OPTIONS[category]
    needed_cols = {
        sentiment_col := "sentiment",
        "emotion",
        "evidence_type",
        "confidence",
        "text",
        "weight_score_algo",
        option_col,
    }
    theme_col = "theme_cluster_label"
    if theme_col not in df.columns:
        # fallback to 'theme'
        if "theme" in df.columns:
            theme_col = "theme"
        else:
            raise ValueError(f"Missing theme column '{theme_col}', and no 'theme' column present.")

    missing = needed_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns for Step D: {missing}")

    # Make a working copy
    x = df.copy()

    # sentiment mapping → numeric for polarity
    x["_sent_score"] = x[sentiment_col].map(sentiment_score).astype(float)

    # Group by theme
    panels = []
    for theme_label, g in x.groupby(theme_col):
        # Consensus calc
        consensus_info = consensus_score_for_group(g, option_col, allowed_options)

        # Polarity (weighted avg of sentiment scores)
        pol = weighted_average(g["_sent_score"], g["weight_score_algo"])
        pol = float(pol) if pol is not None else 0.0

        # Confidence band (weighted average)
        avg_conf = weighted_average(g["confidence"], g["weight_score_algo"])

        # Emotion distribution (weighted)
        emo_dist = emotion_distribution(g)

        # Top evidence
        evidence = top_evidence_items(g, top_evidence_n)

        # Representative quotes
        quotes = representative_quotes(g, quotes_n)

        # Bookkeeping
        total_w = float(g["weight_score_algo"].sum())
        cnt = int(len(g))

        panels.append(
            {
                "theme_label": theme_label,
                "consensus": consensus_info["consensus"],
                "dominant_option": consensus_info["dominant_option"],
                "option_shares": consensus_info["option_shares"],
                "polarity": pol,  # [-1..1]
                "avg_confidence": (float(avg_conf) if avg_conf is not None else None),
                "emotion_dist": emo_dist,  # dict emotion->share
                "top_evidence": evidence,  # list of dicts
                "quotes": quotes,  # list of strings
                "total_weight": total_w,
                "count": cnt,
            }
        )

    # Sort: by total_weight desc, then consensus desc
    panels_df = (
        pd.DataFrame(panels)
        .sort_values(by=["total_weight", "consensus"], ascending=[False, False])
        .reset_index(drop=True)
    )

    return {"panels_df": panels_df}


def detect_dissent(
    state: SummaryGraphState,
    consensus_threshold: int = 20,
    mismatch_threshold: float = 0.10,
) -> pd.DataFrame:
    """
    Returns one row per theme with dissent signals and reasons.

    Requires columns:
      - theme_col (or 'theme' fallback)
      - sentiment, is_against
      - weight_col
      - category-specific option column (e.g., Agree / PriorityClass / ...)
    """
    category = state.category
    df = cast(pd.DataFrame, state.df).copy()

    option_col, allowed_options = CATEGORY_FIELD_OPTIONS[category]

    theme_col: str = "theme_cluster_label"
    if theme_col not in df.columns:
        if "theme" in df.columns:
            theme_col = "theme"
        else:
            raise ValueError(f"Missing theme column '{theme_col}', and no 'theme' fallback present.")

    needed = {theme_col, "sentiment", "is_against", "weight_score_algo", option_col}
    missing = needed - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns for dissent detection: {missing}")

    rows = []
    for theme, g in df.groupby(theme_col):
        # Consensus
        consensus, dominant_option, shares = consensus_for_group(g, option_col, allowed_options)
        low_consensus = consensus < int(consensus_threshold)

        # Mismatch share
        mm_share = mismatch_weight_share(g)
        mismatch_flag = mm_share >= float(mismatch_threshold)

        # Bimodal
        bi_flag = bimodal_flag(shares)

        # Final dissent
        dissent = bool(low_consensus or mismatch_flag or bi_flag)

        # Reasons (for explainability)
        reasons = []
        if low_consensus:
            reasons.append(f"Low consensus ({consensus} < {consensus_threshold})")
        if mismatch_flag:
            reasons.append(f"Stance–sentiment mismatch weight {mm_share:.2f} ≥ {mismatch_threshold:.2f}")
        if bi_flag:
            # include top two options for clarity
            top_two = sorted(shares.items(), key=lambda kv: kv[1], reverse=True)[:2]
            reasons.append(f"Bimodal stance ({top_two[0][0]} {top_two[0][1]:.2f}, {top_two[1][0]} {top_two[1][1]:.2f})")

        rows.append(
            {
                "theme_label": theme,
                "consensus": consensus,
                "dominant_option": dominant_option,
                "option_shares": shares,
                "mismatch_share": round(mm_share, 4),
                "low_consensus_flag": low_consensus,
                "mismatch_flag": mismatch_flag,
                "bimodal_flag": bi_flag,
                "dissent": dissent,
                "dissent_reasons": reasons,
            }
        )

    df = pd.DataFrame(rows).sort_values(["dissent", "consensus"], ascending=[False, True]).reset_index(drop=True)

    return {"dissent_df": df}


def build_executive_consensus_card(
    state: SummaryGraphState,
    max_agree: int = 5,
    max_disagree: int = 3,
    max_next: int = 3,
    min_consensus_agree: int = 70,
) -> dict:
    """
    Produces bullets for:
      - what_we_agree_on (3-5)
      - where_we_disagree (2-3)
      - what_to_decide_next (2-3)

    Strategy:
      - Agree: high-consensus themes with favorable dominant option, sorted by (consensus desc, total_weight desc).
      - Disagree: themes flagged by dissent detector, sorted by (dissent=True first, consensus asc).
      - Next: lower-consensus (55-min_consensus_agree) or low-confidence themes, sorted by (confidence asc).
    """
    panels_df = cast(pd.DataFrame, state.panels_df).copy()
    dissent_df = cast(pd.DataFrame, state.dissent_df).copy()

    category = state.category

    CATEGORY_FAVORABLE: dict[
        Category, list[IsAgreeing | PriorityClass | Actionability | ImpactDirection | DeliveryStatus]
    ] = {
        Category.BINARY_PROPOSAL: [IsAgreeing.YES],
        Category.PRIORITIZATION_RANKING: [
            PriorityClass.MUST,
            PriorityClass.SHOULD,
        ],  # "agreement" → prioritization leaning high
        Category.BRAINSTORMING_IDEATION: [Actionability.QUICK_WIN, Actionability.BIG_BET],  # valuable directions
        Category.FEEDBACK_RETROSPECTIVE: [ImpactDirection.HELPED],  # positive contributors
        Category.FORECASTING_PLANNING: [DeliveryStatus.AHEAD, DeliveryStatus.ON_TRACK],  # healthy delivery
    }

    fav = set(CATEGORY_FAVORABLE.get(category, []))

    # Join panels + dissent on theme_label
    dd = dissent_df.set_index("theme_label") if "theme_label" in dissent_df.columns else None
    panels = panels_df.copy()
    panels["_dom_share"] = panels.apply(dominant_share, axis=1)

    # Agree candidates
    agree_candidates = panels[
        (panels["consensus"] >= min_consensus_agree) & (panels["dominant_option"].isin(fav))
    ].sort_values(["consensus", "total_weight"], ascending=[False, False])

    what_we_agree_on = [bullet_agree_text(row) for _, row in agree_candidates.head(max_agree).iterrows()]

    # Disagree candidates (use dissent flags)
    where_we_disagree: list[str] = []

    if dd is not None:
        tmp = panels.copy()
        tmp["dissent"] = tmp["theme_label"].map(dd["dissent"])
        tmp["dissent"] = tmp["dissent"].fillna(False)
        # sort dissent themes first, then low consensus
        disagree_candidates = tmp[tmp["dissent"]].sort_values(["consensus", "total_weight"], ascending=[True, False])

        for _, row in disagree_candidates.head(max_disagree).iterrows():
            dissent_row = dd.loc[row["theme_label"]] if row["theme_label"] in dd.index else None
            where_we_disagree.append(bullet_disagree_text(row, dissent_row))

    # Next decisions: medium consensus or low confidence
    next_candidates = panels[
        ((panels["consensus"] >= 55) & (panels["consensus"] < min_consensus_agree))
        | (panels["avg_confidence"].fillna(0) < 0.5)
    ].sort_values(["avg_confidence", "consensus"], ascending=[True, True])

    what_to_decide_next = [bullet_next_text(row) for _, row in next_candidates.head(max_next).iterrows()]

    return {
        "what_we_agree_on": what_we_agree_on,
        "where_we_disagree": where_we_disagree,
        "what_to_decide_next": what_to_decide_next,
    }


def build_theme_leaderboard(state: SummaryGraphState, top_k: int | None = 10) -> pd.DataFrame:
    """
    Returns a compact leaderboard of themes sorted by (total_weight desc, consensus desc).
    Columns: theme_label, consensus, dominant_option, dom_share, avg_confidence, total_weight, count
    """
    panels_df = cast(pd.DataFrame, state.panels_df).copy()

    panels_df["dom_share"] = panels_df.apply(dominant_share, axis=1)
    theme_board = (
        panels_df[
            ["theme_label", "consensus", "dominant_option", "dom_share", "avg_confidence", "total_weight", "count"]
        ]
        .sort_values(["total_weight", "consensus"], ascending=[False, False])
        .reset_index(drop=True)
    )
    if top_k is not None and top_k > 0:
        theme_board = theme_board.head(top_k)

    return {"theme_board": theme_board}


def build_evidence_board(
    state: SummaryGraphState,
    top_n: int = 15,
) -> dict:
    """
    Flattens top_evidence entries across themes and ranks by 'score' (ev_factor * w).
    Returns columns: theme_label, evidence_type, score, w, text
    """
    panels_df = cast(pd.DataFrame, state.panels_df).copy()

    rows = []
    for _, r in panels_df.iterrows():
        evs = r.get("top_evidence", []) or []
        for ev in evs:
            rows.append(
                {
                    "theme_label": r["theme_label"],
                    "evidence_type": ev.get("evidence_type"),
                    "score": float(ev.get("score", 0.0)),
                    "w": float(ev.get("w", 0.0)),
                    "text": ev.get("text", ""),
                }
            )

    if not rows:
        return pd.DataFrame(columns=["theme_label", "evidence_type", "score", "w", "text"])

    ebd = pd.DataFrame(rows).sort_values(["score", "w"], ascending=[False, False]).reset_index(drop=True)

    return {
        "evidence_board": ebd.head(max(0, int(top_n))),
    }


def build_sentiment_emotion_heatmap(
    state: SummaryGraphState,
    normalize: bool = True,
) -> dict:
    """
    Creates:
      - sentiment_table: theme x sentiment in weighted share (if available) or proxies using polarity
      - emotion_table:   theme x emotion share based on 'emotion_dist'
    Notes:
      - Our earlier steps stored only an aggregate polarity ([-1,1]) and emotion_dist per theme.
      - We produce a simple sentiment proxy table using polarity bands (neg/neu/pos).
    """

    panels_df = cast(pd.DataFrame, state.panels_df).copy()

    # Sentiment proxy from polarity
    def band(p: float) -> Sentiment:
        if p <= -0.25:
            return Sentiment.NEGATIVE
        if p >= 0.25:
            return Sentiment.POSITIVE
        return Sentiment.NEUTRAL

    sent_rows = []
    emo_rows = []
    for _, r in panels_df.iterrows():
        theme = r["theme_label"]
        pol = float(r.get("polarity", 0.0))
        b = band(pol)
        # sentiment "one-hot" proxy
        sent_rows.append({"theme_label": theme, b: 1.0})

        # emotion distribution already normalized by weight in earlier step
        emo_dist = r.get("emotion_dist", {}) or {}
        if emo_dist:
            d = {"theme_label": theme}
            d.update(emo_dist)
            emo_rows.append(d)
        else:
            emo_rows.append({"theme_label": theme})

    # Build sentiment proxy table
    sent_df = pd.DataFrame(sent_rows).fillna(0.0)
    if not sent_df.empty:
        sentiment_table = sent_df.groupby("theme_label", as_index=False).sum()
        # normalize across sentiments per theme to sum to 1
        sentiment_cols = [c for c in [sentiment.value for sentiment in Sentiment] if c in sentiment_table.columns]
        if normalize and sentiment_cols:
            sentiment_table[sentiment_cols] = (
                sentiment_table[sentiment_cols]
                .div(sentiment_table[sentiment_cols].sum(axis=1).replace(0, np.nan), axis=0)
                .fillna(0.0)
            )
    else:
        sentiment_table = pd.DataFrame(
            columns=[
                "theme_label",
                Sentiment.NEGATIVE.value,
                Sentiment.NEUTRAL.value,
                Sentiment.POSITIVE.value,
            ]
        )

    sentiment_table = sentiment_table.rename(columns=str.lower)

    # Build emotion table
    emo_df = pd.DataFrame(emo_rows).fillna(0.0)
    if not emo_df.empty:
        # Ensure a fixed set of emotions (columns may vary)
        all_emotions = sorted(set(emo_df.columns) - {"theme_label"})
        emotion_table = emo_df.groupby("theme_label", as_index=False)[all_emotions].mean()
        if normalize and all_emotions:
            emotion_table[all_emotions] = (
                emotion_table[all_emotions]
                .div(emotion_table[all_emotions].sum(axis=1).replace(0, np.nan), axis=0)
                .fillna(0.0)
            )
    else:
        emotion_table = pd.DataFrame(columns=["theme_label"])

    return {
        "sentiment_table": sentiment_table,
        "emotion_table": emotion_table,
    }


def build_llm_payload(state: SummaryGraphState) -> dict:
    """
    Combines:
      - what_we_agree_on -> list of agreed topics (with metrics)
      - evidence_board.head(10) -> top 10 most important weighted texts (with metrics)
      - where_we_disagree -> list of disagreed topics (with metrics)
      - out3 filtered (is_against == 'true'), top 7 by weight_score_algo,
        only ['weight_score_algo','text','is_against','sentiment']
      - evidence_board.head(3) -> highlight top 3 weighted statements

    Returns: (payload_dict, payload_json_str)
    """

    agreed = cast(list[str], state.what_we_agree_on)
    disagreed = cast(list[str], state.where_we_disagree)

    evidence_board = cast(pd.DataFrame, state.evidence_board)
    df = cast(pd.DataFrame, state.df)

    # 2) ev_board selections
    ev_top10 = evidence_board.head(10)
    ev_top3 = evidence_board.head(3)

    # 3) out3 filter & select
    mask = df["is_against"].astype(str).str.lower().eq("true")
    cols = ["weight_score_algo", "text", "is_against", "sentiment"]
    # nlargest guards against unsorted data and is fast
    against_top7 = df.loc[mask, cols].nlargest(7, "weight_score_algo", keep="all")

    payload = {
        "summary": {
            "agreed_topics": agreed,
            "disagreed_topics": disagreed,
        },
        "evidence": {
            "top10_weighted_texts": df_to_native_records(ev_top10),
            "against_top7": df_to_native_records(against_top7),
            "highlights_top3": df_to_native_records(ev_top3),
        },
    }

    return {"payload": payload}


def generate_summary(
    state: SummaryGraphState,
    config: RunnableConfig,
) -> dict:
    llm = cast(BaseChatModel, config["configurable"]["llm"])
    structured_llm = cast(
        Runnable[
            LanguageModelInput,
            Summary,
        ],
        llm.with_structured_output(Summary),
    )

    chain = SUMMARY_PROMPT_TEMPLATE | structured_llm

    summary = chain.invoke({"payload": json.dumps(state.payload, ensure_ascii=False, indent=2)})

    return {"summary": summary}


summary_graph_builder = StateGraph(SummaryGraphState)
summary_graph_builder.add_node(prepare_dataframe)
summary_graph_builder.add_node(step_a_filter)
summary_graph_builder.add_node(step_b_add_weights)
summary_graph_builder.add_node(step_c_cluster_themes_simple)
summary_graph_builder.add_node(build_signal_panels)
summary_graph_builder.add_node(detect_dissent)
summary_graph_builder.add_node(build_executive_consensus_card)
summary_graph_builder.add_node(build_theme_leaderboard)
summary_graph_builder.add_node(build_evidence_board)
summary_graph_builder.add_node(build_sentiment_emotion_heatmap)
summary_graph_builder.add_node(build_llm_payload)
summary_graph_builder.add_node(generate_summary)

summary_graph_builder.add_edge(START, "prepare_dataframe")
summary_graph_builder.add_edge("prepare_dataframe", "step_a_filter")
summary_graph_builder.add_edge("step_a_filter", "step_b_add_weights")
summary_graph_builder.add_edge("step_b_add_weights", "step_c_cluster_themes_simple")
summary_graph_builder.add_edge("step_c_cluster_themes_simple", "build_signal_panels")
summary_graph_builder.add_edge("step_c_cluster_themes_simple", "detect_dissent")
summary_graph_builder.add_edge(["build_signal_panels", "detect_dissent"], "build_executive_consensus_card")
summary_graph_builder.add_edge("build_signal_panels", "build_theme_leaderboard")
summary_graph_builder.add_edge("build_signal_panels", "build_evidence_board")
summary_graph_builder.add_edge("build_signal_panels", "build_sentiment_emotion_heatmap")
summary_graph_builder.add_edge(
    ["step_c_cluster_themes_simple", "build_executive_consensus_card", "build_evidence_board"], "build_llm_payload"
)
summary_graph_builder.add_edge("build_llm_payload", "generate_summary")
summary_graph_builder.add_edge(["build_theme_leaderboard", "build_sentiment_emotion_heatmap", "generate_summary"], END)

summary_graph: CompiledStateGraph = summary_graph_builder.compile()
