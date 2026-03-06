"""
API Usage Monitoring Routes
Provides endpoints for viewing token usage, costs, and performance metrics
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel

from db.usage_models import APIUsageDocument
from db.mongo_models import EventDocument
from helpers.auth import get_current_admin
from fastapi import Depends

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])


class UsageSummary(BaseModel):
    """Summary of API usage and costs"""
    total_requests: int
    total_tokens: int
    total_cost: float
    avg_latency_ms: float
    success_rate: float
    period_start: datetime
    period_end: datetime


class UsageByOperation(BaseModel):
    """Usage breakdown by operation type"""
    operation: str
    requests: int
    total_tokens: int
    total_cost: float
    avg_latency_ms: float


class UsageByModel(BaseModel):
    """Usage breakdown by model"""
    provider: str
    model: str
    requests: int
    total_tokens: int
    total_cost: float


@router.get("/usage/summary", response_model=UsageSummary)
async def get_usage_summary(
    hours: int = Query(24, description="Look back period in hours"),
    current_admin=Depends(get_current_admin)
):
    """
    Get overall API usage summary for the specified time period.
    Protected endpoint - requires authentication.
    """
    period_start = datetime.utcnow() - timedelta(hours=hours)
    period_end = datetime.utcnow()
    
    # Query all usage records in the time period
    usage_records = await APIUsageDocument.find(
        APIUsageDocument.timestamp >= period_start,
        APIUsageDocument.timestamp <= period_end
    ).to_list()
    
    if not usage_records:
        return UsageSummary(
            total_requests=0,
            total_tokens=0,
            total_cost=0.0,
            avg_latency_ms=0.0,
            success_rate=0.0,
            period_start=period_start,
            period_end=period_end
        )
    
    # Calculate aggregated metrics
    total_requests = len(usage_records)
    total_tokens = sum(r.total_tokens for r in usage_records)
    total_cost = sum(r.total_cost for r in usage_records)
    avg_latency = sum(r.latency_ms for r in usage_records) / total_requests
    success_count = sum(1 for r in usage_records if r.status == "success")
    success_rate = (success_count / total_requests) * 100
    
    return UsageSummary(
        total_requests=total_requests,
        total_tokens=total_tokens,
        total_cost=round(total_cost, 4),
        avg_latency_ms=round(avg_latency, 2),
        success_rate=round(success_rate, 2),
        period_start=period_start,
        period_end=period_end
    )


@router.get("/usage/by-operation", response_model=List[UsageByOperation])
async def get_usage_by_operation(
    hours: int = Query(24, description="Look back period in hours"),
    current_admin=Depends(get_current_admin)
):
    """
    Get API usage breakdown by operation type.
    Protected endpoint - requires authentication.
    """
    period_start = datetime.utcnow() - timedelta(hours=hours)
    
    # Query all usage records
    usage_records = await APIUsageDocument.find(
        APIUsageDocument.timestamp >= period_start
    ).to_list()
    
    # Group by operation
    operations = {}
    for record in usage_records:
        op = record.operation
        if op not in operations:
            operations[op] = {
                "requests": 0,
                "total_tokens": 0,
                "total_cost": 0.0,
                "total_latency": 0.0
            }
        
        operations[op]["requests"] += 1
        operations[op]["total_tokens"] += record.total_tokens
        operations[op]["total_cost"] += record.total_cost
        operations[op]["total_latency"] += record.latency_ms
    
    # Convert to response format
    result = []
    for op, data in operations.items():
        result.append(UsageByOperation(
            operation=op,
            requests=data["requests"],
            total_tokens=data["total_tokens"],
            total_cost=round(data["total_cost"], 4),
            avg_latency_ms=round(data["total_latency"] / data["requests"], 2)
        ))
    
    # Sort by cost (highest first)
    result.sort(key=lambda x: x.total_cost, reverse=True)
    
    return result


@router.get("/usage/by-model", response_model=List[UsageByModel])
async def get_usage_by_model(
    hours: int = Query(24, description="Look back period in hours"),
    current_admin=Depends(get_current_admin)
):
    """
    Get API usage breakdown by model.
    Protected endpoint - requires authentication.
    """
    period_start = datetime.utcnow() - timedelta(hours=hours)
    
    # Query all usage records
    usage_records = await APIUsageDocument.find(
        APIUsageDocument.timestamp >= period_start
    ).to_list()
    
    # Group by provider and model
    models = {}
    for record in usage_records:
        key = f"{record.provider}:{record.model}"
        if key not in models:
            models[key] = {
                "provider": record.provider,
                "model": record.model,
                "requests": 0,
                "total_tokens": 0,
                "total_cost": 0.0
            }
        
        models[key]["requests"] += 1
        models[key]["total_tokens"] += record.total_tokens
        models[key]["total_cost"] += record.total_cost
    
    # Convert to response format
    result = [
        UsageByModel(**data)
        for data in models.values()
    ]
    
    # Sort by cost (highest first)
    result.sort(key=lambda x: x.total_cost, reverse=True)
    
    return result


@router.get("/usage/timeline")
async def get_usage_timeline(
    hours: int = Query(24, description="Look back period in hours"),
    interval_minutes: int = Query(60, description="Time interval for grouping (minutes)"),
    current_admin=Depends(get_current_admin)
):
    """
    Get time-series data for usage metrics.
    Useful for creating charts and trends.
    """
    period_start = datetime.utcnow() - timedelta(hours=hours)
    
    # Query all usage records
    usage_records = await APIUsageDocument.find(
        APIUsageDocument.timestamp >= period_start
    ).to_list()
    
    # Group by time interval
    interval_delta = timedelta(minutes=interval_minutes)
    timeline = {}
    
    for record in usage_records:
        # Round timestamp to nearest interval
        interval_key = record.timestamp - (record.timestamp - datetime.min) % interval_delta
        interval_str = interval_key.isoformat()
        
        if interval_str not in timeline:
            timeline[interval_str] = {
                "timestamp": interval_str,
                "requests": 0,
                "tokens": 0,
                "cost": 0.0,
                "errors": 0
            }
        
        timeline[interval_str]["requests"] += 1
        timeline[interval_str]["tokens"] += record.total_tokens
        timeline[interval_str]["cost"] += record.total_cost
        if record.status != "success":
            timeline[interval_str]["errors"] += 1
    
    # Convert to sorted list
    result = sorted(timeline.values(), key=lambda x: x["timestamp"])
    
    # Round costs
    for item in result:
        item["cost"] = round(item["cost"], 4)
    
    return result


@router.get("/usage/event/{event_id}")
async def get_event_usage(
    event_id: str,
    current_admin=Depends(get_current_admin)
):
    """
    Get API usage for a specific event.
    Shows costs associated with analyzing that event's feedback.
    """
    usage_records = await APIUsageDocument.find(
        APIUsageDocument.event_id == event_id
    ).to_list()
    
    if not usage_records:
        return {
            "event_id": event_id,
            "total_requests": 0,
            "total_tokens": 0,
            "total_cost": 0.0,
            "operations": []
        }
    
    # Calculate totals
    total_requests = len(usage_records)
    total_tokens = sum(r.total_tokens for r in usage_records)
    total_cost = sum(r.total_cost for r in usage_records)
    
    # Group by operation
    operations = {}
    for record in usage_records:
        op = record.operation
        if op not in operations:
            operations[op] = {"requests": 0, "tokens": 0, "cost": 0.0}
        operations[op]["requests"] += 1
        operations[op]["tokens"] += record.total_tokens
        operations[op]["cost"] += record.total_cost
    
    return {
        "event_id": event_id,
        "total_requests": total_requests,
        "total_tokens": total_tokens,
        "total_cost": round(total_cost, 4),
        "operations": [
            {"operation": op, **data}
            for op, data in operations.items()
        ]
    }


@router.get("/usage/by-event")
async def get_usage_by_event(
    hours: int = Query(24, description="Look back period in hours"),
    current_admin=Depends(get_current_admin),
):
    """
    Get API usage grouped by event, with pipeline runs shown chronologically.

    Each event contains a list of *runs*.  A run is a group of consecutive
    API calls (classify_feedback + generate_report) that belong to the same
    pipeline execution.  Runs are detected by clustering records with
    timestamps within a short window of each other.

    Returns a list sorted by most-recent activity first.
    """
    period_start = datetime.utcnow() - timedelta(hours=hours)

    # Fetch all usage records in the window that have an event_id
    usage_records = await APIUsageDocument.find(
        APIUsageDocument.timestamp >= period_start,
        APIUsageDocument.event_id != None,  # noqa: E711
    ).sort("+timestamp").to_list()

    if not usage_records:
        return []

    # Collect unique event IDs and resolve their titles
    event_ids = list({r.event_id for r in usage_records if r.event_id})
    event_titles: dict[str, str] = {}
    for eid in event_ids:
        try:
            evt = await EventDocument.get(eid)
            event_titles[eid] = evt.title if evt else f"Event {eid[:8]}…"
        except Exception:
            event_titles[eid] = f"Event {eid[:8]}…"

    # ---- group records by event_id ----
    by_event: dict[str, list] = {}
    for r in usage_records:
        by_event.setdefault(r.event_id, []).append(r)

    # ---- split each event's records into runs ----
    # A "run" is a batch of API calls whose timestamps are ≤ RUN_GAP apart.
    RUN_GAP = timedelta(minutes=5)

    result = []
    for eid, records in by_event.items():
        runs: list[list] = []
        current_run: list = [records[0]]
        for rec in records[1:]:
            if rec.timestamp - current_run[-1].timestamp <= RUN_GAP:
                current_run.append(rec)
            else:
                runs.append(current_run)
                current_run = [rec]
        runs.append(current_run)

        run_summaries = []
        for idx, run_records in enumerate(runs, start=1):
            operations: dict[str, dict] = {}
            total_tokens = 0
            total_cost = 0.0
            total_cached_tokens = 0
            total_cached_cost = 0.0
            latencies: list[float] = []
            errors = 0

            for r in run_records:
                op = r.operation
                if op not in operations:
                    operations[op] = {
                        "operation": op,
                        "requests": 0,
                        "total_tokens": 0,
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "cached_tokens": 0,
                        "total_cost": 0.0,
                        "cached_cost": 0.0,
                        "avg_latency_ms": 0.0,
                        "_latencies": [],
                    }
                d = operations[op]
                d["requests"] += 1
                d["total_tokens"] += r.total_tokens
                d["prompt_tokens"] += r.prompt_tokens
                d["completion_tokens"] += r.completion_tokens
                d["cached_tokens"] += getattr(r, "cached_tokens", 0)
                d["total_cost"] += r.total_cost
                d["cached_cost"] += getattr(r, "cached_cost", 0.0)
                d["_latencies"].append(r.latency_ms)

                total_tokens += r.total_tokens
                total_cost += r.total_cost
                total_cached_tokens += getattr(r, "cached_tokens", 0)
                total_cached_cost += getattr(r, "cached_cost", 0.0)
                latencies.append(r.latency_ms)
                if r.status != "success":
                    errors += 1

            # Finalize per-operation averages & cleanup
            ops_list = []
            for d in operations.values():
                d["avg_latency_ms"] = round(
                    sum(d.pop("_latencies")) / d["requests"], 2
                )
                d["total_cost"] = round(d["total_cost"], 6)
                d["cached_cost"] = round(d["cached_cost"], 6)
                ops_list.append(d)

            # Sort: classify_feedback first, then generate_report
            ops_list.sort(key=lambda x: x["operation"])

            run_summaries.append({
                "run_number": idx,
                "timestamp": run_records[0].timestamp.isoformat(),
                "total_requests": len(run_records),
                "total_tokens": total_tokens,
                "total_cost": round(total_cost, 6),
                "cached_tokens": total_cached_tokens,
                "cached_cost": round(total_cached_cost, 6),
                "avg_latency_ms": round(sum(latencies) / len(latencies), 2) if latencies else 0,
                "errors": errors,
                "operations": ops_list,
            })

        # Most-recent run timestamp for sorting events
        latest_ts = runs[-1][-1].timestamp

        result.append({
            "event_id": eid,
            "event_title": event_titles.get(eid, f"Event {eid[:8]}…"),
            "total_runs": len(runs),
            "total_requests": sum(r["total_requests"] for r in run_summaries),
            "total_tokens": sum(r["total_tokens"] for r in run_summaries),
            "total_cost": round(sum(r["total_cost"] for r in run_summaries), 6),
            "latest_activity": latest_ts.isoformat(),
            "runs": run_summaries,
        })

    # Sort events by latest activity (most recent first)
    result.sort(key=lambda x: x["latest_activity"], reverse=True)

    return result
