'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Mic, Square, Play, Trash2, Send, Loader2, AlertCircle, PlayCircle, PauseCircle } from 'lucide-react';
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
        { headers: { 'Content-Type': 'multipart/form-data' } }
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
      if (audioRef.current) audioRef.current.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [audioURL]);

  return (
    <div className="flex flex-col gap-4 animate-fade-up h-full justify-between">
      {/* Friendly Instruction Callout */}
      {!isRecording && !audioBlob && (
        <div className="bg-[#44bea9]/10 border border-[#44bea9]/20 rounded-[14px] p-3 flex gap-3 shrink-0">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-[#44bea9]">
            <Mic className="w-3.5 h-3.5" />
          </div>
          <div className="pt-0.5">
            <p className="text-[13.5px] font-medium text-[#2d7d6f] leading-snug">
              Share via voice recording.
            </p>
            <p className="text-[12.5px] text-[#328f7f]/80 mt-0.5 leading-relaxed">
              Tap the microphone to begin. You can review your recording before sending it.
            </p>
          </div>
        </div>
      )}

      {/* Permission Denied Error */}
      {permissionDenied && (
        <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[14.5px] font-bold text-amber-900 mb-1 tracking-tight">Microphone Access Needed</p>
              <p className="text-[13.5px] text-amber-700/90 leading-relaxed">
                Please allow microphone access in your browser settings to record audio feedback.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Recording Area */}
      <div className="flex flex-col items-center justify-center py-2 px-4 flex-1">

        {/* State 1: Ready to Record */}
        {!isRecording && !audioBlob && (
          <div className="text-center flex flex-col items-center">
            <button
              onClick={handleStartRecording}
              disabled={isSubmitting}
              className="group relative mb-6 outline-none"
            >
              {/* Pulsing ring behind */}
              <div className="absolute inset-[-10px] rounded-full bg-[#44bea9] opacity-20 animate-ping" style={{ animationDuration: '2s' }} />
              {/* Outer stroke */}
              <div className="absolute inset-[-4px] rounded-full border-[3px] border-[#44bea9]/30 transition-transform group-hover:scale-105" />
              {/* Inner button */}
              <div className="relative w-20 h-20 bg-gradient-to-b from-[#44bea9] to-[#328f7f] rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-xl shadow-[#44bea9]/30">
                <Mic className="w-8 h-8 text-white" fill="currentColor" strokeWidth={1} />
              </div>
            </button>
            <p className="text-[16px] font-extrabold text-slate-800 tracking-tight">Tap to Start Recording</p>
            <p className="text-[13px] font-medium text-slate-400 mt-1">Up to {formatDuration(maxDuration)} limit</p>
          </div>
        )}

        {/* State 2: Actively Recording */}
        {isRecording && (
          <div className="text-center w-full max-w-sm animate-in fade-in zoom-in duration-300">
            <div className="text-[40px] font-bold text-slate-900 font-mono tracking-tighter mb-4 tabular-nums">
              {formatDuration(duration)}
            </div>

            {/* Visualizer bars */}
            <div className="flex items-center justify-center gap-[3px] mb-8 h-12">
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-[#44bea9] rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 80 + 20}%`,
                    animationDelay: `${i * 0.05}s`,
                    animationDuration: '0.4s'
                  }}
                />
              ))}
            </div>

            <button
              onClick={stopRecording}
              className="w-12 h-12 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-900 rounded-full flex items-center justify-center mx-auto transition-all shadow-md active:scale-95"
              aria-label="Stop Recording"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-4">Stop</p>
          </div>
        )}

        {/* State 3: Review & Submit */}
        {!isRecording && audioBlob && (
          <div className="w-full max-w-sm animate-in slide-in-from-bottom-4 duration-400 flex flex-col justify-between h-full">
            {/* Playback Box */}
            <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm p-4 mb-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[14px] font-bold text-slate-900 tracking-tight">Recording Ready</p>
                  <p className="text-[12px] font-medium text-slate-500">{formatDuration(duration)} duration</p>
                </div>
                <button
                  onClick={handlePlayPause}
                  className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-full flex items-center justify-center transition-colors shadow-sm"
                >
                  {isPlaying ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                </button>
              </div>

              {audioURL && <audio ref={audioRef} src={audioURL} className="hidden" />}

              {/* Static Waveform */}
              <div className="flex items-center gap-[2px] h-8 w-full rounded-lg overflow-hidden opacity-50">
                {[...Array(40)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-slate-300 rounded-full"
                    style={{ height: `${Math.random() * 80 + 20}%` }}
                  />
                ))}
              </div>
            </div>

            {duration < minDuration && (
              <div className="mb-2 bg-amber-50 rounded-[12px] p-3 border border-amber-200">
                <p className="text-[13.5px] font-semibold text-amber-700 text-center">
                  Recording is too short (minimum {minDuration}s).
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-auto pt-2">
              <button
                onClick={deleteRecording}
                disabled={isSubmitting}
                className="w-12 shrink-0 h-12 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 text-slate-500 rounded-[14px] flex items-center justify-center transition-all shadow-sm active:-translate-y-px disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || duration < minDuration}
                className={`flex-1 h-12 rounded-[16px] font-bold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 text-[14px]
                  ${(isSubmitting || duration < minDuration)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-slate-900 hover:bg-slate-800 text-white active:scale-[0.98] hover:shadow-xl hover:-translate-y-0.5'}`}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                ) : (
                  <>Send Feedback <Send className="w-3.5 h-3.5 ml-1" /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && !permissionDenied && (
        <div className="bg-red-50 border border-red-200 rounded-[16px] p-4 text-center mt-4">
          <p className="text-[14px] font-medium text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
