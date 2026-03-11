"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Edit3,
  Trash2,
  Check,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Music,
  Trophy,
  Megaphone,
  Eye,
  EyeOff,
  Star,
  Bus,
  ClipboardCheck,
  Shield,
  Briefcase,
  UserCheck,
  PartyPopper,
  HeartHandshake,
  DoorClosed,
  MoreHorizontal,
  Filter,
  ExternalLink,
  Save,
  RefreshCw,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";

// ─── Types ──────────────────────────────────────────────────────────

interface Term {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  school_days: number;
  order_index: number;
}

interface SchoolEvent {
  id: string;
  title: string;
  event_type: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  location: string | null;
  description: string | null;
  year_groups: string[];
  visibility: string;
  recurring: string | null;
  created_by: string;
}

interface ParentsEveningSlot {
  id: string;
  event_id: string;
  teacher_name: string;
  start_time: string;
  end_time: string;
  status: "available" | "booked" | "completed" | "no_show";
  parent_name: string | null;
  pupil_name: string | null;
  notes: string | null;
}

interface SlotSummary {
  total_slots: number;
  booked: number;
  completed?: number;
  no_show?: number;
  available: number;
  percent_booked: number;
  teachers: string[];
}

// ─── Constants ──────────────────────────────────────────────────────

const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; bgColor: string }
> = {
  inset_day: {
    label: "INSET Day",
    icon: BookOpen,
    color: "text-amber-700",
    bgColor: "bg-amber-100",
  },
  parents_evening: {
    label: "Parents' Evening",
    icon: Users,
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  open_day: {
    label: "Open Day",
    icon: DoorClosed,
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
  school_trip: {
    label: "School Trip",
    icon: Bus,
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  sports_day: {
    label: "Sports Day",
    icon: Trophy,
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
  concert: {
    label: "Concert",
    icon: Music,
    color: "text-pink-700",
    bgColor: "bg-pink-100",
  },
  assembly: {
    label: "Assembly",
    icon: Megaphone,
    color: "text-indigo-700",
    bgColor: "bg-indigo-100",
  },
  exam: {
    label: "Exam",
    icon: ClipboardCheck,
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
  assessment_week: {
    label: "Assessment Week",
    icon: ClipboardCheck,
    color: "text-red-700",
    bgColor: "bg-red-50",
  },
  inspection: {
    label: "Inspection",
    icon: Shield,
    color: "text-red-800",
    bgColor: "bg-red-100",
  },
  governor_meeting: {
    label: "Governor Meeting",
    icon: Briefcase,
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  },
  staff_meeting: {
    label: "Staff Meeting",
    icon: UserCheck,
    color: "text-teal-700",
    bgColor: "bg-teal-100",
  },
  celebration: {
    label: "Celebration",
    icon: PartyPopper,
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  fundraiser: {
    label: "Fundraiser",
    icon: HeartHandshake,
    color: "text-emerald-700",
    bgColor: "bg-emerald-100",
  },
  closure: {
    label: "Closure",
    icon: DoorClosed,
    color: "text-gray-700",
    bgColor: "bg-gray-200",
  },
  other: {
    label: "Other",
    icon: MoreHorizontal,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const YEAR_GROUPS = [
  "N",
  "R",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
];

// ─── Helper Functions ───────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // Returns 0=Mon, 1=Tue, ..., 6=Sun (ISO week)
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

// ─── Demo Data (embedded for offline/demo mode) ─────────────────────

const DEMO_TERMS: Term[] = [
  {
    id: "t1",
    name: "Autumn 1",
    start_date: "2025-09-03",
    end_date: "2025-10-24",
    school_days: 38,
    order_index: 1,
  },
  {
    id: "t2",
    name: "Autumn 2",
    start_date: "2025-11-03",
    end_date: "2025-12-19",
    school_days: 35,
    order_index: 2,
  },
  {
    id: "t3",
    name: "Spring 1",
    start_date: "2026-01-06",
    end_date: "2026-02-13",
    school_days: 29,
    order_index: 3,
  },
  {
    id: "t4",
    name: "Spring 2",
    start_date: "2026-02-23",
    end_date: "2026-04-01",
    school_days: 28,
    order_index: 4,
  },
  {
    id: "t5",
    name: "Summer 1",
    start_date: "2026-04-20",
    end_date: "2026-05-22",
    school_days: 24,
    order_index: 5,
  },
  {
    id: "t6",
    name: "Summer 2",
    start_date: "2026-06-01",
    end_date: "2026-07-22",
    school_days: 36,
    order_index: 6,
  },
];

const DEMO_EVENTS: SchoolEvent[] = [
  {
    id: "e1",
    title: "INSET Day - Staff Training",
    event_type: "inset_day",
    start_date: "2025-09-01",
    end_date: "2025-09-01",
    start_time: "08:30",
    end_time: "16:00",
    all_day: true,
    location: "Main Hall",
    description:
      "Whole school staff training - safeguarding update and curriculum planning",
    year_groups: [],
    visibility: "staff",
    recurring: null,
    created_by: "demo",
  },
  {
    id: "e2",
    title: "INSET Day - Assessment Moderation",
    event_type: "inset_day",
    start_date: "2025-09-02",
    end_date: "2025-09-02",
    start_time: "08:30",
    end_time: "16:00",
    all_day: true,
    location: "Main Hall",
    description: "Assessment moderation and data analysis day",
    year_groups: [],
    visibility: "staff",
    recurring: null,
    created_by: "demo",
  },
  {
    id: "e3",
    title: "Year 6 Residential Trip",
    event_type: "school_trip",
    start_date: "2025-10-06",
    end_date: "2025-10-08",
    start_time: "07:30",
    end_time: "17:00",
    all_day: false,
    location: "PGL Liddington",
    description: "Three-day residential trip for Year 6",
    year_groups: ["6"],
    visibility: "public",
    recurring: null,
    created_by: "demo",
  },
  {
    id: "e4",
    title: "Harvest Festival Assembly",
    event_type: "assembly",
    start_date: "2025-10-17",
    end_date: "2025-10-17",
    start_time: "09:15",
    end_time: "10:00",
    all_day: false,
    location: "Main Hall",
    description: "Whole school harvest festival. Parents welcome.",
    year_groups: [],
    visibility: "public",
    recurring: null,
    created_by: "demo",
  },
  {
    id: "e5",
    title: "Parents' Evening - Autumn",
    event_type: "parents_evening",
    start_date: "2025-11-12",
    end_date: "2025-11-12",
    start_time: "15:30",
    end_time: "19:00",
    all_day: false,
    location: "Classrooms",
    description: "Autumn term parents' evening for all year groups",
    year_groups: [],
    visibility: "public",
    recurring: null,
    created_by: "demo",
  },
  {
    id: "e6",
    title: "Christmas Concert - KS1",
    event_type: "concert",
    start_date: "2025-12-10",
    end_date: "2025-12-10",
    start_time: "14:00",
    end_time: "15:00",
    all_day: false,
    location: "Main Hall",
    description: "Key Stage 1 Christmas concert performance",
    year_groups: ["R", "1", "2"],
    visibility: "public",
    recurring: null,
    created_by: "demo",
  },
  {
    id: "e7",
    title: "Christmas Concert - KS2",
    event_type: "concert",
    start_date: "2025-12-11",
    end_date: "2025-12-11",
    start_time: "14:00",
    end_time: "15:00",
    all_day: false,
    location: "Main Hall",
    description: "Key Stage 2 Christmas concert performance",
    year_groups: ["3", "4", "5", "6"],
    visibility: "public",
    recurring: null,
    created_by: "demo",
  },
  {
    id: "e8",
    title: "INSET Day",
    event_type: "inset_day",
    start_date: "2026-01-05",
    end_date: "2026-01-05",
    start_time: "08:30",
    end_time: "16:00",
    all_day: true,
    location: "Main Hall",
    description: "Spring term INSET day",
    year_groups: [],
    visibility: "staff",
    recurring: null,
    created_by: "demo",
  },
  {
    id: "e9",
    title: "Governor Meeting",
    event_type: "governor_meeting",
    start_date: "2026-01-22",
    end_date: "2026-01-22",
    start_time: "17:00",
    end_time: "19:00",
    all_day: false,
    location: "Headteacher's Office",
    description: "Full governing body meeting",
    year_groups: [],
    visibility: "staff",
    recurring: null,
    created_by: "demo",
  },
  {
    id: "e10",
    title: "Assessment Week - Spring",
    event_type: "assessment_week",
    start_date: "2026-02-09",
    end_date: "2026-02-13",
    start_time: null,
    end_time: null,
    all_day: true,
    location: null,
    description: "Spring term assessment window for Years 1-6",
    year_groups: ["1", "2", "3", "4", "5", "6"],
    visibility: "staff",
    recurring: null,
    created_by: "demo",
  },
  {
    id: "e11",
    title: "Parents' Evening - Spring",
    event_type: "parents_evening",
    start_date: "2026-03-18",
    end_date: "2026-03-18",
    start_time: "15:30",
    end_time: "19:00",
    all_day: false,
    location: "Classrooms",
    description: "Spring term parents' evening",
    year_groups: [],
    visibility: "public",
    recurring: null,
    created_by: "demo",
  },
  {
    id: "e12",
    title: "INSET Day",
    event_type: "inset_day",
    start_date: "2026-04-20",
    end_date: "2026-04-20",
    start_time: "08:30",
    end_time: "16:00",
    all_day: true,
    location: "Main Hall",
    description: "Summer term INSET day",
    year_groups: [],
    visibility: "staff",
    recurring: null,
    created_by: "demo",
  },
  {
    id: "e13",
    title: "Sports Day",
    event_type: "sports_day",
    start_date: "2026-06-19",
    end_date: "2026-06-19",
    start_time: "09:30",
    end_time: "15:00",
    all_day: false,
    location: "School Field",
    description: "Annual sports day - parents welcome from 12:30",
    year_groups: [],
    visibility: "public",
    recurring: null,
    created_by: "demo",
  },
  {
    id: "e14",
    title: "Year 6 Leavers' Assembly",
    event_type: "celebration",
    start_date: "2026-07-17",
    end_date: "2026-07-17",
    start_time: "14:00",
    end_time: "15:30",
    all_day: false,
    location: "Main Hall",
    description: "Year 6 leavers' celebration assembly. Parents invited.",
    year_groups: ["6"],
    visibility: "public",
    recurring: null,
    created_by: "demo",
  },
  {
    id: "e15",
    title: "INSET Day",
    event_type: "inset_day",
    start_date: "2026-07-22",
    end_date: "2026-07-22",
    start_time: "08:30",
    end_time: "16:00",
    all_day: true,
    location: "Main Hall",
    description: "End of year INSET day - transition planning",
    year_groups: [],
    visibility: "staff",
    recurring: null,
    created_by: "demo",
  },
];

const DEMO_PE_TEACHERS = [
  "Mrs Johnson (Reception)",
  "Miss Patel (Year 1)",
  "Mr Thompson (Year 2)",
  "Mrs Williams (Year 3)",
];

function generateDemoParentsEveningSlots(): ParentsEveningSlot[] {
  const slots: ParentsEveningSlot[] = [];
  const statuses: ParentsEveningSlot["status"][] = [
    "available",
    "booked",
    "booked",
    "booked",
    "available",
  ];
  const parents = [
    "Mr & Mrs Smith",
    "Ms Garcia",
    "Mr Brown",
    "Mrs Chen",
    "Mr & Mrs Ahmed",
  ];
  let idx = 0;

  for (const teacher of DEMO_PE_TEACHERS) {
    let t = 15 * 60 + 30;
    while (t + 10 <= 19 * 60) {
      const sh = Math.floor(t / 60);
      const sm = t % 60;
      const eh = Math.floor((t + 10) / 60);
      const em = (t + 10) % 60;
      const status = statuses[idx % statuses.length];
      slots.push({
        id: `ds-${idx}`,
        event_id: "e5",
        teacher_name: teacher,
        start_time: `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
        end_time: `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
        status,
        parent_name: status === "booked" ? parents[idx % parents.length] : null,
        pupil_name:
          status === "booked"
            ? `Child of ${parents[idx % parents.length]}`
            : null,
        notes: null,
      });
      t += 10;
      idx++;
    }
  }
  return slots;
}

// ─── Main Component ─────────────────────────────────────────────────

export default function AcademicCalendarPage() {
  const { organization } = useAuth();
  const orgId = organization?.id || "";

  // ── State ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<
    "calendar" | "terms" | "events" | "parents_evening" | "key_dates"
  >("calendar");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [terms, setTerms] = useState<Term[]>(DEMO_TERMS);
  const [events, setEvents] = useState<SchoolEvent[]>(DEMO_EVENTS);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");

  // Term editing
  const [editingTerms, setEditingTerms] = useState(false);
  const [editTermData, setEditTermData] = useState<Term[]>([]);

  // Event creation modal
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    event_type: "other" as string,
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    all_day: true,
    location: "",
    description: "",
    year_groups: [] as string[],
    visibility: "public",
  });

  // Parents' evening
  const [peSlots, setPeSlots] = useState<ParentsEveningSlot[]>([]);
  const [peSummary, setPeSummary] = useState<SlotSummary | null>(null);
  const [peSelectedEvent, setPeSelectedEvent] = useState<string>("");
  const [showGenerateSlots, setShowGenerateSlots] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    slot_duration: "10",
    teachers: [""] as string[],
    start_time: "15:30",
    end_time: "19:00",
  });

  // Event detail
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);

  // ── Data Fetching ──────────────────────────────────────────────────

  const fetchTerms = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await fetch("/api/calendar/terms?academic_year=2025-26");
      if (res.ok) {
        const data = await res.json();
        setTerms(data.terms || DEMO_TERMS);
        setIsDemo(data.is_demo ?? true);
      } else {
        setError("Failed to load term dates. Showing demo data.");
      }
    } catch {
      setError("Failed to load term dates. Showing demo data.");
    }
  }, [orgId]);

  const fetchEvents = useCallback(async () => {
    if (!orgId) return;
    try {
      const res = await fetch(
        "/api/calendar/events?start_date=2025-09-01&end_date=2026-07-31",
      );
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || DEMO_EVENTS);
        setIsDemo(data.is_demo ?? true);
      } else {
        setError("Failed to load events. Showing demo data.");
      }
    } catch {
      setError("Failed to load events. Showing demo data.");
    }
  }, [orgId]);

  const fetchParentsEveningSlots = useCallback(
    async (eventId: string) => {
      if (!orgId) {
        // Load demo slots
        const demoSlots = generateDemoParentsEveningSlots();
        setPeSlots(demoSlots);
        const booked = demoSlots.filter((s) => s.status === "booked").length;
        setPeSummary({
          total_slots: demoSlots.length,
          booked,
          available: demoSlots.length - booked,
          percent_booked: Math.round((booked / demoSlots.length) * 100),
          teachers: DEMO_PE_TEACHERS,
        });
        return;
      }
      try {
        const res = await fetch(
          `/api/calendar/parents-evening?event_id=${eventId}`,
        );
        if (res.ok) {
          const data = await res.json();
          setPeSlots(data.slots || []);
          setPeSummary(data.summary || null);
        } else {
          setError("Failed to load parents' evening slots. Showing demo data.");
        }
      } catch {
        setError("Failed to load parents' evening slots. Showing demo data.");
        // Load demo
        const demoSlots = generateDemoParentsEveningSlots();
        setPeSlots(demoSlots);
        const booked = demoSlots.filter((s) => s.status === "booked").length;
        setPeSummary({
          total_slots: demoSlots.length,
          booked,
          available: demoSlots.length - booked,
          percent_booked: Math.round((booked / demoSlots.length) * 100),
          teachers: DEMO_PE_TEACHERS,
        });
      }
    },
    [orgId],
  );

  useEffect(() => {
    fetchTerms();
    fetchEvents();
  }, [fetchTerms, fetchEvents]);

  useEffect(() => {
    if (activeTab === "parents_evening") {
      const peEvents = events.filter((e) => e.event_type === "parents_evening");
      if (peEvents.length > 0 && !peSelectedEvent) {
        setPeSelectedEvent(peEvents[0].id);
        fetchParentsEveningSlots(peEvents[0].id);
      }
    }
  }, [activeTab, events, peSelectedEvent, fetchParentsEveningSlots]);

  // ── Derived Data ───────────────────────────────────────────────────

  const totalSchoolDays = useMemo(
    () => terms.reduce((sum, t) => sum + t.school_days, 0),
    [terms],
  );

  const termDateRanges = useMemo(() => {
    const ranges: { start: string; end: string }[] = [];
    for (const term of terms) {
      ranges.push({ start: term.start_date, end: term.end_date });
    }
    return ranges;
  }, [terms]);

  const insetDays = useMemo(
    () =>
      events
        .filter((e) => e.event_type === "inset_day")
        .map((e) => e.start_date),
    [events],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, SchoolEvent[]>();
    for (const evt of events) {
      const start = new Date(evt.start_date + "T00:00:00");
      const end = new Date(evt.end_date + "T00:00:00");
      const d = new Date(start);
      while (d <= end) {
        const key = toDateStr(d);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(evt);
        d.setDate(d.getDate() + 1);
      }
    }
    return map;
  }, [events]);

  const isTermDay = useCallback(
    (dateStr: string) => {
      return termDateRanges.some((r) => dateStr >= r.start && dateStr <= r.end);
    },
    [termDateRanges],
  );

  const isHoliday = useCallback(
    (dateStr: string) => {
      const d = new Date(dateStr + "T00:00:00");
      if (isWeekend(d)) return false;
      // Within academic year but not in a term
      if (dateStr >= "2025-09-01" && dateStr <= "2026-07-31") {
        return !isTermDay(dateStr) && !isWeekend(d);
      }
      return false;
    },
    [isTermDay],
  );

  const upcomingEvents = useMemo(() => {
    const today = toDateStr(new Date());
    let filtered = events.filter((e) => e.start_date >= today);
    if (eventTypeFilter !== "all") {
      filtered = filtered.filter((e) => e.event_type === eventTypeFilter);
    }
    return filtered.slice(0, 10);
  }, [events, eventTypeFilter]);

  const parentsEveningEvents = useMemo(
    () => events.filter((e) => e.event_type === "parents_evening"),
    [events],
  );

  // Group PE slots by teacher
  const slotsByTeacher = useMemo(() => {
    const map = new Map<string, ParentsEveningSlot[]>();
    for (const slot of peSlots) {
      if (!map.has(slot.teacher_name)) map.set(slot.teacher_name, []);
      map.get(slot.teacher_name)!.push(slot);
    }
    return map;
  }, [peSlots]);

  // ── Calendar Grid ──────────────────────────────────────────────────

  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth;
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrev = getDaysInMonth(prevYear, prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(prevYear, prevMonth, daysInPrev - i);
      days.push({ date: d, dateStr: toDateStr(d), isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, dateStr: toDateStr(d), isCurrentMonth: true });
    }

    // Next month padding (fill to 42 = 6 rows)
    const remaining = 42 - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(nextYear, nextMonth, i);
      days.push({ date: d, dateStr: toDateStr(d), isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  const todayStr = toDateStr(new Date());

  // ── Handlers ───────────────────────────────────────────────────────

  const prevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
    setSelectedDate(null);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDate(todayStr);
  };

  const handleSaveTerms = async () => {
    if (isDemo) {
      setTerms(editTermData);
      setEditingTerms(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms: editTermData }),
      });
      if (res.ok) {
        const data = await res.json();
        setTerms(data.terms);
        setEditingTerms(false);
      } else {
        setError("Failed to save term dates. Please try again.");
      }
    } catch {
      setError("Failed to save term dates. Please try again.");
    }
    setLoading(false);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.start_date) return;
    if (newEvent.end_date && newEvent.end_date < newEvent.start_date) {
      setError("End date must be after start date");
      return;
    }
    if (isDemo) {
      const fakeEvent: SchoolEvent = {
        id: `new-${Date.now()}`,
        ...newEvent,
        end_date: newEvent.end_date || newEvent.start_date,
        start_time: newEvent.start_time || null,
        end_time: newEvent.end_time || null,
        location: newEvent.location || null,
        description: newEvent.description || null,
        recurring: null,
        created_by: "demo",
      };
      setEvents((prev) =>
        [...prev, fakeEvent].sort((a, b) =>
          a.start_date.localeCompare(b.start_date),
        ),
      );
      setShowAddEvent(false);
      resetNewEvent();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });
      if (res.ok) {
        fetchEvents();
        setShowAddEvent(false);
        resetNewEvent();
      } else {
        setError("Failed to save event. Please try again.");
      }
    } catch {
      setError("Failed to save event. Please try again.");
    }
    setLoading(false);
  };

  const resetNewEvent = () => {
    setNewEvent({
      title: "",
      event_type: "other",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      all_day: true,
      location: "",
      description: "",
      year_groups: [],
      visibility: "public",
    });
  };

  const handleDeleteEvent = async (id: string) => {
    if (isDemo) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setSelectedEvent(null);
      return;
    }
    try {
      const res = await fetch(`/api/calendar/events/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchEvents();
        setSelectedEvent(null);
      } else {
        setError("Failed to delete event. Please try again.");
      }
    } catch {
      setError("Failed to delete event. Please try again.");
    }
  };

  const handleGenerateSlots = async () => {
    if (!peSelectedEvent) return;
    if (isDemo) {
      const demoSlots = generateDemoParentsEveningSlots();
      setPeSlots(demoSlots);
      const booked = demoSlots.filter((s) => s.status === "booked").length;
      setPeSummary({
        total_slots: demoSlots.length,
        booked,
        available: demoSlots.length - booked,
        percent_booked: Math.round((booked / demoSlots.length) * 100),
        teachers: DEMO_PE_TEACHERS,
      });
      setShowGenerateSlots(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/parents-evening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: peSelectedEvent,
          teachers: generateForm.teachers.filter(Boolean),
          slot_duration: generateForm.slot_duration,
          start_time: generateForm.start_time,
          end_time: generateForm.end_time,
        }),
      });
      if (res.ok) {
        fetchParentsEveningSlots(peSelectedEvent);
        setShowGenerateSlots(false);
      } else {
        setError("Failed to generate slots. Please try again.");
      }
    } catch {
      setError("Failed to generate slots. Please try again.");
    }
    setLoading(false);
  };

  const toggleYearGroup = (yg: string) => {
    setNewEvent((prev) => ({
      ...prev,
      year_groups: prev.year_groups.includes(yg)
        ? prev.year_groups.filter((y) => y !== yg)
        : [...prev.year_groups, yg],
    }));
  };

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Academic Calendar
            </h1>
            <p className="text-sm text-gray-500">
              Term dates, events, and parents&apos; evening booking
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">2025-26 Academic Year</span>
          <button
            onClick={() => setShowAddEvent(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* Demo Banner */}
      {isDemo && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-medium">Demo Mode</span> — Showing sample data
            for the 2025-26 academic year. Connect your organisation to manage
            real term dates and events.
          </p>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { key: "calendar" as const, label: "Month View", icon: Calendar },
          { key: "terms" as const, label: "Term Dates", icon: BookOpen },
          { key: "events" as const, label: "Upcoming Events", icon: Star },
          {
            key: "parents_evening" as const,
            label: "Parents' Evening",
            icon: Users,
          },
          {
            key: "key_dates" as const,
            label: "Key Dates",
            icon: AlertTriangle,
          },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors flex-1 justify-center ${
              activeTab === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ─── Tab: Month View Calendar ─────────────────────────────────── */}
      {activeTab === "calendar" && (
        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm text-sky-600 border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors"
            >
              Today
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {DAY_LABELS.map((day) => (
                <div
                  key={day}
                  className="px-2 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map(({ dateStr, date, isCurrentMonth }, idx) => {
                const weekend = isWeekend(date);
                const isToday = dateStr === todayStr;
                const inTerm = isTermDay(dateStr);
                const holiday = isHoliday(dateStr);
                const inset = insetDays.includes(dateStr);
                const dayEvents = eventsByDate.get(dateStr) || [];
                const isSelected = dateStr === selectedDate;

                let bgColor = "bg-white";
                if (!isCurrentMonth) bgColor = "bg-gray-50";
                else if (inset) bgColor = "bg-amber-50";
                else if (holiday) bgColor = "bg-blue-50";
                else if (weekend) bgColor = "bg-gray-50";

                return (
                  <button
                    key={idx}
                    onClick={() =>
                      setSelectedDate(dateStr === selectedDate ? null : dateStr)
                    }
                    className={`relative min-h-[80px] md:min-h-[100px] p-1.5 border-b border-r border-gray-100 text-left transition-colors hover:bg-gray-50 ${bgColor} ${
                      isSelected ? "ring-2 ring-sky-500 ring-inset" : ""
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full ${
                        isToday
                          ? "bg-sky-600 text-white"
                          : !isCurrentMonth
                            ? "text-gray-300"
                            : weekend
                              ? "text-gray-400"
                              : "text-gray-700"
                      }`}
                    >
                      {date.getDate()}
                    </span>

                    {/* Event Indicators */}
                    {isCurrentMonth && dayEvents.length > 0 && (
                      <div className="mt-0.5 space-y-0.5">
                        {dayEvents.slice(0, 3).map((evt) => {
                          const cfg =
                            EVENT_TYPE_CONFIG[evt.event_type] ||
                            EVENT_TYPE_CONFIG.other;
                          return (
                            <div
                              key={evt.id}
                              className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${cfg.bgColor} ${cfg.color}`}
                            >
                              {evt.title}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-gray-400 px-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    )}

                    {/* INSET indicator */}
                    {isCurrentMonth && inset && dayEvents.length === 0 && (
                      <div className="mt-0.5 text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 truncate">
                        INSET
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white border border-gray-200" />
              <span>School Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
              <span>Weekend</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
              <span>Holiday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
              <span>INSET Day</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Today</span>
            </div>
          </div>

          {/* Selected Date Events */}
          {selectedDate && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                {formatDate(selectedDate)}
              </h3>
              {(eventsByDate.get(selectedDate) || []).length === 0 ? (
                <p className="text-sm text-gray-400">No events on this day.</p>
              ) : (
                <div className="space-y-2">
                  {(eventsByDate.get(selectedDate) || []).map((evt) => {
                    const cfg =
                      EVENT_TYPE_CONFIG[evt.event_type] ||
                      EVENT_TYPE_CONFIG.other;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={evt.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
                        onClick={() => setSelectedEvent(evt)}
                      >
                        <div className={`p-1.5 rounded-md ${cfg.bgColor}`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {evt.title}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                            {evt.start_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {evt.start_time}
                                {evt.end_time && ` - ${evt.end_time}`}
                              </span>
                            )}
                            {evt.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {evt.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${cfg.bgColor} ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Term Dates ──────────────────────────────────────────── */}
      {activeTab === "terms" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Term Dates — 2025-26
            </h2>
            <div className="flex items-center gap-2">
              <div
                className={`text-sm font-medium px-3 py-1 rounded-full ${
                  totalSchoolDays === 190
                    ? "bg-green-100 text-green-700"
                    : totalSchoolDays > 190
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {totalSchoolDays} / 190 school days
              </div>
              {!editingTerms ? (
                <button
                  onClick={() => {
                    setEditTermData(JSON.parse(JSON.stringify(terms)));
                    setEditingTerms(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Dates
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTerms(false)}
                    className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTerms}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(editingTerms ? editTermData : terms).map((term, index) => {
              const seasonColors: Record<
                string,
                { bg: string; border: string; text: string }
              > = {
                Autumn: {
                  bg: "bg-orange-50",
                  border: "border-orange-200",
                  text: "text-orange-700",
                },
                Spring: {
                  bg: "bg-emerald-50",
                  border: "border-emerald-200",
                  text: "text-emerald-700",
                },
                Summer: {
                  bg: "bg-sky-50",
                  border: "border-sky-200",
                  text: "text-sky-700",
                },
              };
              const season = term.name.split(" ")[0];
              const colors = seasonColors[season] || seasonColors.Autumn;

              return (
                <div
                  key={term.id}
                  className={`rounded-xl border ${colors.border} ${colors.bg} p-4 space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${colors.text}`}>
                      {term.name}
                    </h3>
                    <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full">
                      {term.school_days} days
                    </span>
                  </div>

                  {editingTerms ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500">Start</label>
                        <input
                          type="date"
                          value={editTermData[index]?.start_date || ""}
                          onChange={(e) => {
                            const updated = [...editTermData];
                            updated[index] = {
                              ...updated[index],
                              start_date: e.target.value,
                            };
                            setEditTermData(updated);
                          }}
                          className="w-full mt-0.5 px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">End</label>
                        <input
                          type="date"
                          value={editTermData[index]?.end_date || ""}
                          onChange={(e) => {
                            const updated = [...editTermData];
                            updated[index] = {
                              ...updated[index],
                              end_date: e.target.value,
                            };
                            setEditTermData(updated);
                          }}
                          className="w-full mt-0.5 px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">
                          School Days
                        </label>
                        <input
                          type="number"
                          value={editTermData[index]?.school_days || 0}
                          onChange={(e) => {
                            const updated = [...editTermData];
                            updated[index] = {
                              ...updated[index],
                              school_days: parseInt(e.target.value) || 0,
                            };
                            setEditTermData(updated);
                          }}
                          className="w-full mt-0.5 px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-700">
                        {formatDateShort(term.start_date)} —{" "}
                        {formatDateShort(term.end_date)}
                      </p>
                      {/* Show INSET days in this term */}
                      {insetDays
                        .filter(
                          (d) => d >= term.start_date && d <= term.end_date,
                        )
                        .map((d) => (
                          <div
                            key={d}
                            className="flex items-center gap-1 text-xs text-amber-600"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            INSET: {formatDateShort(d)}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Holiday Periods */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Holiday Periods
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {terms.length >= 2 && (
                <>
                  {/* Autumn half term */}
                  {terms[0] && terms[1] && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-8 bg-blue-300 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          October Half Term
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateShort(
                            toDateStr(
                              new Date(
                                new Date(
                                  terms[0].end_date + "T00:00:00",
                                ).getTime() +
                                  86400000 * 3,
                              ),
                            ),
                          )}{" "}
                          —{" "}
                          {formatDateShort(
                            toDateStr(
                              new Date(
                                new Date(
                                  terms[1].start_date + "T00:00:00",
                                ).getTime() -
                                  86400000 * 3,
                              ),
                            ),
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Christmas */}
                  {terms[1] && terms[2] && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-8 bg-blue-400 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Christmas Holiday
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateShort(
                            toDateStr(
                              new Date(
                                new Date(
                                  terms[1].end_date + "T00:00:00",
                                ).getTime() + 86400000,
                              ),
                            ),
                          )}{" "}
                          —{" "}
                          {formatDateShort(
                            toDateStr(
                              new Date(
                                new Date(
                                  terms[2].start_date + "T00:00:00",
                                ).getTime() - 86400000,
                              ),
                            ),
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Feb half term */}
                  {terms[2] && terms[3] && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-8 bg-blue-300 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          February Half Term
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateShort(
                            toDateStr(
                              new Date(
                                new Date(
                                  terms[2].end_date + "T00:00:00",
                                ).getTime() +
                                  86400000 * 3,
                              ),
                            ),
                          )}{" "}
                          —{" "}
                          {formatDateShort(
                            toDateStr(
                              new Date(
                                new Date(
                                  terms[3].start_date + "T00:00:00",
                                ).getTime() -
                                  86400000 * 3,
                              ),
                            ),
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Easter */}
                  {terms[3] && terms[4] && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-8 bg-blue-400 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Easter Holiday
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateShort(
                            toDateStr(
                              new Date(
                                new Date(
                                  terms[3].end_date + "T00:00:00",
                                ).getTime() + 86400000,
                              ),
                            ),
                          )}{" "}
                          —{" "}
                          {formatDateShort(
                            toDateStr(
                              new Date(
                                new Date(
                                  terms[4].start_date + "T00:00:00",
                                ).getTime() - 86400000,
                              ),
                            ),
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* May half term */}
                  {terms[4] && terms[5] && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-8 bg-blue-300 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          May Half Term
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateShort(
                            toDateStr(
                              new Date(
                                new Date(
                                  terms[4].end_date + "T00:00:00",
                                ).getTime() +
                                  86400000 * 3,
                              ),
                            ),
                          )}{" "}
                          —{" "}
                          {formatDateShort(
                            toDateStr(
                              new Date(
                                new Date(
                                  terms[5].start_date + "T00:00:00",
                                ).getTime() -
                                  86400000 * 3,
                              ),
                            ),
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Summer */}
                  {terms[5] && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-8 bg-blue-500 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Summer Holiday
                        </p>
                        <p className="text-xs text-gray-500">
                          From{" "}
                          {formatDateShort(
                            toDateStr(
                              new Date(
                                new Date(
                                  terms[5].end_date + "T00:00:00",
                                ).getTime() + 86400000,
                              ),
                            ),
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab: Upcoming Events ─────────────────────────────────────── */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Upcoming Events
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700"
              >
                <option value="all">All Types</option>
                {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAddEvent(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No upcoming events found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((evt) => {
                const cfg =
                  EVENT_TYPE_CONFIG[evt.event_type] || EVENT_TYPE_CONFIG.other;
                const Icon = cfg.icon;
                const isMultiDay = evt.start_date !== evt.end_date;

                return (
                  <div
                    key={evt.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => setSelectedEvent(evt)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Date Badge */}
                      <div className="flex flex-col items-center min-w-[48px]">
                        <span className="text-xs font-medium text-gray-400 uppercase">
                          {new Date(
                            evt.start_date + "T00:00:00",
                          ).toLocaleDateString("en-GB", { month: "short" })}
                        </span>
                        <span className="text-2xl font-bold text-gray-900">
                          {new Date(evt.start_date + "T00:00:00").getDate()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(
                            evt.start_date + "T00:00:00",
                          ).toLocaleDateString("en-GB", { weekday: "short" })}
                        </span>
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {evt.title}
                            </h3>
                            {evt.description && (
                              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                                {evt.description}
                              </p>
                            )}
                          </div>
                          <span
                            className={`shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-full ${cfg.bgColor} ${cfg.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {evt.start_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {evt.start_time}
                              {evt.end_time && ` - ${evt.end_time}`}
                            </span>
                          )}
                          {isMultiDay && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDateShort(evt.start_date)} —{" "}
                              {formatDateShort(evt.end_date)}
                            </span>
                          )}
                          {evt.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {evt.location}
                            </span>
                          )}
                          {evt.year_groups && evt.year_groups.length > 0 && (
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5" />
                              Year {evt.year_groups.join(", ")}
                            </span>
                          )}
                          {evt.visibility === "staff" && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <EyeOff className="w-3.5 h-3.5" />
                              Staff only
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Parents' Evening ────────────────────────────────────── */}
      {activeTab === "parents_evening" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Parents&apos; Evening Management
            </h2>
            <div className="flex items-center gap-2">
              {parentsEveningEvents.length > 0 && (
                <select
                  value={peSelectedEvent}
                  onChange={(e) => {
                    setPeSelectedEvent(e.target.value);
                    fetchParentsEveningSlots(e.target.value);
                  }}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700"
                >
                  {parentsEveningEvents.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({formatDateShort(e.start_date)})
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setShowGenerateSlots(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Generate Slots
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          {peSummary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {peSummary.total_slots}
                </p>
                <p className="text-xs text-gray-500">Total Slots</p>
              </div>
              <div className="bg-white rounded-xl border border-blue-200 p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {peSummary.booked}
                </p>
                <p className="text-xs text-gray-500">Booked</p>
              </div>
              <div className="bg-white rounded-xl border border-green-200 p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {peSummary.available}
                </p>
                <p className="text-xs text-gray-500">Available</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {peSummary.percent_booked}%
                </p>
                <p className="text-xs text-gray-500">Booked</p>
                <div className="mt-1 w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${peSummary.percent_booked}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Slot Grid */}
          {peSlots.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 sticky left-0 bg-gray-50 min-w-[200px]">
                        Teacher
                      </th>
                      {/* Get unique time slots from first teacher */}
                      {slotsByTeacher.size > 0 &&
                        Array.from(slotsByTeacher.values())[0].map((slot) => (
                          <th
                            key={slot.start_time}
                            className="text-center px-2 py-3 font-medium text-gray-500 min-w-[80px]"
                          >
                            {slot.start_time}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(slotsByTeacher.entries()).map(
                      ([teacher, slots]) => (
                        <tr key={teacher} className="border-b border-gray-100">
                          <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white">
                            {teacher}
                          </td>
                          {slots.map((slot) => {
                            const statusColors: Record<string, string> = {
                              available:
                                "bg-green-100 text-green-700 hover:bg-green-200",
                              booked: "bg-blue-100 text-blue-700",
                              completed: "bg-gray-100 text-gray-500",
                              no_show: "bg-red-100 text-red-700",
                            };
                            return (
                              <td
                                key={slot.id}
                                className="px-1 py-2 text-center"
                              >
                                <div
                                  className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium cursor-default ${
                                    statusColors[slot.status] ||
                                    statusColors.available
                                  }`}
                                  title={
                                    slot.parent_name
                                      ? `${slot.parent_name}${slot.pupil_name ? ` (${slot.pupil_name})` : ""}`
                                      : slot.status
                                  }
                                >
                                  {slot.status === "available" && (
                                    <Check className="w-3 h-3" />
                                  )}
                                  {slot.status === "booked" && (
                                    <span className="truncate max-w-[60px]">
                                      {slot.parent_name?.split(" ").pop() ||
                                        "Booked"}
                                    </span>
                                  )}
                                  {slot.status === "completed" && (
                                    <Check className="w-3 h-3" />
                                  )}
                                  {slot.status === "no_show" && (
                                    <X className="w-3 h-3" />
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No parents&apos; evening slots yet.</p>
              <p className="text-xs mt-1">
                Click &quot;Generate Slots&quot; to create appointment slots.
              </p>
            </div>
          )}

          {/* Slot Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
              <span>No Show</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab: Key Dates ───────────────────────────────────────────── */}
      {activeTab === "key_dates" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Key Dates & Integration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assessment Weeks */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-red-50">
                  <ClipboardCheck className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  Assessment Weeks
                </h3>
              </div>
              {events
                .filter(
                  (e) =>
                    e.event_type === "assessment_week" ||
                    e.event_type === "exam",
                )
                .map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {evt.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateShort(evt.start_date)}
                        {evt.start_date !== evt.end_date &&
                          ` — ${formatDateShort(evt.end_date)}`}
                      </p>
                    </div>
                    {evt.year_groups && evt.year_groups.length > 0 && (
                      <span className="text-xs text-gray-500">
                        Y{evt.year_groups.join(", ")}
                      </span>
                    )}
                  </div>
                ))}
              {events.filter(
                (e) =>
                  e.event_type === "assessment_week" || e.event_type === "exam",
              ).length === 0 && (
                <p className="text-sm text-gray-400">
                  No assessment weeks scheduled.
                </p>
              )}
            </div>

            {/* Governor Meetings */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-gray-100">
                  <Briefcase className="w-4 h-4 text-gray-600" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  Governor Meetings
                </h3>
              </div>
              {events
                .filter((e) => e.event_type === "governor_meeting")
                .map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {evt.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(evt.start_date)}
                        {evt.start_time && ` at ${evt.start_time}`}
                      </p>
                    </div>
                    {evt.location && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {evt.location}
                      </span>
                    )}
                  </div>
                ))}
              {events.filter((e) => e.event_type === "governor_meeting")
                .length === 0 && (
                <p className="text-sm text-gray-400">
                  No governor meetings scheduled.
                </p>
              )}
            </div>

            {/* Ofsted Inspection Window */}
            <div className="bg-white rounded-xl border border-red-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-red-50">
                  <Shield className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  Ofsted Inspection Window
                </h3>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  Your school may be inspected at any time during the academic
                  year. The notification period is typically one working day.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href="/dashboard/ofsted-readiness"
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    Check Ofsted Readiness
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              {events
                .filter((e) => e.event_type === "inspection")
                .map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center gap-2 p-3 bg-red-100 rounded-lg border border-red-200"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {evt.title}
                      </p>
                      <p className="text-xs text-red-600">
                        {formatDate(evt.start_date)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            {/* DfE Data Calendar Link */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-sky-50">
                  <Calendar className="w-4 h-4 text-sky-600" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  DfE Data Calendar
                </h3>
              </div>
              <p className="text-sm text-gray-500">
                Key DfE data submission and publication dates throughout the
                academic year.
              </p>
              <a
                href="/toolbox/data-calendar"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-sky-600 border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Data Calendar
              </a>
            </div>

            {/* INSET Days Summary */}
            <div className="bg-white rounded-xl border border-amber-200 p-4 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-50">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">INSET Days</h3>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    insetDays.length === 5
                      ? "bg-green-100 text-green-700"
                      : insetDays.length < 5
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {insetDays.length} / 5 allocated
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {events
                  .filter((e) => e.event_type === "inset_day")
                  .map((evt, i) => (
                    <div
                      key={evt.id}
                      className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg"
                    >
                      <span className="text-xs font-bold text-amber-600">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-gray-700">
                          {formatDate(evt.start_date)}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {evt.description || evt.title}
                        </p>
                      </div>
                    </div>
                  ))}
                {insetDays.length < 5 && (
                  <button
                    onClick={() => {
                      setNewEvent((prev) => ({
                        ...prev,
                        event_type: "inset_day",
                        all_day: true,
                      }));
                      setShowAddEvent(true);
                    }}
                    className="flex items-center justify-center gap-1 p-3 border-2 border-dashed border-amber-200 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-xs">Add INSET</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Add Event ─────────────────────────────────────────── */}
      {showAddEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Event</h3>
              <button
                onClick={() => {
                  setShowAddEvent(false);
                  resetNewEvent();
                }}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. Year 6 SATs Week"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type *
                </label>
                <select
                  value={newEvent.event_type}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      event_type: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={newEvent.start_date}
                    onChange={(e) =>
                      setNewEvent((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newEvent.end_date}
                    onChange={(e) =>
                      setNewEvent((prev) => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* All Day toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEvent.all_day}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      all_day: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm text-gray-700">All day event</span>
              </label>

              {/* Times (if not all day) */}
              {!newEvent.all_day && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.start_time}
                      onChange={(e) =>
                        setNewEvent((prev) => ({
                          ...prev,
                          start_time: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.end_time}
                      onChange={(e) =>
                        setNewEvent((prev) => ({
                          ...prev,
                          end_time: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="e.g. Main Hall"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Add details about the event..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                />
              </div>

              {/* Year Groups */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Groups (leave empty for whole school)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {YEAR_GROUPS.map((yg) => (
                    <button
                      key={yg}
                      onClick={() => toggleYearGroup(yg)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                        newEvent.year_groups.includes(yg)
                          ? "bg-sky-100 border-sky-300 text-sky-700"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {yg === "N"
                        ? "Nursery"
                        : yg === "R"
                          ? "Reception"
                          : `Y${yg}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <div className="flex gap-2">
                  {[
                    { value: "public", label: "Public", icon: Eye },
                    { value: "staff", label: "Staff Only", icon: EyeOff },
                  ].map(({ value, label, icon: VIcon }) => (
                    <button
                      key={value}
                      onClick={() =>
                        setNewEvent((prev) => ({ ...prev, visibility: value }))
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        newEvent.visibility === value
                          ? "bg-sky-50 border-sky-300 text-sky-700"
                          : "bg-white border-gray-200 text-gray-500"
                      }`}
                    >
                      <VIcon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAddEvent(false);
                  resetNewEvent();
                }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                disabled={!newEvent.title || !newEvent.start_date || loading}
                className="px-4 py-2 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Add Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Generate Slots ────────────────────────────────────── */}
      {showGenerateSlots && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Generate Parents&apos; Evening Slots
              </h3>
              <button
                onClick={() => setShowGenerateSlots(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Slot Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slot Duration
                </label>
                <div className="flex gap-2">
                  {["5", "10", "15"].map((d) => (
                    <button
                      key={d}
                      onClick={() =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          slot_duration: d,
                        }))
                      }
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        generateForm.slot_duration === d
                          ? "bg-sky-50 border-sky-300 text-sky-700"
                          : "bg-white border-gray-200 text-gray-500"
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={generateForm.start_time}
                    onChange={(e) =>
                      setGenerateForm((prev) => ({
                        ...prev,
                        start_time: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={generateForm.end_time}
                    onChange={(e) =>
                      setGenerateForm((prev) => ({
                        ...prev,
                        end_time: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Teachers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teachers
                </label>
                <div className="space-y-2">
                  {generateForm.teachers.map((teacher, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={teacher}
                        onChange={(e) => {
                          const updated = [...generateForm.teachers];
                          updated[i] = e.target.value;
                          setGenerateForm((prev) => ({
                            ...prev,
                            teachers: updated,
                          }));
                        }}
                        placeholder="e.g. Mrs Johnson (Reception)"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                      {generateForm.teachers.length > 1 && (
                        <button
                          onClick={() => {
                            const updated = generateForm.teachers.filter(
                              (_, idx) => idx !== i,
                            );
                            setGenerateForm((prev) => ({
                              ...prev,
                              teachers: updated,
                            }));
                          }}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setGenerateForm((prev) => ({
                        ...prev,
                        teachers: [...prev.teachers, ""],
                      }))
                    }
                    className="flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Teacher
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                <p>
                  This will create{" "}
                  <span className="font-medium text-gray-900">
                    {(() => {
                      const [sh, sm] = generateForm.start_time
                        .split(":")
                        .map(Number);
                      const [eh, em] = generateForm.end_time
                        .split(":")
                        .map(Number);
                      const totalMin = eh * 60 + em - (sh * 60 + sm);
                      const slotsPerTeacher = Math.floor(
                        totalMin / parseInt(generateForm.slot_duration),
                      );
                      const teacherCount =
                        generateForm.teachers.filter(Boolean).length;
                      return slotsPerTeacher * teacherCount;
                    })()}
                  </span>{" "}
                  slots across{" "}
                  <span className="font-medium text-gray-900">
                    {generateForm.teachers.filter(Boolean).length}
                  </span>{" "}
                  teachers.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowGenerateSlots(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateSlots}
                disabled={
                  generateForm.teachers.filter(Boolean).length === 0 || loading
                }
                className="px-4 py-2 text-sm bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Slots"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Event Detail ──────────────────────────────────────── */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                {(() => {
                  const cfg =
                    EVENT_TYPE_CONFIG[selectedEvent.event_type] ||
                    EVENT_TYPE_CONFIG.other;
                  const Icon = cfg.icon;
                  return (
                    <>
                      <div className={`p-1.5 rounded-md ${cfg.bgColor}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${cfg.bgColor} ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                  title="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedEvent.title}
              </h3>

              {selectedEvent.description && (
                <p className="text-sm text-gray-600">
                  {selectedEvent.description}
                </p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>
                    {formatDate(selectedEvent.start_date)}
                    {selectedEvent.start_date !== selectedEvent.end_date &&
                      ` — ${formatDate(selectedEvent.end_date)}`}
                  </span>
                </div>
                {selectedEvent.start_time && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>
                      {selectedEvent.start_time}
                      {selectedEvent.end_time && ` — ${selectedEvent.end_time}`}
                    </span>
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.year_groups &&
                  selectedEvent.year_groups.length > 0 && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <GraduationCap className="w-4 h-4 text-gray-400" />
                      <span>Year {selectedEvent.year_groups.join(", ")}</span>
                    </div>
                  )}
                <div className="flex items-center gap-2 text-gray-600">
                  {selectedEvent.visibility === "public" ? (
                    <>
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span>Visible to parents</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-600">Staff only</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
