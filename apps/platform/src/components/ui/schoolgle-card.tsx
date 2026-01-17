"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { tokens, getModuleColor, getModuleGlow } from "@/theme/tokens";

interface SchoolgleCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "glass";
  module?: keyof typeof tokens.moduleColors;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export function SchoolgleCard({ 
  children, 
  className, 
  variant = "primary", 
  module,
  hover = true,
  glow = false,
  onClick 
}: SchoolgleCardProps) {
  const baseClasses = "rounded-2xl transition-all duration-300";
  
  const variantClasses = {
    primary: "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-soft",
    secondary: "bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-600 shadow-soft",
    glass: tokens.glass.dark
  };

  const moduleStyles = module ? {
    borderColor: getModuleColor(module) + "40",
    boxShadow: glow ? getModuleGlow(module) : undefined
  } : {};

  const hoverClasses = hover ? "hover:scale-[1.02] hover:shadow-medium" : "";

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        hoverClasses,
        className
      )}
      style={moduleStyles}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Specialized card components
export function ModuleCard({ 
  title, 
  description, 
  module, 
  icon, 
  className,
  onClick 
}: {
  title: string;
  description: string;
  module: keyof typeof tokens.moduleColors;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const moduleColor = getModuleColor(module);
  
  return (
    <SchoolgleCard 
      module={module} 
      glow={true} 
      className={cn("p-6 cursor-pointer", className)}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: moduleColor + "20" }}
          >
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 
            className="text-xl font-semibold mb-2"
            style={{ color: moduleColor }}
          >
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </SchoolgleCard>
  );
}

export function StatsCard({ 
  value, 
  label, 
  module, 
  className 
}: {
  value: string;
  label: string;
  module?: keyof typeof tokens.moduleColors;
  className?: string;
}) {
  return (
    <SchoolgleCard 
      module={module} 
      variant="glass" 
      className={cn("p-6 text-center", className)}
    >
      <div 
        className="text-3xl font-bold mb-2"
        style={{ color: module ? getModuleColor(module) : undefined }}
      >
        {value}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </SchoolgleCard>
  );
}
