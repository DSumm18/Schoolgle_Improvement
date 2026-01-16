import { cn } from "@/lib/utils";

export interface OrbitCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  variant?: "glass" | "solid";
}

/**
 * OrbitCard - Tactile card component with hover effects
 *
 * @example
 * // Interactive glass card (default)
 * <OrbitCard>
 *   <h3>Card Title</h3>
 *   <p>Card content...</p>
 * </OrbitCard>
 *
 * @example
 * // Non-interactive solid variant
 * <OrbitCard interactive={false} variant="solid">
 *   <h3>Static Card</h3>
 * </OrbitCard>
 */
export function OrbitCard({
  children,
  className,
  interactive = true,
  variant = "glass",
}: OrbitCardProps) {
  const variantStyles = {
    glass: "glass-card",
    solid: "bg-card border border-border",
  };

  const interactiveStyles = interactive
    ? "hover:border-ring/50 hover:-translate-y-1 transition-all duration-500 cursor-pointer"
    : "cursor-default";

  return (
    <div
      className={cn(
        "rounded-[2rem] p-8",
        variantStyles[variant],
        interactiveStyles,
        className
      )}
    >
      {children}
    </div>
  );
}
