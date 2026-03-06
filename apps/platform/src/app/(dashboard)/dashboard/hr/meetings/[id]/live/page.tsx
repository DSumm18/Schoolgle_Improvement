"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Square, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  MeetingLiveChecklist,
  MeetingScriptDisplay,
  MeetingNotesInput,
  MeetingRecorder,
} from "@/components/meetings";
import type {
  Meeting,
  MeetingTemplate,
  MeetingChecklistItem,
  MeetingNote,
} from "@/lib/meetings";

export default function MeetingLivePage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [template, setTemplate] = useState<MeetingTemplate | null>(null);
  const [checklistItems, setChecklistItems] = useState<MeetingChecklistItem[]>(
    [],
  );
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showClosing, setShowClosing] = useState(false);
  const [hasTranscript, setHasTranscript] = useState(false);

  useEffect(() => {
    if (!organizationId || !meetingId) return;
    fetch(`/api/meetings/${meetingId}?organizationId=${organizationId}`)
      .then((r) => r.json())
      .then((data) => {
        setMeeting(data.meeting);
        setTemplate(data.template);
        setChecklistItems(data.checklist_items || []);
        setNotes(data.meeting?.notes || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organizationId, meetingId]);

  const handleAddNote = useCallback(
    async (note: MeetingNote) => {
      const updated = [...notes, note];
      setNotes(updated);

      // Persist notes
      await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, notes: updated }),
      });
    },
    [notes, meetingId, organizationId],
  );

  const handleEndMeeting = async () => {
    setEnding(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      if (res.ok) {
        router.push(`/dashboard/hr/meetings/${meetingId}`);
      }
    } catch (err) {
      console.error("Failed to end meeting:", err);
    } finally {
      setEnding(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">Loading meeting...</div>
    );
  }

  if (!meeting || !template) {
    return (
      <div className="p-12 text-center text-slate-400">Meeting not found</div>
    );
  }

  const tickedCount = checklistItems.filter((i) => i.manually_ticked).length;
  const allTicked = tickedCount === checklistItems.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="max-w-[900px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {template.name}
            </h1>
            <p className="text-xs text-slate-500">
              {meeting.attendee_name} — Live Meeting
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="rounded-xl"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
            <Button
              onClick={() => setShowClosing(true)}
              disabled={ending}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl gap-2"
            >
              <Square size={14} />
              End Meeting
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[900px] mx-auto p-4 md:p-6 space-y-6">
        {/* Opening script (shown at start) */}
        {!showClosing && (
          <MeetingScriptDisplay
            title="Opening Statement"
            paragraphs={template.opening_script}
          />
        )}

        {/* Live checklist */}
        <MeetingLiveChecklist
          meetingId={meetingId}
          organizationId={organizationId}
          items={checklistItems}
          onItemToggle={setChecklistItems}
        />

        {/* Audio recorder */}
        <MeetingRecorder
          meetingId={meetingId}
          organizationId={organizationId}
          onTranscriptReady={() => setHasTranscript(true)}
        />

        {/* Notes */}
        <MeetingNotesInput notes={notes} onAddNote={handleAddNote} />

        {/* Closing script & end meeting */}
        {showClosing ? (
          <div className="space-y-4">
            <MeetingScriptDisplay
              title="Closing Statement"
              paragraphs={template.closing_script}
            />
            <Button
              onClick={handleEndMeeting}
              disabled={ending}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl gap-2 w-full h-14 text-lg"
            >
              {ending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Square size={18} />
                  Confirm End Meeting
                </>
              )}
            </Button>
          </div>
        ) : (
          allTicked && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-5 border border-green-200 dark:border-green-800 text-center">
              <p className="text-green-700 dark:text-green-300 font-semibold mb-2">
                All checklist items covered
              </p>
              <Button
                onClick={() => setShowClosing(true)}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
              >
                Proceed to Closing
              </Button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
