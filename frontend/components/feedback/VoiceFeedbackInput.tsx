'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Mic, Square, Play, Trash2, Send, Loader2, AlertCircle } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { API_BASE_URL } from '@/utils/api';
import type { FeedbackResponse } from '@/types/api';

interface VoiceFeedbackInputProps {
  publicToken: string;
  onSuccess: () => void;
}

export default function VoiceFeedbackInput({ publicToken, onSuccess }: VoiceFeedbackInputProps) {
  const maxDuration = 300; // 5 minutes
  const minDuration = 2; // 2 seconds
  
  const {
    isRecording,
    duration,
    audioBlob,
    audioURL,
    startRecording,
    stopRecording,
    deleteRecording,
    formatDuration,
  } = useAudioRecorder(maxDuration);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleStartRecording = async () => {
    try {
      setError(null);
      setPermissionDenied(false);
      await startRecording();
    } catch (err) {
      setPermissionDenied(true);
      setError('Microphone access denied. Please allow microphone permissions in your browser.');
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;

    if (duration < minDuration) {
      setError(`Recording too short. Minimum ${minDuration} seconds required.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'feedback.webm');

      await axios.post<FeedbackResponse>(
        `${API_BASE_URL}/feedback/${publicToken}/audio`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      deleteRecording();
      onSuccess();
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to submit audio. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (audioURL && audioRef.current) {
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', () => setIsPlaying(false));
      }
    };
  }, [audioURL]);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-pink-50 border border-pink-100 rounded-xl p-4">
        <p className="text-sm text-pink-900 flex items-start gap-2">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>
            Record your voice feedback (2 seconds minimum, 5 minutes maximum). You can review before submitting.
          </span>
        </p>
      </div>

      {/* Permission Denied Error */}
      {permissionDenied && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 mb-2">Microphone Access Required</p>
              <p className="text-xs text-amber-700">
                Please allow microphone access in your browser settings and try again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recording Interface */}
      <div className="flex flex-col items-center justify-center py-12">
        {!isRecording && !audioBlob && (
          <div className="text-center">
            <button
              onClick={handleStartRecording}
              disabled={isSubmitting}
              className="group relative mb-6"
            >
              <div className="w-32 h-32 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl shadow-pink-600/40 transition-transform active:scale-95 group-hover:scale-105">
                <Mic className="w-16 h-16 text-white" />
              </div>
              <div className="absolute inset-0 rounded-full bg-pink-600 animate-ping opacity-20"></div>
            </button>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              Tap to Start Recording
            </p>
            <p className="text-sm text-gray-500">
              Maximum duration: {formatDuration(maxDuration)}
            </p>
          </div>
        )}

        {isRecording && (
          <div className="text-center">
            {/* Recording Animation */}
            <div className="relative mb-6">
              <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/40 animate-pulse">
                <Mic className="w-16 h-16 text-white" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping"></div>
            </div>

            {/* Timer */}
            <div className="text-4xl font-bold text-gray-900 mb-2 font-mono">
              {formatDuration(duration)}
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Recording... ({formatDuration(maxDuration - duration)} remaining)
            </p>

            {/* Waveform Visual */}
            <div className="flex items-center justify-center gap-1 mb-6">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 40 + 20}px`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>

            {/* Stop Button */}
            <button
              onClick={stopRecording}
              className="px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold flex items-center gap-2 mx-auto hover:bg-gray-800 transition-colors shadow-lg"
            >
              <Square className="w-5 h-5" />
              Stop Recording
            </button>
          </div>
        )}

        {!isRecording && audioBlob && (
          <div className="w-full max-w-md">
            {/* Audio Player */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Recording Ready</p>
                  <p className="text-xs text-gray-500">Duration: {formatDuration(duration)}</p>
                </div>
                <button
                  onClick={handlePlayPause}
                  className="w-14 h-14 bg-pink-600 hover:bg-pink-700 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
                >
                  {isPlaying ? <Square className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>
              </div>

              {/* Hidden audio element */}
              {audioURL && (
                <audio ref={audioRef} src={audioURL} className="hidden" />
              )}

              {/* Waveform visualization (static) */}
              <div className="flex items-center gap-0.5 h-12 bg-white rounded-lg px-2">
                {[...Array(50)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-pink-500 rounded-full"
                    style={{
                      height: `${Math.random() * 70 + 30}%`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={deleteRecording}
                disabled={isSubmitting}
                className="flex-1 py-4 px-6 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || duration < minDuration}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  isSubmitting || duration < minDuration
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-600/30 active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit
                  </>
                )}
              </button>
            </div>

            {duration < minDuration && (
              <p className="text-xs text-amber-600 text-center mt-2">
                Recording too short. Minimum {minDuration} seconds required.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Privacy Note */}
      <p className="text-xs text-center text-gray-500">
        Your voice recording is anonymous and will be transcribed for analysis.
      </p>
    </div>
  );
}
