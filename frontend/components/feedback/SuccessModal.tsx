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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] border border-white max-w-sm w-full p-8 shadow-2xl animate-in zoom-in-95 duration-300">

        {/* Animated Success Icon */}
        <div className="w-24 h-24 bg-[#44bea9]/10 rounded-[28px] mx-auto mb-6 flex items-center justify-center ring-8 ring-[#44bea9]/5 animate-pulse" style={{ animationDuration: '2.5s' }}>
          <CheckCircle2 className="w-14 h-14 text-[#44bea9]" absoluteStrokeWidth strokeWidth={2.5} />
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <h2 className="text-[28px] font-extrabold text-slate-900 tracking-tight mb-2 leading-tight">
            Thank You!
          </h2>
          <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
            Your feedback was delivered successfully. It means a lot to the organizers.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-[20px] font-bold tracking-wide transition-all duration-300 shadow-xl shadow-slate-900/20 hover:-translate-y-1 active:translate-y-0 active:scale-95"
        >
          Done
        </button>
      </div>
    </div>
  );
}
