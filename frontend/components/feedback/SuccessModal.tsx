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
      <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-8 animate-in zoom-in duration-300">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>

        {/* Success Message */}
        <h2
          className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-3"
          style={{ letterSpacing: '-0.03em' }}
        >
          Thank You!
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Your feedback has been successfully submitted. Your input helps us create better experiences!
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
        >
          Done
        </button>
      </div>
    </div>
  );
}
