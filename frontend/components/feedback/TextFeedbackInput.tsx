'use client';

import { useState } from 'react';
import axios from 'axios';
import { Loader2, Send, AlertCircle } from 'lucide-react';
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Instructions */}
      <div className="bg-[#fafaf8] border border-[#e8e5df] rounded-xl p-4">
        <p className="text-sm text-[#1a1917] flex items-start gap-2">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>
            Share your honest feedback about the event. Your input helps us improve future experiences!
          </span>
        </p>
      </div>

      {/* Text Area */}
      <div>
        <label htmlFor="feedback-text" className="block text-sm font-medium text-[#1a1917] mb-2">
          Your Feedback
        </label>
        <textarea
          id="feedback-text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          placeholder="Share your thoughts, suggestions, or concerns..."
          rows={8}
          className={`w-full px-4 py-3 rounded-xl border ${
            error
              ? 'border-[#fecaca] focus:ring-[#b91c1c] focus:border-[#b91c1c]'
              : 'border-[#e8e5df] focus:ring-[#1a1917] focus:border-[#1a1917]'
          } bg-white text-[#1a1917] placeholder-[#9e9a93] focus:outline-none focus:ring-2 transition-colors resize-none text-base`}
          disabled={isSubmitting}
        />
        
        {/* Character Counter */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {charCount < minChars && charCount > 0 && (
              <span className="text-xs text-[#b45309] flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {minChars - charCount} more characters needed
              </span>
            )}
          </div>
          <span className={`text-sm font-medium ${
            charCount > maxChars
              ? 'text-[#b91c1c]'
              : charCount >= minChars
              ? 'text-[#2d7a3a]'
              : 'text-[#6b6760]'
          }`}>
            {charCount} / {maxChars}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#b91c1c] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#991b1b]">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 text-base md:text-lg ${
          !isValid || isSubmitting
            ? 'bg-[#d1d0cc] text-[#6b6760] cursor-not-allowed'
            : 'bg-[#1a1917] hover:bg-[#333] active:scale-[0.98]'
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span>Submitting...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            <span>Submit Feedback</span>
          </>
        )}
      </button>

      {/* Privacy Note */}
      <p className="text-xs text-center text-[#6b6760]">
        Your feedback is anonymous and will be used to improve future events.
      </p>
    </form>
  );
}
