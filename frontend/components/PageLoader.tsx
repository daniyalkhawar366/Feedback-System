'use client';

import { Activity } from 'lucide-react';

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
            {/* Ripple logo with pulsing rings */}
            <div className="relative flex items-center justify-center">
                {/* Outer pulse ring */}
                <span
                    className="absolute w-16 h-16 rounded-[18px] bg-accent/20 animate-ping"
                    style={{ animationDuration: '1.6s' }}
                />
                {/* Inner ring */}
                <span className="absolute w-14 h-14 rounded-[16px] bg-accent/10" />
                {/* Logo square */}
                <div className="relative w-12 h-12 bg-gradient-to-br from-accent to-accent-light rounded-[13px] flex items-center justify-center shadow-lg border border-accent/20">
                    <Activity className="w-6 h-6 text-white" />
                </div>
            </div>

            {/* Brand name */}
            <div className="flex flex-col items-center gap-1">
                <span className="text-[15px] font-bold text-fg tracking-tight">Ripple</span>
                <span className="text-[13px] text-fg-secondary">{message}</span>
            </div>
        </div>
    );
}
