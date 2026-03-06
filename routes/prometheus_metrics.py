"""
Prometheus Metrics Exporter for LLM API Usage

Exposes metrics endpoint for Prometheus to scrape.
Install: pip install prometheus-client
"""
from fastapi import APIRouter
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import Response
from datetime import datetime, timedelta
from db.usage_models import APIUsageDocument
import asyncio

router = APIRouter()

# Define Prometheus metrics
api_requests_total = Counter(
    'llm_api_requests_total',
    'Total number of LLM API requests',
    ['provider', 'model', 'operation', 'status']
)

api_tokens_total = Counter(
    'llm_api_tokens_total',
    'Total number of tokens used',
    ['provider', 'model', 'operation', 'token_type']
)

api_cost_total = Counter(
    'llm_api_cost_usd_total',
    'Total cost of API calls in USD',
    ['provider', 'model', 'operation']
)

api_latency_seconds = Histogram(
    'llm_api_latency_seconds',
    'API request latency in seconds',
    ['provider', 'model', 'operation'],
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0)
)

api_requests_last_hour = Gauge(
    'llm_api_requests_last_hour',
    'Number of requests in the last hour'
)

api_cost_last_hour = Gauge(
    'llm_api_cost_last_hour_usd',
    'Total cost in the last hour in USD'
)

# Background task to update metrics from MongoDB
async def update_metrics_from_db():
    """
    Periodically fetch recent usage data and update Prometheus metrics
    """
    while True:
        try:
            # Get usage from last hour
            one_hour_ago = datetime.utcnow() - timedelta(hours=1)
            recent_usage = await APIUsageDocument.find(
                APIUsageDocument.timestamp >= one_hour_ago
            ).to_list()
            
            # Update gauges
            api_requests_last_hour.set(len(recent_usage))
            total_cost_hour = sum(u.total_cost for u in recent_usage)
            api_cost_last_hour.set(total_cost_hour)
            
            # Note: Counters should be incremented in real-time
            # This is just for historical data sync
            
        except Exception as e:
            print(f"Error updating metrics: {e}")
        
        # Update every 60 seconds
        await asyncio.sleep(60)


@router.get("/metrics")
async def metrics():
    """
    Prometheus metrics endpoint
    """
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


def track_request_metrics(
    provider: str,
    model: str,
    operation: str,
    prompt_tokens: int,
    completion_tokens: int,
    total_cost: float,
    latency_ms: float,
    status: str
):
    """
    Update Prometheus metrics for a request
    Call this from the LLM client after each API call
    """
    # Increment counters
    api_requests_total.labels(
        provider=provider,
        model=model,
        operation=operation,
        status=status
    ).inc()
    
    api_tokens_total.labels(
        provider=provider,
        model=model,
        operation=operation,
        token_type='prompt'
    ).inc(prompt_tokens)
    
    api_tokens_total.labels(
        provider=provider,
        model=model,
        operation=operation,
        token_type='completion'
    ).inc(completion_tokens)
    
    api_cost_total.labels(
        provider=provider,
        model=model,
        operation=operation
    ).inc(total_cost)
    
    # Record latency (convert ms to seconds)
    api_latency_seconds.labels(
        provider=provider,
        model=model,
        operation=operation
    ).observe(latency_ms / 1000.0)
