import math
import re
import soundfile as sf
import numpy as np
from collections import Counter
from faster_whisper import WhisperModel
from wordfreq import zipf_frequency
from typing import List, Dict
import subprocess
from pathlib import Path

# Lazy load model - only initialize when needed
_model = None

def get_model():
    global _model
    if _model is None:
        _model = WhisperModel(
            "small.en",  # This will auto-download the model
            device="cpu",
            compute_type="int8"
        )
    return _model

def normalize_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def convert_webm_to_wav(webm_path: str) -> str:
    """Convert WebM audio to WAV format using ffmpeg"""
    wav_path = webm_path.rsplit('.', 1)[0] + '_converted.wav'
    
    try:
        # Use ffmpeg to convert WebM to WAV
        subprocess.run([
            'ffmpeg',
            '-i', webm_path,
            '-ar', '16000',  # 16kHz sample rate (good for speech)
            '-ac', '1',       # mono
            '-y',             # overwrite output file
            wav_path
        ], check=True, capture_output=True, timeout=30)
        
        return wav_path
    except subprocess.CalledProcessError as e:
        raise Exception(f"Error converting audio: {e.stderr.decode() if e.stderr else str(e)}")
    except FileNotFoundError:
        raise Exception("ffmpeg not found. Please install ffmpeg to process audio files.")
    except subprocess.TimeoutExpired:
        raise Exception("Audio conversion timed out")


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
    valid = sum(
        1 for w in words if zipf_frequency(w, "en") > 2
    )
    return valid / len(words)


def repetition_ratio(words: List[str]) -> float:
    if not words:
        return 1.0
    return len(set(words)) / len(words)


def filler_word_ratio(words: List[str]) -> float:
    if not words:
        return 0.0
    
    filler_words = {
        "um", "uh", "uhh", "umm", "hmm", "hm",
        "like", "yeah", "yep", "yah", "ya",
        "so", "you know", "i mean", "basically",
        "literally", "actually", "honestly", "right",
        "ok", "okay", "well", "anyway", "anyhow",
        "thus", "er", "err", "ah", "oh", "ooh"
    }
    
    filler_count = sum(1 for w in words if w in filler_words)
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
    }
    
    words = text.split()
    gibberish_count = 0
    
    for word in words:
        for pattern, weight in gibberish_patterns.items():
            if pattern in word:
                gibberish_count += weight
                break
    
    if not words:
        return 0.0
    
    return gibberish_count / len(words)


def detect_audio_silence(audio_path: str, threshold: float = 0.01) -> bool:
    # Convert WebM to WAV if needed
    if audio_path.lower().endswith('.webm'):
        audio_path = convert_webm_to_wav(audio_path)
    
    data, samplerate = sf.read(audio_path)
    if data.ndim > 1:
        data = data.mean(axis=1)

    rms = np.sqrt(np.mean(data**2))
    return rms < threshold


def get_audio_duration(audio_path: str) -> float:
    # Convert WebM to WAV if needed
    if audio_path.lower().endswith('.webm'):
        audio_path = convert_webm_to_wav(audio_path)
    
    data, samplerate = sf.read(audio_path)
    duration = len(data) / samplerate
    return duration


def quality_gate(
    text: str,
    segments,
    info
) -> Dict:
    flags = []
    decision = "ACCEPT"

    total_speech = sum(seg.end - seg.start for seg in segments)
    if total_speech < 1.0 or len(text) < 5:
        return {
            "decision": "REJECT",
            "reason": "No meaningful speech detected",
            "flags": []
        }

    if info.language_probability < 0.6:
        flags.append("low_language_confidence")

    words = text.split()

    if repetition_ratio(words) < 0.4:
        flags.append("high_repetition")

    if char_entropy(text) < 2.5:
        flags.append("low_entropy")

    eng_ratio = english_word_ratio(words)
    if eng_ratio < 0.65:
        flags.append("low_english_word_ratio")

    filler_ratio = filler_word_ratio(words)
    if filler_ratio > 0.4:
        flags.append("excessive_filler_words")
    
    gibberish = gibberish_score(text)
    if gibberish > 0.15:
        flags.append("gibberish_detected")

    if len(words) > 300:
        flags.append("excessively_long")
        text = " ".join(words[:300])

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
            "char_entropy": round(char_entropy(text), 2),
            "repetition_ratio": round(repetition_ratio(words), 2)
        }
    }


def transcribe_and_validate(audio_path: str) -> Dict:
    converted_path = None
    try:
        # Convert WebM to WAV if needed
        if audio_path.lower().endswith('.webm'):
            converted_path = convert_webm_to_wav(audio_path)
            processing_path = converted_path
        else:
            processing_path = audio_path
        
        duration = get_audio_duration(processing_path)
        if duration > 300:  
            return {
                "decision": "REJECT",
                "reason": "Audio duration exceeds 5 minutes maximum"
            }
        if duration < 2:  
            return {
                "decision": "REJECT",
                "reason": "Audio too short (minimum 2 seconds)"
            }
    except Exception as e:
        return {
            "decision": "REJECT",
            "reason": f"Invalid audio file: {str(e)}"
        }

    if detect_audio_silence(processing_path):
        return {
            "decision": "REJECT",
            "reason": "Silent audio"
        }

    model = get_model()  # Lazy load the model
    segments_gen, info = model.transcribe(
        processing_path,
        beam_size=5
    )

    segments = list(segments_gen)

    raw_text = " ".join(seg.text for seg in segments)
    normalized = normalize_text(raw_text)

    quality_result = quality_gate(
        normalized,
        segments,
        info
    )
    
    # Clean up converted file if it was created
    if converted_path and Path(converted_path).exists():
        try:
            Path(converted_path).unlink()
        except:
            pass  # Ignore cleanup errors

    return {
        "language": info.language,
        "language_probability": round(info.language_probability, 2),
        "raw_text": raw_text,
        "normalized_text": quality_result.get("clean_text", ""),
        "decision": quality_result["decision"],
        "flags": quality_result.get("flags", []),
        "metrics": quality_result.get("metrics", {})
    }

