"use client";

import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

// Module color map - aligned with planet color system from MEMORY.md
// HR=#ADD8E6 (light blue), Finance=#FFAA4C (amber), Estates=#00D4D4 (teal),
// Compliance=#E6C3FF (purple), Teaching=#FFB6C1 (pink/rose), SEND=#98FF98 (green),
// Governance=#FFD700 (gold), Improvement=#0ea5e9 (sky)
const MODULE_COLORS: Record<
  string,
  {
    iconBg: string;
    iconText: string;
    labelText: string;
    accentBg: string;
    accentText: string;
    accentBorder: string;
  }
> = {
  improvement: {
    iconBg: "bg-sky-100 dark:bg-sky-900/20",
    iconText: "text-sky-600 dark:text-sky-400",
    labelText: "text-sky-600 dark:text-sky-400",
    accentBg: "bg-sky-50 dark:bg-sky-900/10",
    accentText: "text-sky-700 dark:text-sky-300",
    accentBorder: "border-sky-200 dark:border-sky-800",
  },
  governance: {
    iconBg: "bg-amber-100 dark:bg-amber-900/20",
    iconText: "text-amber-600 dark:text-amber-400",
    labelText: "text-amber-600 dark:text-amber-400",
    accentBg: "bg-amber-50 dark:bg-amber-900/10",
    accentText: "text-amber-700 dark:text-amber-300",
    accentBorder: "border-amber-200 dark:border-amber-800",
  },
  "teaching-learning": {
    iconBg: "bg-pink-100 dark:bg-pink-900/20",
    iconText: "text-pink-600 dark:text-pink-400",
    labelText: "text-pink-600 dark:text-pink-400",
    accentBg: "bg-pink-50 dark:bg-pink-900/10",
    accentText: "text-pink-700 dark:text-pink-300",
    accentBorder: "border-pink-200 dark:border-pink-800",
  },
  estates: {
    iconBg: "bg-teal-100 dark:bg-teal-900/20",
    iconText: "text-teal-600 dark:text-teal-400",
    labelText: "text-teal-600 dark:text-teal-400",
    accentBg: "bg-teal-50 dark:bg-teal-900/10",
    accentText: "text-teal-700 dark:text-teal-300",
    accentBorder: "border-teal-200 dark:border-teal-800",
  },
  compliance: {
    iconBg: "bg-purple-100 dark:bg-purple-900/20",
    iconText: "text-purple-600 dark:text-purple-400",
    labelText: "text-purple-600 dark:text-purple-400",
    accentBg: "bg-purple-50 dark:bg-purple-900/10",
    accentText: "text-purple-700 dark:text-purple-300",
    accentBorder: "border-purple-200 dark:border-purple-800",
  },
  finance: {
    iconBg: "bg-amber-100 dark:bg-amber-900/20",
    iconText: "text-amber-600 dark:text-amber-400",
    labelText: "text-amber-600 dark:text-amber-400",
    accentBg: "bg-amber-50 dark:bg-amber-900/10",
    accentText: "text-amber-700 dark:text-amber-300",
    accentBorder: "border-amber-200 dark:border-amber-800",
  },
  hr: {
    iconBg: "bg-blue-100 dark:bg-blue-900/20",
    iconText: "text-blue-600 dark:text-blue-400",
    labelText: "text-blue-600 dark:text-blue-400",
    accentBg: "bg-blue-50 dark:bg-blue-900/10",
    accentText: "text-blue-700 dark:text-blue-300",
    accentBorder: "border-blue-200 dark:border-blue-800",
  },
  send: {
    iconBg: "bg-emerald-100 dark:bg-emerald-900/20",
    iconText: "text-emerald-600 dark:text-emerald-400",
    labelText: "text-emerald-600 dark:text-emerald-400",
    accentBg: "bg-emerald-50 dark:bg-emerald-900/10",
    accentText: "text-emerald-700 dark:text-emerald-300",
    accentBorder: "border-emerald-200 dark:border-emerald-800",
  },
  surveys: {
    iconBg: "bg-cyan-100 dark:bg-cyan-900/20",
    iconText: "text-cyan-600 dark:text-cyan-400",
    labelText: "text-cyan-600 dark:text-cyan-400",
    accentBg: "bg-cyan-50 dark:bg-cyan-900/10",
    accentText: "text-cyan-700 dark:text-cyan-300",
    accentBorder: "border-cyan-200 dark:border-cyan-800",
  },
};

export function getModuleColors(moduleId: string) {
  return MODULE_COLORS[moduleId] || MODULE_COLORS.improvement;
}

interface ModulePageHeaderProps {
  moduleId: string;
  icon: LucideIcon;
  label: string;
  title: string;
  description?: string;
  badge?: string;
  actions?: React.ReactNode;
}

export function ModulePageHeader({
  moduleId,
  icon: Icon,
  label,
  title,
  description,
  badge,
  actions,
}: ModulePageHeaderProps) {
  const colors = getModuleColors(moduleId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-start justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <div className={`p-3 ${colors.iconBg} rounded-2xl`}>
          <Icon className={`w-6 h-6 ${colors.iconText}`} />
        </div>
        <div>
          <div
            className={`flex items-center gap-2 ${colors.labelText} font-semibold text-xs uppercase tracking-[0.15em] mb-1`}
          >
            {label}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {badge && (
          <span
            className={`ml-2 mt-1 inline-flex items-center px-3 py-1 ${colors.accentBg} ${colors.accentText} rounded-full text-xs font-medium`}
          >
            {badge}
          </span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

interface ModuleAppCardProps {
  moduleId: string;
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  status?: string;
  index?: number;
}

export function ModuleAppCard({
  moduleId,
  icon: Icon,
  title,
  description,
  href,
  status,
  index = 0,
}: ModuleAppCardProps) {
  const colors = getModuleColors(moduleId);

  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="block group"
    >
      <div className="h-full p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`p-2.5 ${colors.iconBg} rounded-xl group-hover:scale-105 transition-transform duration-200`}
          >
            <Icon className={`w-5 h-5 ${colors.iconText}`} />
          </div>
          {status && (
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                status === "Live" || status === "Available Now"
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : status === "Beta" ||
                      status === "Preview" ||
                      status === "Pilot"
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {status}
            </span>
          )}
        </div>
        <h3 className="text-base font-bold text-foreground mb-1.5 group-hover:text-foreground/80 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </motion.a>
  );
}

interface ModuleFeatureBannerProps {
  moduleId: string;
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function ModuleFeatureBanner({
  moduleId,
  title,
  description,
  icon: Icon,
}: ModuleFeatureBannerProps) {
  const colors = getModuleColors(moduleId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`p-6 rounded-2xl ${colors.accentBg} border ${colors.accentBorder}`}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={`p-2.5 rounded-xl bg-card shadow-sm`}>
            <Icon className={`w-5 h-5 ${colors.iconText}`} />
          </div>
        )}
        <div>
          <h3 className={`font-bold text-base ${colors.accentText}`}>
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
