"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Shield, ShieldCheck, Eye, Wifi, Heart, Brain, HeartPulse,
  Cross, Baby, Flame, HardHat, Map, Lock, FileCheck,
  Flower2, Compass, GraduationCap, Settings, Building
} from "lucide-react";
import { ConnectorCategory } from "@/lib/connectors/types";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Shield, ShieldCheck, Eye, Wifi, Heart, Brain, HeartPulse,
  Cross, Baby, Flame, HardHat, Map, Lock, FileCheck,
  Flower2, Compass, GraduationCap, Settings, Building,
};

const CATEGORY_COLORS: Record<ConnectorCategory, string> = {
  safeguarding: "#dc2626",
  send: "#2563eb",
  health_safety: "#f59e0b",
  data_governance: "#7c3aed",
  curriculum: "#16a34a",
  estates: "#0891b2",
  custom: "#6b7280",
};

interface ConnectorBadgeProps {
  name: string;
  category: ConnectorCategory;
  icon?: string | null;
  color?: string | null;
  isPrimary?: boolean;
  isStatutory?: boolean;
  scope?: string;
  trainingExpiry?: string | null;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  animated?: boolean;
  delay?: number;
}

export function ConnectorBadge({
  name,
  category,
  icon,
  color,
  isPrimary = true,
  isStatutory = false,
  scope,
  trainingExpiry,
  size = "md",
  onClick,
  animated = true,
  delay = 0,
}: ConnectorBadgeProps) {
  const badgeColor = color || CATEGORY_COLORS[category];
  const IconComponent = icon ? ICON_MAP[icon] : ICON_MAP.Settings;

  const trainingStatus = getTrainingStatus(trainingExpiry);

  const sizeClasses = {
    sm: "px-2 py-1 text-xs gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-sm gap-2",
  };

  const iconSizes = { sm: 12, md: 14, lg: 16 };

  const badge = (
    <div
      onClick={onClick}
      className={`
        inline-flex items-center ${sizeClasses[size]} rounded-full
        border transition-all
        ${onClick ? "cursor-pointer hover:shadow-md hover:scale-105" : ""}
      `}
      style={{
        borderColor: `${badgeColor}40`,
        backgroundColor: `${badgeColor}10`,
      }}
    >
      <div
        className="rounded-full p-0.5"
        style={{ color: badgeColor }}
      >
        {IconComponent && <IconComponent size={iconSizes[size]} />}
      </div>
      <span className="font-medium text-foreground">
        {name}
        {!isPrimary && (
          <span className="text-muted-foreground font-normal"> (Deputy)</span>
        )}
      </span>
      {scope && scope !== "whole school" && (
        <span className="text-muted-foreground text-xs">
          · {scope}
        </span>
      )}
      {trainingStatus === "expired" && (
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}
      {trainingStatus === "expiring" && (
        <span className="w-2 h-2 rounded-full bg-amber-500" />
      )}
    </div>
  );

  if (!animated) return badge;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 25 }}
    >
      {badge}
    </motion.div>
  );
}

function getTrainingStatus(expiryDate: string | null | undefined): "current" | "expiring" | "expired" | "none" {
  if (!expiryDate) return "none";
  const expiry = new Date(expiryDate);
  const now = new Date();
  const ninetyDays = new Date();
  ninetyDays.setDate(ninetyDays.getDate() + 90);

  if (expiry < now) return "expired";
  if (expiry <= ninetyDays) return "expiring";
  return "current";
}
