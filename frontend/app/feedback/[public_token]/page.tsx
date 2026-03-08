'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Activity, MessageSquare, Mic, AlertCircle } from 'lucide-react';
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

  const handleSuccess = () => setShowSuccess(true);
  const handleSubmitAnother = () => {
    setShowSuccess(false);
    setMode('text');
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center mb-6">
          <span className="absolute w-16 h-16 rounded-[18px] bg-[#44bea9]/20 animate-ping" style={{ animationDuration: '1.6s' }} />
          <span className="absolute w-14 h-14 rounded-[16px] bg-[#44bea9]/10" />
          <div className="relative w-12 h-12 bg-gradient-to-br from-[#44bea9] to-[#328f7f] rounded-[13px] flex items-center justify-center shadow-lg border border-[#44bea9]/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
        </div>
        <p className="text-slate-500 font-medium tracking-wide">Loading event details…</p>
      </div>
    );
  }

  // ── Error State ──
  if (error || !eventInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[24px] border border-slate-100 p-8 text-center shadow-xl shadow-slate-200/50">
          <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-[16px] flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-[22px] font-bold text-slate-900 mb-2 tracking-tight">Event Not Found</h2>
          <p className="text-slate-500 mb-8 text-[15px] leading-relaxed">{error}</p>
          <button
            onClick={fetchEventInfo}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-[14px] font-semibold transition-all active:scale-[0.98] shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Main Feedback Page ──
  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-[#44bea9]/20">

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="absolute top-[-10%] w-[800px] h-[400px] bg-[#44bea9]/5 blur-[100px] rounded-full" />
      </div>

      {/* Branded Header */}
      <header className="relative z-10 pt-8 pb-4 px-6 flex justify-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#44bea9] to-[#328f7f] rounded-[8px] flex items-center justify-center shadow-sm">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="text-[17px] font-bold tracking-tight text-slate-800">Ripple</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col justify-center w-full max-w-2xl mx-auto px-4 pb-4 animate-fade-up">

        {/* Event Info Card */}
        <div className="text-center mb-6">
          <h1 className="text-[28px] sm:text-[36px] font-extrabold tracking-tight text-slate-900 mb-2 leading-[1.1]">
            {eventInfo.title}
          </h1>
          {eventInfo.description && (
            <p className="text-[14px] sm:text-[15px] text-slate-500 max-w-lg mx-auto leading-relaxed line-clamp-2">
              {eventInfo.description}
            </p>
          )}
        </div>

        {/* Action Card */}
        <div className="bg-white rounded-[28px] p-2 shadow-xl shadow-slate-200/40 border border-slate-100/80 ring-1 ring-slate-900/5 flex flex-col max-h-full">

          {/* Segmented Control */}
          <div className="flex p-1.5 bg-slate-100/80 rounded-[22px] mb-4 shrink-0">
            <button
              onClick={() => setMode('text')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-[20px] text-[15px] font-semibold transition-all duration-300 ${mode === 'text'
                ? 'bg-white text-[#44bea9] shadow-sm ring-1 ring-slate-900/5'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
              <MessageSquare className={`w-4 h-4 ${mode === 'text' ? 'text-[#44bea9]' : 'text-slate-400'}`} />
              Written
            </button>
            <button
              onClick={() => setMode('voice')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-[20px] text-[15px] font-semibold transition-all duration-300 ${mode === 'voice'
                ? 'bg-white text-[#44bea9] shadow-sm ring-1 ring-slate-900/5'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
              <Mic className={`w-4 h-4 ${mode === 'voice' ? 'text-[#44bea9]' : 'text-slate-400'}`} />
              Voice
            </button>
          </div>

          <div className="p-3 sm:p-5 pt-0 flex-1 overflow-y-auto min-h-0">
            {mode === 'text' ? (
              <TextFeedbackInput publicToken={public_token} onSuccess={handleSuccess} />
            ) : (
              <VoiceFeedbackInput publicToken={public_token} onSuccess={handleSuccess} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center shrink-0">
          <p className="text-[12px] text-slate-400 font-medium">
            Your feedback is anonymous and helps us improve.
          </p>
        </div>
      </main>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        onSubmitAnother={handleSubmitAnother}
      />
    </div>
  );
}
