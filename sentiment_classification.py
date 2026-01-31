import time
from transformers import pipeline
import re

sentiment_classifier = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment"
)

LABEL_MAP = {
    "LABEL_0": "Negative",
    "LABEL_1": "Neutral",
    "LABEL_2": "Positive"
}

MAX_TOKENS = 512
AVG_TOKENS_PER_WORD = 1.3

def estimate_tokens(text):
    return int(len(text.split()) * AVG_TOKENS_PER_WORD)


def split_feedback(text, max_tokens=512):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        test_text = current_chunk + " " + sentence if current_chunk else sentence
        
        if estimate_tokens(test_text) <= max_tokens:
            current_chunk = test_text
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks


def aggregate_sentiments(chunk_results):
    if not chunk_results:
        return "Neutral", 0.0
    
    positive_score = 0.0
    negative_score = 0.0
    neutral_score = 0.0
    total_weight = 0.0
    
    for result in chunk_results:
        sentiment = result['sentiment']
        confidence = result['confidence']
        
        if sentiment == "Positive":
            positive_score += confidence
        elif sentiment == "Negative":
            negative_score += confidence
        else:
            neutral_score += confidence
        
        total_weight += confidence
    
    if total_weight > 0:
        positive_score /= total_weight
        negative_score /= total_weight
        neutral_score /= total_weight
    
    max_score = max(positive_score, negative_score, neutral_score)
    
    if max_score == positive_score:
        final_sentiment = "Positive"
    elif max_score == negative_score:
        final_sentiment = "Negative"
    else:
        final_sentiment = "Neutral"
    
    avg_confidence = sum(r['confidence'] for r in chunk_results) / len(chunk_results)
    
    return final_sentiment, round(avg_confidence, 3), {
        "positive": round(positive_score, 3),
        "negative": round(negative_score, 3),
        "neutral": round(neutral_score, 3)
    }


def classify_feedback(text, neutral_margin=0.22, min_neutral_confidence=0.55, handle_long=True):
    if not text or len(text.strip()) < 5:
        return {
            "text": text,
            "sentiment": "INVALID",
            "confidence": 0.0,
            "inference_time_ms": 0.0,
            "reason": "Text too short",
            "chunks_processed": 0
        }
    
    start = time.time()
    token_estimate = estimate_tokens(text)
    chunks = [text]  
    
    if handle_long and token_estimate > MAX_TOKENS:
        chunks = split_feedback(text, MAX_TOKENS)
    
    try:
        chunk_results = []
        
        for chunk in chunks:
            results = sentiment_classifier(chunk, top_k=None)
            results = sorted(results, key=lambda x: x["score"], reverse=True)
            top = results[0]
            second = results[1]
            margin = top["score"] - second["score"]
            
            if margin < neutral_margin or top["score"] < min_neutral_confidence:
                sentiment = "Neutral"
            else:
                sentiment = LABEL_MAP[top["label"]]
            
            chunk_results.append({
                "sentiment": sentiment,
                "confidence": round(top["score"], 3),
                "margin": round(margin, 3)
            })
        
        infer_time = (time.time() - start) * 1000
        
        if len(chunks) == 1:
            final_sentiment = chunk_results[0]['sentiment']
            final_confidence = chunk_results[0]['confidence']
            aggregation_scores = None
        else:
            final_sentiment, final_confidence, aggregation_scores = aggregate_sentiments(chunk_results)
        
        return {
            "text": text[:100] + "..." if len(text) > 100 else text,
            "sentiment": final_sentiment,
            "confidence": final_confidence,
            "inference_time_ms": round(infer_time, 2),
            "token_estimate": token_estimate,
            "chunks_processed": len(chunks),
            "chunk_results": chunk_results if len(chunks) > 1 else None,
            "aggregation_scores": aggregation_scores,
            "status": "success"
        }
    
    except Exception as e:
        return {
            "text": text[:100] + "..." if len(text) > 100 else text,
            "sentiment": "ERROR",
            "confidence": 0.0,
            "inference_time_ms": round((time.time() - start) * 1000, 2),
            "error": str(e),
            "status": "failed"
        }


sentiment_classifier("Warm up run")

