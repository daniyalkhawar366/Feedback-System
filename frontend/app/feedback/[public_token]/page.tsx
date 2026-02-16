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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" style={{ animation: 'spin 1s linear infinite' }} />
          <p className="text-gray-600 font-semibold text-base">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !eventInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2
            className="text-2xl font-bold text-gray-900 mb-2"
            style={{ letterSpacing: '-0.02em' }}
          >
            Event Not Found
          </h2>
          <p className="text-gray-600 mb-6 text-[15px]">{error}</p>
          <button
            onClick={fetchEventInfo}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-3"
            style={{ letterSpacing: '-0.03em' }}
          >
            {eventInfo.title}
          </h1>
          {eventInfo.description && (
            <p className="text-gray-600 text-base md:text-[17px] font-medium">
              {eventInfo.description}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Mode Toggle */}
        <div className="flex gap-3 mb-8 p-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-semibold transition-all ${
              mode === 'text'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm md:text-base">Text Feedback</span>
          </button>
          <button
            onClick={() => setMode('voice')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-semibold transition-all ${
              mode === 'voice'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span className="text-sm md:text-base">Voice Feedback</span>
          </button>
        </div>

        {/* Input Component */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-lg">
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
