"use client";

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Filter,
  X,
  Calendar,
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
  BarChart3,
  Eye,
  Trophy,
  Users,
  GitFork,
  SearchCode,
  UserX,
  Languages,
  PlusCircle,
  RefreshCw,
  Star,
  FileCheck,
  Rocket,
  BookOpen,
  Building2,
  UserMinus,
  Circle,
} from 'lucide-react';
import {
  CATEGORY_COLORS,
  SEVERITY_COLORS,
  SOURCE_LABELS,
  EVENT_TYPES,
  type SchoolEventCategory,
  type SchoolEventSeverity,
  type SchoolEventSource,
} from '@/lib/school-events/registry';
import type { SchoolEvent } from '@/lib/school-events/types';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  SearchCode, BarChart3, TrendingUp, AlertTriangle, GitFork,
  Languages, UserX, PlusCircle, RefreshCw, Star, FileCheck,
  Eye, Rocket, Trophy, BookOpen, Building2, UserMinus, Users,
  AlertCircle, Info, Circle,
};

function EventIcon({ iconName, className }: { iconName?: string; className?: string }) {
  const Icon = (iconName && ICON_MAP[iconName]) || Circle;
  return <Icon className={className} size={14} />;
}

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
    if (isYesterday(d)) return 'Yesterday';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return iso;
  }
}

function dayLabel(iso: string): string {
  try {
    const d = new Date(iso);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMMM d, yyyy');
  } catch {
    return iso.slice(0, 10);
  }
}

function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}

// ─── Spring transition ────────────────────────────────────────────────────────

const SPRING = { type: 'spring' as const, damping: 30, stiffness: 250 };

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex flex-col items-center flex-shrink-0 w-6">
        <div className="w-3 h-3 rounded-full bg-muted animate-pulse" />
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className="flex-1 bg-card border border-border rounded-2xl p-4 space-y-2 animate-pulse">
        <div className="flex gap-2">
          <div className="h-5 w-20 bg-muted rounded-full" />
          <div className="h-5 w-14 bg-muted rounded-full" />
        </div>
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-2/3 bg-muted rounded" />
      </div>
    </div>
  );
}

// ─── Filter types ─────────────────────────────────────────────────────────────

export interface TimelineFilters {
  category?: SchoolEventCategory;
  severity?: SchoolEventSeverity;
  source_app?: SchoolEventSource;
  from?: string;
  to?: string;
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event, index }: { event: SchoolEvent; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_COLORS[event.event_category];
  const sev = SEVERITY_COLORS[event.severity];
  const def = EVENT_TYPES[event.event_type];
  const sourceLabel = SOURCE_LABELS[event.source_app] ?? event.source_app;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ ...SPRING, delay: index * 0.06 }}
      className="group relative"
    >
      <div
        className={`bg-card border border-border rounded-2xl p-4 cursor-pointer transition-all duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.3)]`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Category pill */}
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
              <EventIcon iconName={def?.icon} className={cat.text} />
              {event.event_category.replace('_', ' ')}
            </span>
            {/* Severity */}
            {event.severity !== 'info' && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sev.bg} ${sev.text} ${sev.border}`}>
                {sev.label}
              </span>
            )}
            {/* Source */}
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
              {sourceLabel}
            </span>
          </div>
          {/* Relative time */}
          <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
            {relativeTime(event.occurred_at)}
          </span>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-foreground leading-tight mb-1">
          {event.title}
        </p>

        {/* Description */}
        {event.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            {event.actor_name && (
              <span className="text-[10px] text-muted-foreground">
                {event.actor_name}
              </span>
            )}
            {event.tags?.length > 0 && (
              <div className="flex gap-1">
                {event.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
            {expanded ? (
              <>Less <ChevronUp size={12} /></>
            ) : (
              <>Details <ChevronDown size={12} /></>
            )}
          </button>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-border/50 space-y-3">
                {event.impact_summary && (
                  <div className="rounded-xl bg-muted/50 border border-border p-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Impact Summary</p>
                    <p className="text-xs text-foreground leading-relaxed">{event.impact_summary}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <p className="text-muted-foreground font-medium mb-0.5">Event type</p>
                    <p className="font-mono text-foreground text-[10px]">{event.event_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium mb-0.5">Recorded</p>
                    <p className="text-foreground">
                      {format(new Date(event.recorded_at), 'dd MMM yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                {event.evidence && (
                  <button className="flex items-center gap-1.5 text-[11px] text-primary hover:underline">
                    View evidence <ArrowRight size={11} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Category filter chips ────────────────────────────────────────────────────

const CATEGORIES: SchoolEventCategory[] = [
  'leadership', 'curriculum', 'pupil_support', 'safeguarding',
  'finance', 'intervention', 'assessment', 'data_quality',
  'staffing', 'governance',
];

const SEVERITIES: SchoolEventSeverity[] = ['info', 'low', 'medium', 'high', 'critical'];

const SOURCES: SchoolEventSource[] = [
  'trust-assessor', 'ofsted-readiness', 'lesson-studio',
  'school-intelligence', 'governance', 'system', 'manual',
];

// ─── Main Timeline ────────────────────────────────────────────────────────────

interface TimelineProps {
  events: SchoolEvent[];
  loading?: boolean;
  onFilter?: (filters: TimelineFilters) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  variant?: 'embedded' | 'full-page';
}

export function Timeline({
  events,
  loading = false,
  onFilter,
  onLoadMore,
  hasMore = false,
  variant = 'full-page',
}: TimelineProps) {
  const [filters, setFilters] = useState<TimelineFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = useCallback((key: keyof TimelineFilters, value: string | undefined) => {
    const next = { ...filters, [key]: value || undefined };
    setFilters(next);
    onFilter?.(next);
  }, [filters, onFilter]);

  const clearFilters = useCallback(() => {
    setFilters({});
    onFilter?.({});
  }, [onFilter]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  // Group events by day
  const grouped: { day: string; events: SchoolEvent[] }[] = [];
  for (const evt of events) {
    const day = evt.occurred_at.slice(0, 10);
    const last = grouped[grouped.length - 1];
    if (last && isSameDay(last.day, day)) {
      last.events.push(evt);
    } else {
      grouped.push({ day, events: [evt] });
    }
  }

  return (
    <div className={`flex flex-col gap-4 ${variant === 'embedded' ? '' : 'max-w-3xl mx-auto'}`}>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Category chips (horizontal scroll) */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const c = CATEGORY_COLORS[cat];
              const active = filters.category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => updateFilter('category', active ? undefined : cat)}
                  className={`flex-shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all duration-200 ${
                    active
                      ? `${c.bg} ${c.text} ${c.border}`
                      : 'bg-muted text-muted-foreground border-border hover:border-primary/30'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-shrink-0 p-2 rounded-xl border transition-colors ${
              showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/30'
            }`}
          >
            <Filter size={14} />
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex-shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg border border-border"
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>

        {/* Advanced filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-card border border-border rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Severity */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Severity</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SEVERITIES.map((sev) => {
                      const s = SEVERITY_COLORS[sev];
                      const active = filters.severity === sev;
                      return (
                        <button
                          key={sev}
                          onClick={() => updateFilter('severity', active ? undefined : sev)}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                            active ? `${s.bg} ${s.text} ${s.border}` : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Source */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Source</p>
                  <div className="flex flex-col gap-1">
                    {SOURCES.map((src) => {
                      const active = filters.source_app === src;
                      return (
                        <button
                          key={src}
                          onClick={() => updateFilter('source_app', active ? undefined : src)}
                          className={`text-left text-[10px] px-2 py-0.5 rounded-lg transition-all ${
                            active ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {SOURCE_LABELS[src]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Date range</p>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">From</label>
                      <input
                        type="date"
                        value={filters.from?.slice(0, 10) ?? ''}
                        onChange={(e) => updateFilter('from', e.target.value ? `${e.target.value}T00:00:00Z` : undefined)}
                        className="w-full mt-0.5 text-xs bg-muted border border-border rounded-lg px-2 py-1 text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">To</label>
                      <input
                        type="date"
                        value={filters.to?.slice(0, 10) ?? ''}
                        onChange={(e) => updateFilter('to', e.target.value ? `${e.target.value}T23:59:59Z` : undefined)}
                        className="w-full mt-0.5 text-xs bg-muted border border-border rounded-lg px-2 py-1 text-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Timeline body ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="relative">
          {/* Central vertical line */}
          <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border" />

          <div className="space-y-0">
            {grouped.map((group, gi) => {
              let cardIndex = grouped.slice(0, gi).reduce((acc, g) => acc + g.events.length, 0);
              return (
                <div key={group.day}>
                  {/* Day label */}
                  <div className="sticky top-0 py-2 bg-background/80 backdrop-blur z-10 flex items-center gap-3 mb-3">
                    <div className="w-6 flex-shrink-0" /> {/* align with dot */}
                    <div className="flex items-center gap-2">
                      <Calendar size={11} className="text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {dayLabel(group.day)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    {group.events.map((evt, ei) => {
                      const idx = cardIndex + ei;
                      const cat = CATEGORY_COLORS[evt.event_category];
                      return (
                        <div key={evt.id} className="flex gap-3 items-start">
                          {/* Dot + connector */}
                          <div className="flex flex-col items-center flex-shrink-0 mt-3.5">
                            <motion.div
                              initial={{ scale: 0 }}
                              whileInView={{ scale: 1 }}
                              viewport={{ once: true, amount: 0.5 }}
                              transition={{ ...SPRING, delay: idx * 0.06 + 0.1 }}
                              className={`w-3 h-3 rounded-full ${cat.dot} shadow-lg ring-2 ring-background z-10 relative`}
                            />
                          </div>
                          {/* Horizontal connector */}
                          <div className="flex-shrink-0 mt-[22px]">
                            <div className="w-3 h-px bg-border" />
                          </div>
                          {/* Card */}
                          <div className="flex-1 min-w-0">
                            <EventCard event={evt} index={idx} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && onLoadMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={onLoadMore}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground bg-card border border-border rounded-xl px-4 py-2 transition-colors hover:border-primary/30"
              >
                Load more events <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4">
        <Calendar className="text-muted-foreground" size={24} />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-2">No events recorded yet</h3>
      <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
        Events will appear here as Trust Assessor, Ofsted Readiness and Lesson Studio log findings for your schools.
      </p>
    </div>
  );
}
