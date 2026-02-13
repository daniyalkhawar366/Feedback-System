'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Loader2, MessageSquare, Mic } from 'lucide-react';
import TextFeedbackInput from '@/components/feedback/TextFeedbackInput';
import VoiceFeedbackInput from '@/components/feedback/VoiceFeedbackInput';
import SuccessModal from '@/components/feedback/SuccessModal';
import { API_BASE_URL } from '@/utils/api';
import type { EventInfoResponse } from '@/types/api';

type InputMode = 'text' | 'voice';

export default function PublicFeedbackPage() {
  const params = useParams();
  const public_token = params.public_token as string;

  const [mode, setMode] = useState<InputMode>('text');
  const [eventInfo, setEventInfo] = useState<EventInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchEventInfo();
  }, [public_token]);

  const fetchEventInfo = async () => {
    try {
      setLoading(true);
      const response = await axios.get<EventInfoResponse>(
        `${API_BASE_URL}/feedback/${public_token}`
      );
      setEventInfo(response.data);
      setError(null);
    } catch (err) {
      setError('Invalid or expired event link. Please contact the event organizer.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowSuccess(true);
  };

  const handleSubmitAnother = () => {
    setShowSuccess(false);
    setMode('text');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f5f2] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#1a1917] animate-spin mx-auto mb-4" style={{ animation: 'spin 1s linear infinite' }} />
          <p className="text-[#6b6760] font-medium">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !eventInfo) {
    return (
      <div className="min-h-screen bg-[#f6f5f2] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#e8e5df] p-8 text-center">
          <div className="w-16 h-16 bg-[#fef2f2] border border-[#fecaca] rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#b91c1c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2
            className="text-2xl font-medium text-[#1a1917] mb-2"
            style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: '-0.01em' }}
          >
            Event Not Found
          </h2>
          <p className="text-[#6b6760] mb-6">{error}</p>
          <button
            onClick={fetchEventInfo}
            className="px-6 py-3 bg-[#1a1917] hover:bg-[#333] text-white rounded-xl font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f5f2]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e5df] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1
            className="text-3xl md:text-4xl font-medium text-[#1a1917] mb-2"
            style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: '-0.02em' }}
          >
            {eventInfo.title}
          </h1>
          {eventInfo.description && (
            <p className="text-[#6b6760] text-sm md:text-base font-medium">
              {eventInfo.description}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Mode Toggle */}
        <div className="flex gap-3 mb-8 p-2 bg-white rounded-xl border border-[#e8e5df]">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-medium transition-all ${
              mode === 'text'
                ? 'bg-[#1a1917] text-white'
                : 'text-[#6b6760] hover:bg-[#fafaf8]'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm md:text-base">Text Feedback</span>
          </button>
          <button
            onClick={() => setMode('voice')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-medium transition-all ${
              mode === 'voice'
                ? 'bg-[#1a1917] text-white'
                : 'text-[#6b6760] hover:bg-[#fafaf8]'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span className="text-sm md:text-base">Voice Feedback</span>
          </button>
        </div>

        {/* Input Component */}
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6 md:p-8">
          {mode === 'text' ? (
            <TextFeedbackInput
              publicToken={public_token}
              onSuccess={handleSuccess}
            />
          ) : (
            <VoiceFeedbackInput
              publicToken={public_token}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        onSubmitAnother={handleSubmitAnother}
      />
    </div>
  );
}
