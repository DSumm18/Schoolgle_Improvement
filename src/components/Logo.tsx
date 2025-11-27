"use client";

interface LogoProps {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    className?: string;
}

const Logo = ({ size = 'md', showText = true, className = '' }: LogoProps) => {
    const sizes = {
        sm: { box: 'w-8 h-8', text: 'text-base', letter: 'text-sm' },
        md: { box: 'w-10 h-10', text: 'text-lg', letter: 'text-base' },
        lg: { box: 'w-12 h-12', text: 'text-xl', letter: 'text-lg' }
    };

    const s = sizes[size];

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className={`${s.box} rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0`}>
                <span className={`${s.letter} text-white font-bold`}>S</span>
            </div>
            {showText && (
                <span className={`${s.text} font-semibold text-gray-900`}>Schoolgle</span>
            )}
        </div>
    );
};

export default Logo;

