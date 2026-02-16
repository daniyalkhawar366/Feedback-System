"""
Cloud-based Speech-to-Text using Groq API
Lightweight alternative to local faster-whisper for production deployment
"""
import os
import subprocess
from pathlib import Path
from typing import Dict
from groq import Groq

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def convert_webm_to_wav(webm_path: str) -> str:
    """Convert WebM audio to WAV format using ffmpeg"""
    wav_path = webm_path.rsplit('.', 1)[0] + '_converted.wav'
    
    try:
        subprocess.run([
            'ffmpeg',
            '-i', webm_path,
            '-ar', '16000',  # 16kHz sample rate
            '-ac', '1',       # mono
            '-y',             # overwrite
            wav_path
        ], check=True, capture_output=True, timeout=30)
        
        return wav_path
    except subprocess.CalledProcessError as e:
        raise Exception(f"Error converting audio: {e.stderr.decode() if e.stderr else str(e)}")
    except FileNotFoundError:
        raise Exception("ffmpeg not found. Please install ffmpeg.")
    except subprocess.TimeoutExpired:
        raise Exception("Audio conversion timed out")


def get_audio_duration(audio_path: str) -> float:
    """Get audio duration using ffprobe"""
    try:
        result = subprocess.run([
            'ffprobe',
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            audio_path
        ], capture_output=True, text=True, timeout=10)
        
        return float(result.stdout.strip())
    except Exception:
        # Fallback: estimate from file size (rough estimate)
        file_size = os.path.getsize(audio_path)
        estimated_duration = file_size / 16000  # Very rough estimate
        return estimated_duration


def transcribe_audio(audio_path: str) -> Dict:
    """
    Transcribe audio file using Groq's Whisper API
    
    Returns:
        Dict with transcription result or error
    """
    converted_path = None
    
    try:
        # Convert WebM to supported format if needed
        if audio_path.lower().endswith('.webm'):
            converted_path = convert_webm_to_wav(audio_path)
            processing_path = converted_path
        else:
            processing_path = audio_path
        
        # Get audio duration for validation
        duration = get_audio_duration(processing_path)
        
        # Validate audio duration (1-30 seconds)
        if duration < 1:
            return {
                "status": "error",
                "message": "Audio too short (minimum 1 second)",
                "type": "duration"
            }
        
        if duration > 30:
            return {
                "status": "error",
                "message": "Audio too long (maximum 30 seconds)",
                "type": "duration"
            }
        
        # Transcribe using Groq Whisper API
        with open(processing_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=audio_file,
                language="en",
                response_format="verbose_json"
            )
        
        transcribed_text = transcription.text.strip()
        
        # Check if transcription is empty
        if not transcribed_text:
            return {
                "status": "error",
                "message": "No speech detected in audio",
                "type": "empty"
            }
        
        # Minimum word count check
        word_count = len(transcribed_text.split())
        if word_count < 3:
            return {
                "status": "error",
                "message": "Transcription too short (minimum 3 words)",
                "type": "short"
            }
        
        return {
            "status": "success",
            "text": transcribed_text,
            "duration": duration,
            "word_count": word_count,
            "language": "en"
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": f"Transcription failed: {str(e)}",
            "type": "processing"
        }
    
    finally:
        # Clean up converted file
        if converted_path and Path(converted_path).exists():
            try:
                Path(converted_path).unlink()
            except Exception:
                pass


# Backward compatibility - use the same function name as original
def transcribe_with_whisper(audio_path: str) -> Dict:
    """Alias for backward compatibility"""
    return transcribe_audio(audio_path)
