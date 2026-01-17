import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

interface ComingSoonBadgeProps {
  variant?: "default" | "secondary" | "outline"
  size?: "default" | "sm" | "lg"
}

export function ComingSoonBadge({ variant = "secondary", size = "default" }: ComingSoonBadgeProps) {
  const sizeClasses = {
    sm: "text-xs py-0.5 px-2",
    default: "text-sm py-1 px-2.5",
    lg: "text-base py-1.5 px-3"
  }

  return (
    <Badge
      variant={variant}
      className={`inline-flex items-center gap-1 ${sizeClasses[size]}`}
    >
      <Sparkles className="h-3 w-3" />
      Coming Soon
    </Badge>
  )
}
