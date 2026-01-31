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
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-300">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-600/30">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>

        {/* Success Message */}
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">
          Thank You!
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Your feedback has been successfully submitted. Your input helps us create better experiences!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onSubmitAnother}
            className="flex-1 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors active:scale-[0.98] shadow-lg shadow-blue-600/30"
          >
            Submit Another
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-4 px-6 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-xl font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
