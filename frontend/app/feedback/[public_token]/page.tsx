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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !eventInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchEventInfo}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 backdrop-blur-lg bg-white/90">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {eventInfo.title}
          </h1>
          {eventInfo.description && (
            <p className="text-gray-600 text-sm md:text-base">
              {eventInfo.description}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Mode Toggle */}
        <div className="flex gap-3 mb-8 p-2 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-medium transition-all ${
              mode === 'text'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm md:text-base">Text Feedback</span>
          </button>
          <button
            onClick={() => setMode('voice')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-medium transition-all ${
              mode === 'voice'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span className="text-sm md:text-base">Voice Feedback</span>
          </button>
        </div>

        {/* Input Component */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 md:p-8">
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
