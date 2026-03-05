'use client';

import { cn } from '@/lib/utils';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  borderWidth = 1.5,
  colorFrom = '#ffaa40',
  colorTo = '#9c40ff',
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      style={
        {
          '--size': `${size}px`,
          '--duration': `${duration}s`,
          '--border-width': `${borderWidth}px`,
          '--color-from': colorFrom,
          '--color-to': colorTo,
          '--delay': `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]',
        className,
      )}
    >
      <div
        className="absolute inset-0 size-full"
        style={{
          background: `conic-gradient(from calc(270deg + var(--angle) * 360deg), transparent 0%, var(--color-from) 10%, var(--color-to) 50%, transparent 60%)`,
          animation: 'border-beam var(--duration) linear infinite',
          animationDelay: 'var(--delay)',
          mask: `
            linear-gradient(to right, transparent, black 10%, black 90%, transparent)
          `,
          WebkitMask: `
            linear-gradient(to right, transparent, black 10%, black 90%, transparent)
          `,
        }}
      />

      <style>{`
        @keyframes border-beam {
          from {
            --angle: 0deg;
          }
          to {
            --angle: 360deg;
          }
        }

        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
      `}</style>
    </div>
  );
}
