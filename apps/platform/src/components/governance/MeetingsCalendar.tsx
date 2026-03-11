"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MeetingModal from "./MeetingModal";
import {
  GovernorMeeting,
  MeetingStatus,
  CommitteeType,
  GovernorMeetingForm,
} from "@/lib/governance";

interface MeetingsCalendarProps {
  organizationId: string;
  onRefresh?: () => void;
}

export default function MeetingsCalendar({
  organizationId,
  onRefresh,
}: MeetingsCalendarProps) {
  const [meetings, setMeetings] = useState<GovernorMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
  const [filterStatus, setFilterStatus] = useState<MeetingStatus | "all">(
    "all",
  );
  const [filterCommittee, setFilterCommittee] = useState<CommitteeType | "all">(
    "all",
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedMeeting, setSelectedMeeting] =
    useState<GovernorMeeting | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, [organizationId, filterStatus, filterCommittee]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ organizationId });
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterCommittee !== "all")
        params.append("meeting_type", filterCommittee);

      const response = await fetch(`/api/governance/meetings?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
      }
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (meetingId: string) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return;

    try {
      const response = await fetch(
        `/api/governance/meetings/${meetingId}?organizationId=${organizationId}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        fetchMeetings();
        onRefresh?.();
      }
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      toast.error("Failed to delete meeting");
    }
  };

  const getStatusBadge = (status: MeetingStatus) => {
    const styles: Record<MeetingStatus, string> = {
      scheduled: "bg-blue-100 text-blue-700 border-blue-200",
      in_progress: "bg-amber-100 text-amber-700 border-amber-200",
      completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
      cancelled: "bg-slate-100 text-slate-500 border-slate-200",
    };
    const labels: Record<MeetingStatus, string> = {
      scheduled: "Scheduled",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return (
      <Badge
        className={`text-[10px] font-bold uppercase px-2 py-0.5 ${styles[status]}`}
      >
        {labels[status]}
      </Badge>
    );
  };

  const getCommitteeBadge = (
    meetingType: CommitteeType,
    committee: string | null,
  ) => {
    const colors: Record<string, string> = {
      full_governing_body: "bg-violet-100 text-violet-700 border-violet-200",
      committee: "bg-blue-100 text-blue-700 border-blue-200",
      sub_committee: "bg-teal-100 text-teal-700 border-teal-200",
    };
    const label = committee || meetingType.replace("_", " ");
    return (
      <Badge
        className={`text-[10px] font-normal uppercase ${colors[meetingType]}`}
      >
        {label}
      </Badge>
    );
  };

  // Group meetings by upcoming and past
  const { upcomingMeetings, pastMeetings } = useMemo(() => {
    const now = new Date();
    const sorted = [...meetings].sort(
      (a, b) =>
        new Date(a.scheduled_date).getTime() -
        new Date(b.scheduled_date).getTime(),
    );

    return {
      upcomingMeetings: sorted.filter((m) => new Date(m.scheduled_date) >= now),
      pastMeetings: sorted.filter((m) => new Date(m.scheduled_date) < now),
    };
  }, [meetings]);

  const formatMeetingDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    } as any);
  };

  const formatMeetingTime = (time: string | null, duration: number) => {
    if (!time) return "";
    const end = new Date(`2000-01-01T${time}`);
    end.setMinutes(end.getMinutes() + duration);
    return `${time} - ${end.toTimeString().slice(0, 5)}`;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={filterStatus}
                onValueChange={(value) => setFilterStatus(value as any)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterCommittee}
                onValueChange={(value) => setFilterCommittee(value as any)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by committee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meetings</SelectItem>
                  <SelectItem value="full_governing_body">
                    Full Governing Body
                  </SelectItem>
                  <SelectItem value="committee">Committee</SelectItem>
                  <SelectItem value="sub_committee">Sub Committee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "calendar"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Calendar
                </button>
              </div>

              <Button
                onClick={() => {
                  setSelectedMeeting(null);
                  setModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* List View */}
          {viewMode === "list" && (
            <div className="space-y-6">
              {/* Upcoming Meetings */}
              {upcomingMeetings.length > 0 && (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-3">
                    Upcoming Meetings ({upcomingMeetings.length})
                  </h3>
                  <div className="grid gap-3">
                    {upcomingMeetings.map((meeting) => (
                      <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        onEdit={() => {
                          setSelectedMeeting(meeting);
                          setModalOpen(true);
                        }}
                        onDelete={() => handleDelete(meeting.id)}
                        formatMeetingDate={formatMeetingDate}
                        formatMeetingTime={formatMeetingTime}
                        getStatusBadge={getStatusBadge}
                        getCommitteeBadge={getCommitteeBadge}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Past Meetings */}
              {pastMeetings.length > 0 && (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-3">
                    Past Meetings ({pastMeetings.length})
                  </h3>
                  <div className="grid gap-3">
                    {pastMeetings.map((meeting) => (
                      <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        onEdit={() => {
                          setSelectedMeeting(meeting);
                          setModalOpen(true);
                        }}
                        onDelete={() => handleDelete(meeting.id)}
                        formatMeetingDate={formatMeetingDate}
                        formatMeetingTime={formatMeetingTime}
                        getStatusBadge={getStatusBadge}
                        getCommitteeBadge={getCommitteeBadge}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {upcomingMeetings.length === 0 && pastMeetings.length === 0 && (
                <Card>
                  <CardContent className="p-12">
                    <div className="flex flex-col items-center gap-3">
                      <Calendar className="w-12 h-12 text-slate-300" />
                      <p className="text-slate-500 font-semibold">
                        No meetings found
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMeeting(null);
                          setModalOpen(true);
                        }}
                      >
                        Schedule your first meeting
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Calendar View - Simplified */}
          {viewMode === "calendar" && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">
                    {currentMonth.toLocaleDateString("en-GB", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-slate-500 text-center py-8">
                  Calendar view coming soon. Use list view for full
                  functionality.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modal */}
      <MeetingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => {
          setModalOpen(false);
          fetchMeetings();
          onRefresh?.();
        }}
        organizationId={organizationId}
        initialData={selectedMeeting}
      />
    </div>
  );
}

// Meeting Card Component
interface MeetingCardProps {
  meeting: GovernorMeeting;
  onEdit: () => void;
  onDelete: () => void;
  formatMeetingDate: (date: string) => string;
  formatMeetingTime: (time: string | null, duration: number) => string;
  getStatusBadge: (status: MeetingStatus) => React.ReactNode;
  getCommitteeBadge: (
    type: CommitteeType,
    committee: string | null,
  ) => React.ReactNode;
}

function MeetingCard({
  meeting,
  onEdit,
  onDelete,
  formatMeetingDate,
  formatMeetingTime,
  getStatusBadge,
  getCommitteeBadge,
}: MeetingCardProps) {
  const isPast = new Date(meeting.scheduled_date) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-slate-900 rounded-xl border p-4 hover:shadow-md transition-shadow ${
        isPast
          ? "border-slate-200 dark:border-slate-700"
          : "border-blue-200 dark:border-blue-800"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm truncate">{meeting.title}</h4>
            {getCommitteeBadge(meeting.meeting_type, meeting.committee)}
            {getStatusBadge(meeting.status)}
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-medium">
                {formatMeetingDate(meeting.scheduled_date)}
              </span>
            </div>

            {meeting.scheduled_time && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  {formatMeetingTime(
                    meeting.scheduled_time,
                    meeting.duration_minutes,
                  )}
                </span>
              </div>
            )}

            {meeting.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="truncate max-w-[150px]">
                  {meeting.location}
                </span>
              </div>
            )}

            {meeting.meeting_link && (
              <div className="flex items-center gap-1.5">
                <Video className="w-4 h-4 text-blue-500" />
                <a
                  href={meeting.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Join Online
                </a>
              </div>
            )}
          </div>

          {/* Agenda Preview */}
          {meeting.agenda_items && meeting.agenda_items.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                Agenda ({meeting.agenda_items.length} items)
              </p>
              <div className="flex flex-wrap gap-1">
                {meeting.agenda_items.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600"
                  >
                    {item.title}
                  </span>
                ))}
                {meeting.agenda_items.length > 3 && (
                  <span className="text-[10px] text-slate-400">
                    +{meeting.agenda_items.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Attendance */}
          {meeting.invited_governors &&
            meeting.invited_governors.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">
                  {meeting.attended_governors?.length || 0}/
                  {meeting.invited_governors.length} attending
                </span>
              </div>
            )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
