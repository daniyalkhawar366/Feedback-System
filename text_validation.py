import math
import re
from collections import Counter
from typing import List, Dict
import string

COMMON_ENGLISH_WORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from",
    "is", "are", "am", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "shall", "should", "could", "can", "may", "might", "must", "ought",
    "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
    "my", "your", "his", "her", "its", "our", "their", "mine", "yours", "theirs",
    "what", "which", "who", "when", "where", "why", "how", "this", "that", "these", "those",
    "good", "great", "bad", "excellent", "terrible", "amazing", "awful", "wonderful", "horrible",
    "really", "very", "quite", "so", "just", "only", "also", "too", "well", "more", "less", "most",
    "up", "down", "out", "in", "over", "under", "above", "below", "through", "during", "before", "after",
    "get", "make", "take", "give", "go", "come", "see", "know", "think", "say", "tell", "ask", "show",
    "session", "learned", "about", "fastapi", "great", "thanks", "thank", "love", "like", "enjoyed",
    "presentation", "speaker", "event", "conference", "training", "course", "information", "helpful"
}

FILLER_WORDS = {
    "um", "uh", "uhh", "umm", "hmm", "hm",
    "like", "yeah", "yep", "yah", "ya",
    "so", "you know", "i mean", "basically",
    "literally", "actually", "honestly", "right",
    "ok", "okay", "well", "anyway", "anyhow",
    "thus", "er", "err", "ah", "oh", "ooh", "uh huh"
}

def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def char_entropy(text: str) -> float:
    if not text:
        return 0.0
    counts = Counter(text)
    total = len(text)
    return -sum(
        (c / total) * math.log2(c / total)
        for c in counts.values()
    )


def english_word_ratio(words: List[str]) -> float:
    if not words:
        return 0.0
    
    valid_count = 0
    for w in words:
        w_lower = w.lower()
        if w_lower in COMMON_ENGLISH_WORDS or (len(w_lower) > 2 and w_lower.isalpha()):
            valid_count += 1
    
    return valid_count / len(words)


def repetition_ratio(words: List[str]) -> float:
    if not words:
        return 1.0
    return len(set(words)) / len(words)


def filler_word_ratio(words: List[str]) -> float:
    if not words:
        return 0.0
    
    filler_count = sum(1 for w in words if w.lower() in FILLER_WORDS)
    return filler_count / len(words)


def gibberish_score(text: str) -> float:
    gibberish_patterns = {
        "blah": 0.8,
        "shaka": 0.7,
        "lala": 0.7,
        "boom": 0.5,
        "bla": 0.7,
        "lalala": 0.9,
        "yada": 0.6,
        "blabla": 0.85,
    }
    
    words = text.lower().split()
    gibberish_count = 0
    
    for word in words:
        for pattern, weight in gibberish_patterns.items():
            if pattern in word:
                gibberish_count += weight
                break
    
    if not words:
        return 0.0
    
    return gibberish_count / len(words)


def detect_spam_patterns(text: str) -> float:
    spam_score = 0.0
    
    if re.search(r'http[s]?://|www\.', text):
        spam_score += 0.3
    
    words = text.split()
    if words:
        capital_words = sum(1 for w in words if w.isupper() and len(w) > 2)
        if capital_words / len(words) > 0.5:
            spam_score += 0.3
    
    if re.search(r'([!?.])\1{2,}', text):
        spam_score += 0.2
    
    if re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text):
        spam_score += 0.2
    
    return min(spam_score, 1.0)


def language_detection(text: str) -> Dict:
    normalized = text.lower()
    words = normalized.split()
    
    english_markers = {"the", "a", "is", "and", "to", "of", "in", "that", "it", "you", "for", "this"}
    english_count = sum(1 for marker in english_markers if marker in words)
    
    ascii_chars = sum(1 for c in text if ord(c) < 128)
    ascii_ratio = ascii_chars / len(text) if text else 0
    
    word_confidence = min(english_count / max(len(words), 1), 1.0)
    ascii_confidence = ascii_ratio
    combined_confidence = (word_confidence + ascii_confidence) / 2
    
    return {
        "primary_language": "en",
        "confidence": round(combined_confidence, 2)
    }


def validate_text_feedback(text: str) -> Dict:
    flags = []
    decision = "ACCEPT"
    
    if not text or len(text.strip()) < 5:
        return {
            "decision": "REJECT",
            "reason": "Text too short (minimum 5 characters)",
            "flags": [],
            "metrics": {} 
        }
    
    if len(text) > 5000:
        return {
            "decision": "REJECT",
            "reason": "Text too long (maximum 5000 characters)",
            "flags": []
        }
    
    normalized = normalize_text(text)
    words = text.split()
    word_count = len(words)
    
    lang_detection = language_detection(text)
    if lang_detection["confidence"] < 0.3:
        flags.append("non_english_language_detected")
    
    eng_ratio = english_word_ratio(words)
    if eng_ratio < 0.65:
        flags.append("low_english_word_ratio")
    
    entropy = char_entropy(normalized)
    if entropy < 2.5:
        flags.append("low_entropy")
    
    rep_ratio = repetition_ratio(words)
    if rep_ratio < 0.4:
        flags.append("high_repetition")
    
    filler_ratio = filler_word_ratio(words)
    if filler_ratio > 0.4:
        flags.append("excessive_filler_words")
    
    gibberish = gibberish_score(normalized)
    if gibberish > 0.15:
        flags.append("gibberish_detected")
    
    spam = detect_spam_patterns(text)
    if spam > 0.3:
        flags.append("spam_detected")
    
    if word_count > 3:
        upper_ratio = sum(1 for c in text if c.isupper()) / len(text) if text else 0
        if upper_ratio > 0.7:
            flags.append("excessive_capitalization")
    
    if flags:
        decision = "FLAG"
    
    return {
        "decision": decision,
        "flags": flags,
        "clean_text": text,
        "metrics": {
            "english_word_ratio": round(eng_ratio, 2),
            "filler_word_ratio": round(filler_ratio, 2),
            "gibberish_score": round(gibberish, 2),
            "spam_score": round(spam, 2),
            "char_entropy": round(entropy, 2),
            "repetition_ratio": round(rep_ratio, 2),
            "word_count": word_count
        }
    }


def is_valid_feedback(validation_result: Dict) -> bool:
    return validation_result["decision"] in ["ACCEPT", "FLAG"]


def get_validation_issues(validation_result: Dict) -> List[str]:
    flag_descriptions = {
        "non_english_language_detected": "Text appears to be in a non-English language",
        "low_english_word_ratio": "Less than 65% valid English words detected",
        "low_entropy": "Text appears to be random characters or highly repetitive",
        "high_repetition": "Same words repeated excessively",
        "excessive_filler_words": "Contains more than 40% filler words (um, uh, like, etc.)",
        "gibberish_detected": "Nonsense words or patterns detected",
        "spam_detected": "Potential spam content (URLs, excessive symbols, etc.)",
        "excessive_capitalization": "Contains excessive capital letters"
    }
    
    return [
        flag_descriptions.get(flag, flag) 
        for flag in validation_result.get("flags", [])
    ]


if __name__ == "__main__":
    test_inputs = [
        "Great session, learned a lot about FastAPI!",
        "!!!! http://spam.com !!!!",
        "um uh like so basically uh",
        "a",  
        "THANK YOU AMAZING EVENT!!!",
        "blablablablabla this is gibberish yada yada",
    ]

    print("=" * 60)
    print("TEXT VALIDATION TESTS")
    print("=" * 60)
    
    for text in test_inputs:
        res = validate_text_feedback(text)
        print(f"\nText: '{text}'")
        print(f"Decision: {res['decision']}")
        print(f"Metrics: {res['metrics']}")
        if res.get('flags'):
            print(f"Flags: {res['flags']}")
            issues = get_validation_issues(res)
            print(f"Issues: {issues}")
        if res.get('reason'):
            print(f"Reason: {res['reason']}")
        print("-" * 60)