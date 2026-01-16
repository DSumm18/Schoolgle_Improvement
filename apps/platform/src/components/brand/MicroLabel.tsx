import { cn } from "@/lib/utils";

export interface MicroLabelProps {
  children: React.ReactNode;
  className?: string;
  color?: "accent" | "amber" | "muted";
}

/**
 * MicroLabel - Small uppercase labels for badges, tags, status indicators
 *
 * @example
 * // Accent color (default)
 * <MicroLabel>New Feature</MicroLabel>
 *
 * @example
 * // Amber color
 * <MicroLabel color="amber">Coming Soon</MicroLabel>
 *
 * @example
 * // Muted color
 * <MicroLabel color="muted">Draft</MicroLabel>
 */
export function MicroLabel({
  children,
  className,
  color = "accent",
}: MicroLabelProps) {
  const colorStyles = {
    accent: "text-brand-accent",
    amber: "text-brand-amber",
    muted: "text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "text-[10px] font-black uppercase tracking-[0.2em]",
        colorStyles[color],
        className
      )}
    >
      {children}
    </span>
  );
}
