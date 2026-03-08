'use client';

import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-16 h-8 rounded-full bg-card-bg border border-card-border" />;
    }

    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className={`
        relative w-16 h-8 rounded-full transition-colors duration-500 ease-in-out
        flex items-center px-1 border border-glass-border shadow-sm overflow-hidden
        ${isDark ? 'bg-[#1a1a1a]' : 'bg-white hover:bg-gray-50'}
      `}
            aria-label="Toggle theme"
        >
            <div
                className={`absolute inset-0 bg-blue-500/10 transition-opacity duration-500 ${isDark ? 'opacity-0' : 'opacity-100'}`}
            />
            <div
                className={`absolute inset-0 bg-[#00d4aa]/10 transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Track Icons */}
            <div className="absolute w-full flex justify-between px-2 text-fg-secondary">
                <Moon className={`w-3.5 h-3.5 z-0 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
                <Sun className={`w-3.5 h-3.5 z-0 transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`} />
            </div>

            {/* Thumb */}
            <div
                className={`
          relative w-6 h-6 rounded-full shadow-md z-10 flex items-center justify-center
          transition-transform duration-500 drop-shadow-sm
          ${isDark ? 'bg-[#2a2a2a] translate-x-8' : 'bg-white translate-x-0 border border-gray-100'}
        `}
                style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
                {isDark ? (
                    <Moon className={`w-3.5 h-3.5 text-[#00d4aa] transition-opacity duration-300 opacity-100`} />
                ) : (
                    <Sun className={`w-3.5 h-3.5 text-[#44bea9] transition-opacity duration-300 opacity-100`} />
                )}
            </div>
        </button>
    );
}
