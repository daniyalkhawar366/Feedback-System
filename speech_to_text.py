import re
import soundfile as sf
import numpy as np
from faster_whisper import WhisperModel
from typing import Dict
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


def transcribe_audio(audio_path: str) -> Dict:
    """
    Transcribe audio file to text with audio-specific validations only.
    Text validation should be done separately using text_validation.py
    
    Returns:
        Dict with transcription result or error
    """
    converted_path = None
    try:
        # Convert WebM to WAV if needed
        if audio_path.lower().endswith('.webm'):
            converted_path = convert_webm_to_wav(audio_path)
            processing_path = converted_path
        else:
            processing_path = audio_path
        
        # Audio-specific validations
        duration = get_audio_duration(processing_path)
        if duration > 300:  
            return {
                "success": False,
                "reason": "Audio duration exceeds 5 minutes maximum",
                "audio_duration": duration
            }
        if duration < 2:  
            return {
                "success": False,
                "reason": "Audio too short (minimum 2 seconds)",
                "audio_duration": duration
            }
            
        if detect_audio_silence(processing_path):
            return {
                "success": False,
                "reason": "Silent audio detected",
                "audio_duration": duration
            }
    except Exception as e:
        return {
            "success": False,
            "reason": f"Invalid audio file: {str(e)}"
        }

    # Transcribe using Whisper
    model = get_model()
    segments_gen, info = model.transcribe(
        processing_path,
        beam_size=5
    )

    segments = list(segments_gen)
    
    # Check for meaningful speech
    total_speech = sum(seg.end - seg.start for seg in segments)
    if total_speech < 1.0:
        return {
            "success": False,
            "reason": "No meaningful speech detected",
            "audio_duration": duration,
            "speech_duration": total_speech
        }

    raw_text = " ".join(seg.text for seg in segments)
    
    if len(raw_text.strip()) < 5:
        return {
            "success": False,
            "reason": "Transcribed text too short",
            "audio_duration": duration,
            "transcribed_text": raw_text
        }
    
    # Clean up converted file if it was created
    if converted_path and Path(converted_path).exists():
        try:
            Path(converted_path).unlink()
        except:
            pass  # Ignore cleanup errors

    return {
        "success": True,
        "raw_text": raw_text,
        "language": info.language,
        "language_probability": round(info.language_probability, 2),
        "audio_duration": duration,
        "speech_duration": total_speech
    }


