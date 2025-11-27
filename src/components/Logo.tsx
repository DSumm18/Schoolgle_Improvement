"use client";

import SchoolgleAnimatedLogo from './SchoolgleAnimatedLogo';

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    className?: string;
    variant?: 'full' | 'icon-only' | 'animated';
}

const Logo = ({ size = 'md', showText = true, className = '', variant = 'icon-only' }: LogoProps) => {
    // Animated variant (for hero sections, landing pages)
    if (variant === 'animated') {
        const animatedSizes = {
            sm: 300,
            md: 400,
            lg: 520
        };
        return (
            <SchoolgleAnimatedLogo 
                size={animatedSizes[size]} 
                className={className}
                showText={showText}
            />
        );
    }

    // Size mappings for the full logo
    const logoSizes = {
        sm: { width: 120, height: 50 },
        md: { width: 180, height: 75 },
        lg: { width: 240, height: 100 }
    };

    const iconSizes = {
        sm: { box: 'w-8 h-8', text: 'text-sm' },
        md: { box: 'w-10 h-10', text: 'text-base' },
        lg: { box: 'w-12 h-12', text: 'text-lg' }
    };

    // Icon-only variant (compact, for headers)
    if (variant === 'icon-only') {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                <div className={`${iconSizes[size].box} rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0`}>
                    <span className={`${iconSizes[size].text} text-white dark:text-gray-900 font-bold`}>S</span>
                </div>
                {showText && (
                    <span className={`${iconSizes[size].text} font-semibold text-gray-900 dark:text-white`}>Schoolgle</span>
                )}
            </div>
        );
    }

    // Full logo with planets (for hero sections, landing pages)
    const logoSize = logoSizes[size];
    
    return (
        <div className={`flex items-center ${className}`}>
            <svg 
                width={logoSize.width} 
                height={logoSize.height} 
                viewBox="0 0 1200 500"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
            >
                {/* Planets (fixed colors, subtle opacity) */}
                <circle cx="180" cy="120" r="12" fill="#ADD8E6" opacity="0.6"/>
                <circle cx="300" cy="90" r="14" fill="#FFAA4C" opacity="0.6"/>
                <circle cx="460" cy="140" r="16" fill="#00D4D4" opacity="0.6"/>
                <circle cx="720" cy="110" r="14" fill="#E6C3FF" opacity="0.6"/>
                <circle cx="900" cy="160" r="16" fill="#FFB6C1" opacity="0.6"/>
                <circle cx="1040" cy="210" r="18" fill="#FFD700" opacity="0.6"/>
                <circle cx="600" cy="360" r="14" fill="#98FF98" opacity="0.6"/>
                
                {/* Wordmark using currentColor for automatic light/dark mode */}
                {showText && (
                    <text 
                        x="600" 
                        y="285" 
                        textAnchor="middle"
                        fontSize="110"
                        fontFamily="Inter, system-ui, -apple-system, sans-serif"
                        fontWeight="600"
                        fill="currentColor"
                        className="text-gray-900 dark:text-white"
                    >
                        Schoolgle
                    </text>
                )}
            </svg>
        </div>
    );
};

export default Logo;
