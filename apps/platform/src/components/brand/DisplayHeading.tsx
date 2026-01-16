import { cn } from "@/lib/utils";

export interface DisplayHeadingProps {
  children: React.ReactNode;
  className?: string;
  size?: "h1" | "h2" | "h3";
  accent?: boolean;
}

/**
 * DisplayHeading - Large editorial headings for hero sections and major titles
 *
 * @example
 * // H1 (hero size)
 * <DisplayHeading size="h1">
 *   Inspection<br />
 *   <DisplayHeading accent>Ready.</DisplayHeading>
 * </DisplayHeading>
 *
 * @example
 * // H2 with accent
 * <DisplayHeading size="h2" accent>
 *   Module Name
 * </DisplayHeading>
 *
 * @example
 * // H3
 * <DisplayHeading size="h3">
 *   Section Title
 * </DisplayHeading>
 */
export function DisplayHeading({
  children,
  className,
  size = "h1",
  accent = false,
}: DisplayHeadingProps) {
  const sizeStyles = {
    h1: "text-6xl md:text-[110px] lg:text-[130px]",
    h2: "text-4xl md:text-6xl",
    h3: "text-2xl md:text-4xl",
  };

  return (
    <span
      className={cn(
        "font-black outfit uppercase tracking-tighter",
        sizeStyles[size],
        accent && "text-brand-accent italic",
        !accent && "text-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}
