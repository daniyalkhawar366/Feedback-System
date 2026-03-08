'use client';

import { useState } from 'react';
import axios from 'axios';
import { Loader2, Send, AlertCircle, Quote } from 'lucide-react';
import { API_BASE_URL } from '@/utils/api';
import type { FeedbackResponse } from '@/types/api';

interface TextFeedbackInputProps {
  publicToken: string;
  onSuccess: () => void;
}

export default function TextFeedbackInput({ publicToken, onSuccess }: TextFeedbackInputProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = text.length;
  const minChars = 5;
  const maxChars = 5000;
  const isValid = charCount >= minChars && charCount <= maxChars;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setError(`Please enter between ${minChars} and ${maxChars} characters.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await axios.post<FeedbackResponse>(
        `${API_BASE_URL}/feedback/${publicToken}/text`,
        { text }
      );

      setText('');
      onSuccess();
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to submit feedback. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-fade-up h-full">
      {/* Friendly Instruction Callout */}
      <div className="bg-[#44bea9]/10 border border-[#44bea9]/20 rounded-[14px] p-3 flex gap-3 shrink-0">
        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-[#44bea9]">
          <Quote className="w-3.5 h-3.5" />
        </div>
        <div className="pt-0.5">
          <p className="text-[13.5px] font-medium text-[#2d7d6f] leading-snug">
            Share your honest thoughts.
          </p>
          <p className="text-[12.5px] text-[#328f7f]/80 mt-0.5 leading-relaxed">
            What went perfectly? What could be improved for next time?
          </p>
        </div>
      </div>

      {/* Editor Block */}
      <div className="relative group flex-1 flex flex-col min-h-[120px]">
        <textarea
          id="feedback-text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          placeholder="Start typing your feedback here…"
          className={`flex-1 w-full px-4 py-3 rounded-[16px] border-[1.5px] transition-all duration-300 resize-none
            ${error
              ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
              : 'border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:border-[#44bea9] focus:ring-4 focus:ring-[#44bea9]/10'}
            text-slate-900 placeholder:text-slate-400 text-[16px] leading-relaxed shadow-sm`}
          disabled={isSubmitting}
        />

        {/* Character Counter */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-2">
            {charCount < minChars && charCount > 0 && (
              <span className="text-[13px] font-medium text-amber-600 flex items-center gap-1.5 animate-fade-up">
                <AlertCircle className="w-3.5 h-3.5" />
                {minChars - charCount} more needed
              </span>
            )}
          </div>
          <span className={`text-[13px] font-bold tracking-wide transition-colors ${charCount > maxChars ? 'text-red-500' :
            charCount >= minChars ? 'text-[#44bea9]' : 'text-slate-300'
            }`}>
            {charCount}/{maxChars}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[14px] p-3 animate-fade-up">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-[14px] font-medium text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className={`w-full py-3.5 px-6 rounded-[16px] font-bold tracking-wide text-white transition-all duration-300 flex items-center justify-center gap-2.5 text-[15px] shadow-md shrink-0
          ${(!isValid || isSubmitting)
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            : 'bg-slate-900 hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-[0.98]'
          }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            Send Feedback
            <Send className="w-4 h-4 ml-1" />
          </>
        )}
      </button>
    </form>
  );
}
