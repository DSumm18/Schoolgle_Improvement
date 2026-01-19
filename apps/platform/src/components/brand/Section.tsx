import { cn } from "@/lib/utils";

export interface SectionProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "tight" | "full";
  container?: boolean;
}

/**
 * Section - Standard section wrapper with consistent spacing
 *
 * @example
 * // Default section with container
 * <Section>
 *   <h2>Section Title</h2>
 *   <p>Section content...</p>
 * </Section>
 *
 * @example
 * // Tight variant without container
 * <Section variant="tight" container={false}>
 *   <p>Full width content</p>
 * </Section>
 */
export function Section({
  children,
  className,
  variant = "default",
  container = true,
}: SectionProps) {
  const spacingStyles = {
    default: "py-32 px-6",
    tight: "py-24 px-6",
    full: "py-32 px-6",
  };

  return (
    <section
      className={cn(
        "bg-background",
        spacingStyles[variant],
        className
      )}
    >
      {container ? (
        <div className="max-w-7xl mx-auto">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}
