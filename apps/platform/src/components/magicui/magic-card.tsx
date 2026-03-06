"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
  spotlight?: boolean;
}

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "#1e1b4b",
  gradientOpacity = 0.8,
  spotlight = true,
}: MagicCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setCardSize({
      width: rect.width,
      height: rect.height,
    });
  };

  useEffect(() => {
    if (isHovered && cardSize.width > 0) {
      const spotlightX = (mousePosition.x / cardSize.width) * 100;
      const spotlightY = (mousePosition.y / cardSize.height) * 100;
      document.documentElement.style.setProperty(
        "--spotlight-x",
        `${spotlightX}%`,
      );
      document.documentElement.style.setProperty(
        "--spotlight-y",
        `${spotlightY}%`,
      );
    }
  }, [isHovered, mousePosition, cardSize]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white dark:bg-gray-900 transition-all duration-300",
        "hover:shadow-2xl hover:shadow-slate-500/10",
        className,
      )}
      style={
        {
          "--gradient-size": `${gradientSize}px`,
          "--gradient-color": gradientColor,
          "--gradient-opacity": gradientOpacity,
        } as React.CSSProperties
      }
      onMouseMove={spotlight ? handleMouseMove : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Spotlight effect */}
      {spotlight && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500",
            "group-hover:opacity-100",
          )}
          style={{
            background: `radial-gradient(
              circle var(--gradient-size) at var(--spotlight-x, 50%) var(--spotlight-y, 50%),
              var(--gradient-color),
              transparent 70%
            )`,
            opacity: isHovered ? "var(--gradient-opacity)" : 0,
          }}
        />
      )}

      {/* Border highlight on hover */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-500",
          "group-hover:opacity-100 opacity-0",
        )}
        style={{
          background: "linear-gradient(90deg, #6366f1, #a855f7, #6366f1)",
          backgroundSize: "200% 100%",
          padding: "2px",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          animation: isHovered ? "border-dance 2s linear infinite" : "none",
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      <style>{`
        @keyframes border-dance {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
      `}</style>
    </div>
  );
}
