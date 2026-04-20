"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { History, Clock } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { Timeline } from "@/components/school-events/Timeline";
import type { SchoolEvent } from "@/lib/school-events/types";
import type { TimelineFilters } from "@/components/school-events/Timeline";

// School name lookup from URN
const URN_NAMES: Record<string, string> = {
  '148869': 'Clayton Village Primary School',
  '146581': 'Crossley Hall Primary School',
  '144862': 'Farnham Primary School',
  '148201': 'Grove House Primary School',
  '144860': 'Hollingwood Primary School',
  '144861': 'Laycock Primary School',
  '150016': 'Lidget Green Primary School',
};

const SPRING = { type: 'spring' as const, damping: 30, stiffness: 250 };

export default function TimelinePage() {
  const { organization, session } = useAuth();

  // Read ?school=URN from URL synchronously via lazy initializer so the FIRST fetch already has it
  const [schoolUrn, setSchoolUrn] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('school');
  });
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [activeFilters, setActiveFilters] = useState<TimelineFilters>({});

  const LIMIT = 50;

  // Keep schoolUrn in sync if URL changes without a full nav
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urn = new URLSearchParams(window.location.search).get('school');
    setSchoolUrn(urn);
  }, []);

  const fetchEvents = useCallback(async (filters: TimelineFilters, offsetVal: number, append = false) => {
    // Wait for BOTH org and session — otherwise the 400 "no organisation" error fires
    if (!organization?.id || !session?.access_token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('organizationId', organization.id);
      params.set('limit', String(LIMIT));
      params.set('offset', String(offsetVal));
      if (filters.category) params.set('category', filters.category);
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.source_app) params.set('source_app', filters.source_app);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (schoolUrn) params.set('school_urn', schoolUrn);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      const res = await fetch(`/api/events?${params.toString()}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const newEvents: SchoolEvent[] = data.events ?? [];

      setEvents((prev) => append ? [...prev, ...newEvents] : newEvents);
      setHasMore(newEvents.length === LIMIT);
      setOffset(offsetVal + newEvents.length);
    } catch (err) {
      console.error('[TimelinePage] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [organization?.id, schoolUrn, session?.access_token]);

  // Initial load — waits for both org AND session token to be ready
  useEffect(() => {
    if (organization?.id && session?.access_token) {
      fetchEvents(activeFilters, 0, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id, schoolUrn, session?.access_token]);

  const handleFilter = useCallback((filters: TimelineFilters) => {
    setActiveFilters(filters);
    setOffset(0);
    fetchEvents(filters, 0, false);
  }, [fetchEvents]);

  const handleLoadMore = useCallback(() => {
    fetchEvents(activeFilters, offset, true);
  }, [fetchEvents, activeFilters, offset]);

  const schoolName = schoolUrn ? (URN_NAMES[schoolUrn] ?? `URN ${schoolUrn}`) : null;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="space-y-2"
      >
        <div className="flex items-center gap-2 text-sky-500 font-semibold text-[10px] uppercase tracking-[0.2em] bg-sky-500/10 w-fit px-3 py-1.5 rounded-full border border-sky-500/30">
          <Clock size={12} />
          School Intelligence
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
                <History className="text-sky-500" size={20} />
              </div>
              Events Timeline
            </h1>
            {schoolName && (
              <p className="text-sm text-muted-foreground mt-1 ml-[52px]">
                Filtered to: <span className="font-medium text-foreground">{schoolName}</span>
              </p>
            )}
            {!schoolName && (
              <p className="text-sm text-muted-foreground mt-1 ml-[52px]">
                All schools in your organisation
              </p>
            )}
          </div>

          {events.length > 0 && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">
                {events.length} event{events.length !== 1 ? 's' : ''}
                {hasMore ? '+' : ''}
              </span>
            </div>
          )}
        </div>
      </motion.header>

      {/* ── Timeline ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.1 }}
      >
        <Timeline
          events={events}
          loading={loading}
          onFilter={handleFilter}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          variant="full-page"
        />
      </motion.div>

    </div>
  );
}
