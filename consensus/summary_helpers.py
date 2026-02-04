import json

from difflib import SequenceMatcher

import numpy as np
import pandas as pd

from consensus.types import (
    Actionability,
    Category,
    DeliveryStatus,
    EvidenceType,
    ImpactDirection,
    IsAgreeing,
    PriorityClass,
    Sentiment,
)


CATEGORY_FIELD_OPTIONS: dict[Category, tuple[str, list[str]]] = {
    Category.BINARY_PROPOSAL: ("is_agreeing", [is_agreeing.value for is_agreeing in IsAgreeing]),
    Category.PRIORITIZATION_RANKING: ("priority_class", [priority_class.value for priority_class in PriorityClass]),
    Category.BRAINSTORMING_IDEATION: ("actionability", [actionability.value for actionability in Actionability]),
    Category.FEEDBACK_RETROSPECTIVE: (
        "impact_direction",
        [impact_direction.value for impact_direction in ImpactDirection],
    ),
    Category.FORECASTING_PLANNING: (
        "delivery_status",
        [delivery_status.value for delivery_status in DeliveryStatus],
    ),
}
_EVIDENCE_WEIGHTS = {
    EvidenceType.DATA: 1.4,
    EvidenceType.BENCHMARK: 1.25,
    EvidenceType.CITATION: 1.15,
    EvidenceType.EXPERT_OPINION: 1.05,
    EvidenceType.ANECDOTE: 0.95,
    EvidenceType.ASSUMPTION: 0.85,
}


def _confidence_factor(confidency: float) -> float:
    return min(1.4, max(0.0, 0.6 + 0.8 * confidency))


def _relevancy_factor(relevancy: float) -> float:
    return 0.5 + 0.5 * max(0.0, min(1.0, relevancy))


def _evidence_type_factor(evidence_type: EvidenceType) -> float:
    return _EVIDENCE_WEIGHTS.get(evidence_type, 0.9)


def _is_critical_opinion_factor(is_critical_opinion: bool) -> float:
    return 1.1 if is_critical_opinion else 0.9


def compute_weight_row(row: pd.Series) -> float:
    w = (
        _relevancy_factor(row.get("relevancy", 0.0))
        * _confidence_factor(row.get("confidence", 0.0))
        * _evidence_type_factor(row.get("evidence_type"))
        * _is_critical_opinion_factor(row.get("is_critical_opinion", False))
    )

    return max(0.2, min(2.0, w))


def _tokenize(s: str) -> list[str]:
    return [t for t in s.split() if t]


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0


def _char_ngrams(s: str, n: int = 2) -> set[str]:
    if len(s) < n:
        return {s} if s else set()
    return {s[i : i + n] for i in range(len(s) - n + 1)}


def cluster_similarity(t1: str, t2: str) -> float:
    """
    Combine simple similarities (no external libs):
    - token Jaccard
    - char-bigram Jaccard
    - difflib ratio
    Take max to be forgiving for short phrases.
    """
    if not t1 or not t2:
        return 0.0
    t1 = t1.lower()
    t2 = t2.lower()

    # token Jaccard
    j_tok = _jaccard(set(_tokenize(t1)), set(_tokenize(t2)))

    # char-bigram Jaccard
    j_char = _jaccard(_char_ngrams(t1, 2), _char_ngrams(t2, 2))

    # difflib ratio
    d = SequenceMatcher(None, t1, t2).ratio()

    return max(j_tok, j_char, d)


def pick_cluster_label(theme_series: pd.Series, weight_series: pd.Series) -> str:
    """
    Choose a representative label for a cluster:
    1) Highest total weight per exact theme string
    2) If tie: higher frequency (count)
    3) If tie: longer label (more descriptive)
    """
    agg = (
        pd.DataFrame({"theme": theme_series, "w": weight_series})
        .groupby("theme", as_index=False)
        .agg(weight_sum=("w", "sum"), count=("theme", "count"))
        .sort_values(["weight_sum", "count", "theme"], ascending=[False, False, True])
        .reset_index(drop=True)
    )
    # Break tie by label length if top rows tie completely
    top = agg.iloc[0]
    tied = agg[agg["weight_sum"].eq(top["weight_sum"]) & agg["count"].eq(top["count"])]
    if len(tied) > 1:
        tied = tied.assign(label_len=tied["theme"].map(len)).sort_values(["label_len"], ascending=False)
        return tied.iloc[0]["theme"]
    return top["theme"]


def consensus_score_for_group(g: pd.DataFrame, option_col: str, allowed_options: list[str]) -> dict[str, object]:
    """
    Compute weighted option shares and consensus score for a group of rows (one theme).
    Consensus = round(100 * (p - 1/m) / (1 - 1/m)), m = len(allowed_options)
    where p is the dominant option's weighted share.
    """
    # Weighted counts per option (only among allowed options)
    weights = {opt: 0.0 for opt in allowed_options}
    for opt, w in zip(g[option_col], g["weight_score_algo"], strict=True):
        if opt in weights:
            weights[opt] += float(w)

    total_w = sum(weights.values())
    if total_w <= 0:
        # No signal for this option set
        return {
            "option_weights": weights,
            "option_shares": {k: 0.0 for k in allowed_options},
            "dominant_option": None,
            "consensus": 0,
        }

    shares = {k: (v / total_w) for k, v in weights.items()}
    dominant_option, p = max(shares.items(), key=lambda kv: kv[1])  # (opt, share)
    m = max(1, len(allowed_options))
    # If m == 1, consensus is always 100; else use formula
    consensus = 100 if m == 1 else int(round(100.0 * (p - 1.0 / m) / (1.0 - 1.0 / m)))

    return {
        "option_weights": weights,
        "option_shares": shares,
        "dominant_option": dominant_option,
        "consensus": max(0, min(100, consensus)),
    }


_SENTIMENT_SCORE = {
    Sentiment.POSITIVE: 1.0,
    Sentiment.NEUTRAL: 0.0,
    Sentiment.NEGATIVE: -1.0,
}


def sentiment_score(sentiment: Sentiment) -> float:
    return _SENTIMENT_SCORE.get(sentiment, 0.0)


def weighted_average(series_values: pd.Series, series_weights: pd.Series) -> float | None:
    vals = series_values.to_numpy()
    ws = series_weights.to_numpy()

    mask = np.isfinite(vals) & np.isfinite(ws)
    if not mask.any() or ws[mask].sum() <= 0:
        return None

    return float(np.average(vals[mask], weights=ws[mask]))


def emotion_distribution(g: pd.DataFrame) -> dict[str, float]:
    """
    Weighted distribution of emotion labels in group, normalized to 1.0 (if total > 0).
    """
    total_w = g["weight_score_algo"].sum()
    if total_w <= 0:
        return {}
    dist = (g.groupby("emotion")["weight_score_algo"].sum() / total_w).to_dict()
    # Ensure standard ordering if needed; otherwise just return dict
    return {str(k): float(v) for k, v in dist.items()}


def top_evidence_items(g: pd.DataFrame, top_n: int) -> list[dict[str, object]]:
    """
    Rank items by (ev_factor * w). Returns list of dicts:
    { 'evidence_type': ..., 'score': float, 'text': ..., 'w': float }
    """
    # Prepare scores
    scores = []
    for ev, w, txt in zip(g["evidence_type"], g["weight_score_algo"], g["text"], strict=True):
        evf = _evidence_type_factor(ev)
        s = evf * float(w)
        scores.append((s, ev, float(w), txt))
    scores.sort(key=lambda x: x[0], reverse=True)
    out = []
    for s, ev, w, txt in scores[: max(0, int(top_n))]:
        out.append({"evidence_type": ev, "score": float(s), "w": float(w), "text": txt})
    return out


def representative_quotes(g: pd.DataFrame, quotes_n: int) -> list[str]:
    """
    Top N 'text' entries by weight.
    Assumes 'text' is already safe/cleaned in your data.
    """
    tmp = g[["text", "weight_score_algo"]].copy()
    tmp = tmp.sort_values("weight_score_algo", ascending=False)
    return tmp["text"].head(max(0, int(quotes_n))).tolist()


def consensus_for_group(
    g: pd.DataFrame, option_col: str, allowed_options: list[str]
) -> tuple[int, str | None, dict[str, float]]:
    # Weighted counts per option
    weights = {opt: 0.0 for opt in allowed_options}
    for opt, w in zip(g[option_col], g["weight_score_algo"], strict=True):
        if opt in weights:
            weights[opt] += float(w)

    total_w = sum(weights.values())
    shares = {k: (v / total_w) if total_w > 0 else 0.0 for k, v in weights.items()}
    if total_w > 0:
        dominant_option, p = max(shares.items(), key=lambda kv: kv[1])
    else:
        dominant_option, p = (None, 0.0)

    m = max(1, len(allowed_options))
    consensus = 100 if m == 1 else int(round(100.0 * (p - 1.0 / m) / (1.0 - 1.0 / m)))
    consensus = max(0, min(100, consensus))
    return consensus, dominant_option, shares


def mismatch_weight_share(g: pd.DataFrame) -> float:
    """
    Stance-sentiment mismatch definition:
      - is_against == 'true'   AND sentiment == 'positive'
      - is_against == 'false'  AND sentiment == 'negative'
    'mixed' is ignored for mismatch.
    Returns weighted share in [0,1].
    """
    if "is_against" not in g.columns or "sentiment" not in g.columns:
        return 0.0
    total_w = float(g["weight_score_algo"].sum())
    if total_w <= 0:
        return 0.0

    def _is_mismatch(row: pd.Series) -> bool:
        stance = row.get("is_against", False)
        sent = row.get("sentiment", Sentiment.NEUTRAL)
        return (stance and sent == Sentiment.POSITIVE) or (not stance and sent == Sentiment.NEGATIVE)

    mismatch_w = g.loc[g.apply(_is_mismatch, axis=1), "weight_score_algo"].sum()
    return float(mismatch_w) / total_w


def bimodal_flag(option_shares: dict[str, float]) -> bool:
    """True if two options each hold ≥ 0.30 share."""
    if not option_shares:
        return False
    shares = sorted(option_shares.values(), reverse=True)
    if len(shares) < 2:
        return False
    return (shares[0] >= 0.30) and (shares[1] >= 0.30)


def dominant_share(row: pd.Series) -> float:
    opt = row.get("dominant_option")
    shares = row.get("option_shares") or {}
    return float(shares.get(opt, 0.0))


def _fmt_pct(x: float) -> str:
    try:
        return f"{100.0 * float(x):.0f}%"
    except Exception:
        return "—"


def bullet_agree_text(row: pd.Series) -> str:
    opt = row["dominant_option"]
    share = _fmt_pct(dominant_share(row))
    pol = row["polarity"]
    conf = row["avg_confidence"]
    return f"**{row['theme_label']}** — leaning **{opt}** ({share}); polarity {pol:+.2f}, confidence {conf:.2f}"


def bullet_disagree_text(row: pd.Series, dissent_row: pd.Series | None) -> str:
    share = _fmt_pct(dominant_share(row))
    parts = [f"**{row['theme_label']}** — split (lead={row['dominant_option']} {share})"]
    if dissent_row is not None:
        rsns = "; ".join(dissent_row.get("dissent_reasons", [])[:3])
        if rsns:
            parts.append(f"reasons: {rsns}")
    return " — ".join(parts)


def bullet_next_text(row: pd.Series) -> str:
    opt = row["dominant_option"]
    share = _fmt_pct(dominant_share(row))
    conf = row["avg_confidence"]
    # Heuristics: surface low-confidence, low-evidence hotspots
    # If top_evidence mostly weak (Assumption/Anecdote) → ask for data
    top_evs = row.get("top_evidence", []) or []
    weak = sum(1 for e in top_evs[:3] if e["evidence_type"] in (EvidenceType.ASSUMPTION, EvidenceType.ANECDOTE))
    if weak >= 2 or (conf is not None and conf < 0.5):
        return (
            f"**{row['theme_label']}** — clarify before deciding "
            f"(lead={opt} {share}; confidence {conf:.2f}; needs stronger evidence)"
        )
    return f"**{row['theme_label']}** — finalize decision (lead={opt} {share})"


def df_to_native_records(df: pd.DataFrame) -> dict:
    """
    Convert a pandas DataFrame to a JSON-native list[dict] with plain Python types.
    Using df.to_json(...)->json.loads(...) avoids numpy types sneaking in.
    """
    return json.loads(df.to_json(orient="records"))
