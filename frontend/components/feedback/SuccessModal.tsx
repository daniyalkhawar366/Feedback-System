'use client';

import { CheckCircle2 } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAnother: () => void;
}

export default function SuccessModal({ isOpen, onClose, onSubmitAnother }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#e8e5df] max-w-md w-full p-8 animate-in zoom-in duration-300">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-[#2d7a3a] rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>

        {/* Success Message */}
        <h2
          className="text-2xl md:text-3xl font-medium text-center text-[#1a1917] mb-3"
          style={{ fontFamily: "'Instrument Serif', serif", letterSpacing: '-0.01em' }}
        >
          Thank You!
        </h2>
        <p className="text-center text-[#6b6760] mb-8">
          Your feedback has been successfully submitted. Your input helps us create better experiences!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onSubmitAnother}
            className="flex-1 py-4 px-6 bg-[#1a1917] hover:bg-[#333] text-white rounded-xl font-semibold transition-colors active:scale-[0.98]"
          >
            Submit Another
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-4 px-6 bg-[#f0ede8] hover:bg-[#e8e5df] text-[#1a1917] rounded-xl font-semibold transition-colors border border-[#e8e5df]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
