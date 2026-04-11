"use client";

interface SourceBadgeProps {
  name: string;
  colour: string;
  verified?: boolean;
  size?: 'sm' | 'md';
}

export function SourceBadge({ name, colour, verified, size = 'sm' }: SourceBadgeProps) {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const textSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]';

  return (
    <span className={`inline-flex items-center gap-1 ${textSize} text-muted-foreground`}>
      <span className={`${dotSize} rounded-full shrink-0`} style={{ backgroundColor: colour }} />
      {name}
      {verified && (
        <span className="px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[8px] font-bold">
          ✓
        </span>
      )}
    </span>
  );
}
