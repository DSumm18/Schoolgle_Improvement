"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  PoundSterling,
  Users,
  BarChart3,
  Building2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  AlertTriangle,
  Shield,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ModulePageHeader,
  getModuleColors,
} from "@/components/ui/module-page-header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ─── Types matching engine ──────────────────────────────────────────

type BookingStatus =
  | "enquiry"
  | "provisional"
  | "confirmed"
  | "cancelled"
  | "completed";
type FacilityType =
  | "hall"
  | "sports_hall"
  | "classroom"
  | "field"
  | "playground"
  | "kitchen"
  | "meeting_room"
  | "studio"
  | "other";
type LetterType = "community" | "commercial" | "charity" | "staff" | "internal";

interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  capacity: number;
  hourlyRate: number;
  communityRate?: number;
  charityRate?: number;
  amenities: string[];
  availableSlots: string[];
  blockBookingDiscount?: number;
  utilisation: number;
}

interface Booking {
  id: string;
  facilityId: string;
  hirer: {
    name: string;
    email: string;
    phone: string;
    organization?: string;
    type: LetterType;
  };
  date: string;
  startTime: string;
  endTime: string;
  recurring?: { frequency: string; endDate: string };
  status: BookingStatus;
  totalCharge: number;
  depositPaid: boolean;
  invoiceSent: boolean;
  safeguardingChecked: boolean;
  insuranceCertProvided: boolean;
  riskAssessmentProvided: boolean;
  notes?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

const STATUS_COLORS: Record<BookingStatus, string> = {
  enquiry:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  provisional:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  confirmed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  cancelled:
    "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  completed: "bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400",
};

const HIRER_TYPE_LABELS: Record<LetterType, string> = {
  community: "Community",
  commercial: "Commercial",
  charity: "Charity",
  staff: "Staff",
  internal: "Internal",
};

const FACILITY_COLORS: Record<string, string> = {
  "fac-001": "#0ea5e9",
  "fac-002": "#10b981",
  "fac-003": "#f59e0b",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getWeekDates(baseDate: Date): Date[] {
  const start = new Date(baseDate);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDateISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am-8pm

// ─── Page Component ─────────────────────────────────────────────────

export default function LettingsPage() {
  const colors = getModuleColors("estates");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [income, setIncome] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState<
    "calendar" | "facilities" | "income"
  >("calendar");

  // New booking form state
  const [formFacility, setFormFacility] = useState("");
  const [formHirerName, setFormHirerName] = useState("");
  const [formHirerEmail, setFormHirerEmail] = useState("");
  const [formHirerPhone, setFormHirerPhone] = useState("");
  const [formHirerOrg, setFormHirerOrg] = useState("");
  const [formHirerType, setFormHirerType] = useState<LetterType>("community");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("18:00");
  const [formEndTime, setFormEndTime] = useState("20:00");
  const [formRecurring, setFormRecurring] = useState(false);
  const [formFrequency, setFormFrequency] = useState<
    "weekly" | "fortnightly" | "monthly"
  >("weekly");
  const [formEndDate, setFormEndDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    fetch("/api/estates/lettings")
      .then((r) => r.json())
      .then((data) => {
        setFacilities(data.facilities || []);
        setBookings(data.bookings || []);
        setIncome(data.income || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Calendar week
  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);
  const weekDates = useMemo(() => getWeekDates(baseDate), [baseDate]);

  // Summary stats
  const activeBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "provisional",
  ).length;
  const monthlyIncome = income?.total || 0;
  const avgUtilisation =
    facilities.length > 0
      ? Math.round(
          facilities.reduce((s, f) => s + f.utilisation, 0) / facilities.length,
        )
      : 0;
  const topFacility = facilities.reduce(
    (best, f) => (f.utilisation > (best?.utilisation || 0) ? f : best),
    facilities[0],
  );

  // Income chart data
  const incomeChartData = useMemo(() => {
    if (!income?.byMonth) return [];
    return Object.entries(income.byMonth).map(([month, total]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-GB", {
        month: "short",
      }),
      total: total as number,
    }));
  }, [income]);

  // Get bookings for a specific cell
  function getBookingsForSlot(date: string, hour: number): Booking[] {
    return bookings.filter((b) => {
      if (b.date !== date) return false;
      if (b.status === "cancelled") return false;
      const [sh] = b.startTime.split(":").map(Number);
      const [eh] = b.endTime.split(":").map(Number);
      return hour >= sh && hour < eh;
    });
  }

  async function handleCreateBooking() {
    const body: any = {
      facilityId: formFacility,
      hirerName: formHirerName,
      hirerEmail: formHirerEmail,
      hirerPhone: formHirerPhone,
      hirerOrganization: formHirerOrg,
      hirerType: formHirerType,
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      notes: formNotes,
    };
    if (formRecurring) {
      body.recurring = { frequency: formFrequency, endDate: formEndDate };
    }

    const res = await fetch("/api/estates/lettings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.booking) {
      setBookings((prev) => [...prev, data.booking]);
      setShowNewBooking(false);
      resetForm();
    }
  }

  function resetForm() {
    setFormFacility("");
    setFormHirerName("");
    setFormHirerEmail("");
    setFormHirerPhone("");
    setFormHirerOrg("");
    setFormHirerType("community");
    setFormDate("");
    setFormStartTime("18:00");
    setFormEndTime("20:00");
    setFormRecurring(false);
    setFormFrequency("weekly");
    setFormEndDate("");
    setFormNotes("");
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1600px] mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl"
              />
            ))}
          </div>
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="estates"
        icon={Calendar}
        label="Estates Management"
        title="Lettings & Room Bookings"
        description="Manage facility hire, calculate charges, and track lettings income for your school."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                <PoundSterling className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Monthly Income
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(monthlyIncome)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Projected annual: {formatCurrency(income?.projectedAnnual || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 ${colors.iconBg} rounded-xl`}>
                <Calendar className={`w-5 h-5 ${colors.iconText}`} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Bookings
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {activeBookings}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {bookings.filter((b) => b.status === "enquiry").length} pending
              enquiries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Avg Utilisation
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {avgUtilisation}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Across {facilities.length} facilities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                <Building2 className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Top Facility
              </span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white truncate">
              {topFacility?.name || "—"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {topFacility?.utilisation || 0}% utilisation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
        {(
          [
            { key: "calendar", label: "Calendar View", icon: Calendar },
            { key: "facilities", label: "Facilities", icon: Building2 },
            { key: "income", label: "Income Report", icon: BarChart3 },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <Button
          onClick={() => setShowNewBooking(true)}
          className="mb-2 bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Booking
        </Button>
      </div>

      {/* Calendar View */}
      {activeTab === "calendar" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Weekly Calendar</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeekOffset((w) => w - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeekOffset(0)}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeekOffset((w) => w + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-4 mt-2">
              {facilities.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400"
                >
                  <div
                    className="w-3 h-3 rounded"
                    style={{
                      backgroundColor: FACILITY_COLORS[f.id] || "#94a3b8",
                    }}
                  />
                  {f.name}
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header row */}
                <div className="grid grid-cols-8 gap-px bg-slate-200 dark:bg-slate-700 rounded-t-lg overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 text-xs font-medium text-slate-500" />
                  {weekDates.map((d, i) => {
                    const isToday =
                      formatDateISO(d) === formatDateISO(new Date());
                    return (
                      <div
                        key={i}
                        className={`p-2 text-center text-xs font-medium ${
                          isToday
                            ? "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <div>{DAY_NAMES[i]}</div>
                        <div className="text-lg font-bold">{d.getDate()}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Time slots */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="grid grid-cols-8 gap-px bg-slate-200 dark:bg-slate-700"
                  >
                    <div className="bg-white dark:bg-slate-900 p-1.5 text-xs text-slate-400 text-right pr-2">
                      {hour.toString().padStart(2, "0")}:00
                    </div>
                    {weekDates.map((d, di) => {
                      const dateStr = formatDateISO(d);
                      const slotBookings = getBookingsForSlot(dateStr, hour);
                      return (
                        <div
                          key={di}
                          className="bg-white dark:bg-slate-900 p-0.5 min-h-[32px] relative"
                        >
                          {slotBookings.map((b) => {
                            const [sh] = b.startTime.split(":").map(Number);
                            // Only render label on the first hour of the booking
                            const isStart = hour === sh;
                            const fac = facilities.find(
                              (f) => f.id === b.facilityId,
                            );
                            return (
                              <button
                                key={b.id}
                                onClick={() => setSelectedBooking(b)}
                                className="w-full rounded px-1 py-0.5 text-[10px] text-white font-medium truncate text-left cursor-pointer hover:opacity-80 transition-opacity"
                                style={{
                                  backgroundColor:
                                    FACILITY_COLORS[b.facilityId] || "#94a3b8",
                                  opacity: b.status === "provisional" ? 0.6 : 1,
                                }}
                                title={`${b.hirer.organization || b.hirer.name} - ${fac?.name}`}
                              >
                                {isStart
                                  ? b.hirer.organization || b.hirer.name
                                  : ""}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Facilities Tab */}
      {activeTab === "facilities" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {facilities.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {f.name}
                    </h3>
                    <p className="text-xs text-slate-500 capitalize">
                      {f.type.replace("_", " ")} - Capacity: {f.capacity}
                    </p>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full mt-1"
                    style={{
                      backgroundColor: FACILITY_COLORS[f.id] || "#94a3b8",
                    }}
                  />
                </div>

                {/* Rates */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
                    <div className="text-xs text-slate-500">Standard</div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(f.hourlyRate)}
                    </div>
                    <div className="text-[10px] text-slate-400">/hr</div>
                  </div>
                  {f.communityRate && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-2 text-center">
                      <div className="text-xs text-emerald-600">Community</div>
                      <div className="font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(f.communityRate)}
                      </div>
                      <div className="text-[10px] text-emerald-500">/hr</div>
                    </div>
                  )}
                  {f.charityRate && (
                    <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-2 text-center">
                      <div className="text-xs text-purple-600">Charity</div>
                      <div className="font-bold text-purple-700 dark:text-purple-400">
                        {formatCurrency(f.charityRate)}
                      </div>
                      <div className="text-[10px] text-purple-500">/hr</div>
                    </div>
                  )}
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {f.amenities.map((a) => (
                    <span
                      key={a}
                      className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full"
                    >
                      {a}
                    </span>
                  ))}
                </div>

                {/* Utilisation Bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">Utilisation</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {f.utilisation}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, f.utilisation)}%`,
                        backgroundColor: FACILITY_COLORS[f.id] || "#94a3b8",
                      }}
                    />
                  </div>
                </div>

                {/* Availability */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {f.availableSlots.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 text-[10px] font-medium bg-teal-50 dark:bg-teal-900/10 text-teal-700 dark:text-teal-400 rounded-full"
                    >
                      {s.replace("_", " ")}
                    </span>
                  ))}
                </div>

                {f.blockBookingDiscount && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">
                    {f.blockBookingDiscount}% block booking discount (4+
                    sessions)
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Income Report Tab */}
      {activeTab === "income" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Lettings Income</CardTitle>
            </CardHeader>
            <CardContent>
              {incomeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={incomeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `£${v}`}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        formatCurrency(value),
                        "Income",
                      ]}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {incomeChartData.map((_, i) => (
                        <Cell key={i} fill="#0d9488" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400">
                  No income data for this period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Income by Facility */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Income by Facility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {facilities.map((f) => {
                  const facilityIncome = income?.byFacility?.[f.id] || 0;
                  const percentage =
                    monthlyIncome > 0
                      ? Math.round((facilityIncome / monthlyIncome) * 100)
                      : 0;
                  return (
                    <div key={f.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {f.name}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatCurrency(facilityIncome)}{" "}
                          <span className="text-xs text-slate-400 font-normal">
                            ({percentage}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: FACILITY_COLORS[f.id] || "#94a3b8",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">
                        Hirer
                      </th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">
                        Facility
                      </th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">
                        Date
                      </th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">
                        Time
                      </th>
                      <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase">
                        Type
                      </th>
                      <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase">
                        Charge
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500 uppercase">
                        Status
                      </th>
                      <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500 uppercase">
                        Compliance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => {
                      const fac = facilities.find((f) => f.id === b.facilityId);
                      const complianceOk =
                        b.safeguardingChecked &&
                        b.insuranceCertProvided &&
                        b.riskAssessmentProvided;
                      return (
                        <tr
                          key={b.id}
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                          onClick={() => setSelectedBooking(b)}
                        >
                          <td className="py-2.5 px-2">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {b.hirer.organization || b.hirer.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {b.hirer.name}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400">
                            {fac?.name}
                          </td>
                          <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400">
                            {new Date(b.date).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                            {b.recurring && (
                              <span className="ml-1 text-[10px] text-teal-600 dark:text-teal-400">
                                ({b.recurring.frequency})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400">
                            {b.startTime}-{b.endTime}
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="text-xs">
                              {HIRER_TYPE_LABELS[b.hirer.type]}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-right font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(b.totalCharge)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[b.status]}`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {complianceOk ? (
                              <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Booking Details</CardTitle>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hirer info */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">
                  Hirer Information
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedBooking.hirer.name}
                  </p>
                  {selectedBooking.hirer.organization && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedBooking.hirer.organization}
                    </p>
                  )}
                  <p className="text-sm text-slate-500">
                    {selectedBooking.hirer.email}
                  </p>
                  <p className="text-sm text-slate-500">
                    {selectedBooking.hirer.phone}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[selectedBooking.status]}`}
                  >
                    {selectedBooking.status}
                  </span>
                </div>
              </div>

              {/* Booking details */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">
                  Schedule
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>
                      {new Date(selectedBooking.date).toLocaleDateString(
                        "en-GB",
                        {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>
                      {selectedBooking.startTime} - {selectedBooking.endTime}
                    </span>
                  </div>
                </div>
                {selectedBooking.recurring && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                    Recurring {selectedBooking.recurring.frequency} until{" "}
                    {new Date(
                      selectedBooking.recurring.endDate,
                    ).toLocaleDateString("en-GB")}
                  </p>
                )}
              </div>

              {/* Charge */}
              <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-3">
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  Total Charge
                </span>
                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(selectedBooking.totalCharge)}
                </span>
              </div>

              {/* Payment status */}
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium ${
                    selectedBooking.depositPaid
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-900/10 dark:text-amber-400"
                  }`}
                >
                  {selectedBooking.depositPaid ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  Deposit {selectedBooking.depositPaid ? "Paid" : "Pending"}
                </div>
                <div
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium ${
                    selectedBooking.invoiceSent
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/10 dark:text-emerald-400"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-900/10 dark:text-amber-400"
                  }`}
                >
                  {selectedBooking.invoiceSent ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  Invoice {selectedBooking.invoiceSent ? "Sent" : "Not Sent"}
                </div>
              </div>

              {/* Compliance Checklist */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">
                  Compliance Checklist
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      label: "Safeguarding / DBS Check",
                      checked: selectedBooking.safeguardingChecked,
                      icon: Shield,
                    },
                    {
                      label: "Public Liability Insurance",
                      checked: selectedBooking.insuranceCertProvided,
                      icon: FileText,
                    },
                    {
                      label: "Risk Assessment",
                      checked: selectedBooking.riskAssessmentProvided,
                      icon: ClipboardCheck,
                    },
                  ].map(({ label, checked, icon: Icon }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                        checked
                          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10"
                          : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          checked
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium flex-1 ${
                          checked
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {label}
                      </span>
                      {checked ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedBooking.notes && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">
                    Notes
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Booking Modal */}
      {showNewBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">New Booking</CardTitle>
                <button
                  onClick={() => {
                    setShowNewBooking(false);
                    resetForm();
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Facility */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Facility *
                </label>
                <select
                  value={formFacility}
                  onChange={(e) => setFormFacility(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
                >
                  <option value="">Select a facility...</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({formatCurrency(f.hourlyRate)}/hr)
                    </option>
                  ))}
                </select>
              </div>

              {/* Hirer details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Hirer Name *
                  </label>
                  <input
                    type="text"
                    value={formHirerName}
                    onChange={(e) => setFormHirerName(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formHirerEmail}
                    onChange={(e) => setFormHirerEmail(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formHirerPhone}
                    onChange={(e) => setFormHirerPhone(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
                    placeholder="07700 900000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Organisation
                  </label>
                  <input
                    type="text"
                    value={formHirerOrg}
                    onChange={(e) => setFormHirerOrg(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
                    placeholder="Organisation name"
                  />
                </div>
              </div>

              {/* Hirer type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Hirer Type *
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(
                    Object.entries(HIRER_TYPE_LABELS) as [LetterType, string][]
                  ).map(([type, label]) => (
                    <button
                      key={type}
                      onClick={() => setFormHirerType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        formHirerType === type
                          ? "bg-teal-50 border-teal-300 text-teal-700 dark:bg-teal-900/20 dark:border-teal-700 dark:text-teal-400"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Recurring */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formRecurring}
                    onChange={(e) => setFormRecurring(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Recurring booking
                  </span>
                </label>
                {formRecurring && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Frequency
                      </label>
                      <select
                        value={formFrequency}
                        onChange={(e) =>
                          setFormFrequency(
                            e.target.value as
                              | "weekly"
                              | "fortnightly"
                              | "monthly",
                          )
                        }
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="fortnightly">Fortnightly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Notes
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 resize-none"
                  placeholder="Any special requirements or notes..."
                />
              </div>

              <Button
                onClick={handleCreateBooking}
                disabled={
                  !formFacility ||
                  !formHirerName ||
                  !formHirerEmail ||
                  !formDate ||
                  !formStartTime ||
                  !formEndTime
                }
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Create Booking
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
