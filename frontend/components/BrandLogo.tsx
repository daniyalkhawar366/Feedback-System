import React from 'react';

interface BrandLogoProps {
    size?: number;
    showText?: boolean;
}

export function BrandLogo({ size = 48, showText = true }: BrandLogoProps) {
    return (
        <div className={`flex items-center gap-3 ${showText ? '' : 'justify-center'}`} style={{ display: 'inline-flex' }}>
            <div
                style={{
                    width: size,
                    height: size,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
                    <defs>
                        <linearGradient id="gradBrand" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#44bea9" />
                            <stop offset="100%" stopColor="#328f7f" />
                        </linearGradient>
                    </defs>

                    <g fill="url(#gradBrand)">
                        <path fillRule="evenodd" d="M10 10 h30 v30 h-30 z m10 10 v10 h10 v-10 z" />
                        <path fillRule="evenodd" d="M10 60 h30 v30 h-30 z m10 10 v10 h10 v-10 z" />
                        <rect x="10" y="45" width="10" height="10" />
                        <rect x="25" y="45" width="10" height="10" />
                        <rect x="45" y="60" width="10" height="10" />
                        <rect x="45" y="75" width="10" height="10" />
                        <rect x="60" y="60" width="10" height="10" />
                        <rect x="60" y="75" width="10" height="10" />
                        <rect x="75" y="60" width="10" height="10" />
                        <rect x="75" y="75" width="10" height="10" />
                        <rect x="45" y="10" width="10" height="10" />
                        <rect x="45" y="25" width="10" height="10" />
                        <rect x="45" y="40" width="10" height="10" />
                        <rect x="60" y="15" width="10" height="10" />
                        <rect x="60" y="30" width="10" height="10" />
                        <rect x="60" y="45" width="10" height="10" />
                    </g>

                    <g fill="none" stroke="url(#gradBrand)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M55 15 h10 l10 -10 h12" />
                        <path d="M70 20 h5 l10 -10 h9" />
                        <path d="M55 30 h15 l10 10 h14" />
                        <path d="M70 35 h5 l5 -5 h9" />
                        <path d="M70 50 h19" />
                    </g>

                    <g fill="#fff" stroke="url(#gradBrand)" strokeWidth="3">
                        <circle cx="87" cy="5" r="4" />
                        <circle cx="94" cy="10" r="4" />
                        <circle cx="94" cy="40" r="4" />
                        <circle cx="89" cy="30" r="4" />
                        <circle cx="89" cy="50" r="4" />
                    </g>
                </svg>
            </div>
            {showText && (
                <div
                    style={{
                        fontSize: size * 0.65,
                        fontWeight: 700,
                        color: 'inherit',
                        letterSpacing: '-0.04em',
                        lineHeight: 1.1,
                        userSelect: 'none'
                    }}
                >
                    QR<span style={{
                        background: 'linear-gradient(135deg, #44bea9 0%, #328f7f 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>AI</span>
                </div>
            )}
        </div>
    );
}
