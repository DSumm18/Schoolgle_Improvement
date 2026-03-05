'use client';

import { cn } from '@/lib/utils';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function ShimmerButton({
  children,
  className,
  shimmerColor = '#ffffff',
  shimmerSize = '0.1em',
  borderRadius = '0.75rem',
  shimmerDuration = '3s',
  background = 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
  type = 'button',
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap rounded-[var(--border-radius)] border-0 px-6 py-2 text-sm font-medium text-white transition-all duration-300',
        'active:scale-95',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      style={
        {
          '--border-radius': borderRadius,
          '--shimmer-color': shimmerColor,
          '--shimmer-size': shimmerSize,
          '--shimmer-duration': shimmerDuration,
          '--background': background,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'var(--background)' }}
      />

      {/* Shimmer effect */}
      <div
        className="absolute inset-0 z-10 size-full overflow-hidden rounded-[var(--border-radius)]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
      >
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer"
          style={{
            background: `linear-gradient(90deg, transparent, var(--shimmer-color), transparent)`,
            backgroundSize: 'var(--shimmer-size) 100%',
            animationDuration: 'var(--shimmer-duration)',
          }}
        />
      </div>

      {/* Button content */}
      <span className="relative z-20">{children}</span>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </button>
  );
}
