'use client';

import { BrandLogo } from '@/components/BrandLogo';

interface PageLoaderProps {
    message?: string;
    fullScreen?: boolean;
}

/**
 * Branded loading screen using the Ripple logo (Activity icon).
 * Can be used as a full-page overlay or inline.
 */
export default function PageLoader({ message = 'Loading…', fullScreen = true }: PageLoaderProps) {
    const containerClass = fullScreen
        ? "fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-bg"
        : "flex flex-col items-center justify-center gap-5 min-h-[400px] w-full bg-bg/50 rounded-[20px]";

    return (
        <div className={containerClass}>
            {/* Logo with pulsing rings */}
            <div className="relative flex items-center justify-center">
                {/* Outer pulse ring */}
                <span
                    className="absolute w-20 h-20 rounded-[18px] bg-accent/20 animate-ping"
                    style={{ animationDuration: '1.6s' }}
                />
                {/* Inner ring */}
                <span className="absolute w-16 h-16 rounded-[16px] bg-accent/10" />
                {/* Brand Logo inside */}
                <div className="relative z-10 drop-shadow-lg flex items-center justify-center bg-white/5 p-1 rounded-xl glass-panel">
                    <BrandLogo size={56} showText={false} />
                </div>
            </div>

            {/* Brand name */}
            <div className="flex flex-col items-center gap-1 mt-2">
                <span className="text-[20px] font-bold text-fg tracking-tight">
                    QR<span className="bg-gradient-to-br from-[#44bea9] to-[#328f7f] bg-clip-text text-transparent">AI</span>
                </span>
                <span className="text-[13px] text-fg-secondary">{message}</span>
            </div>
        </div>
    );
}
