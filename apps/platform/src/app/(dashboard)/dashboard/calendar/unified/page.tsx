import { Metadata } from "next";
import UnifiedCalendar from "@/components/calendar/UnifiedCalendar";

export const metadata: Metadata = {
  title: "Unified Calendar | Schoolgle",
  description: "All school calendar layers in one view — events, lessons, absences, meetings, estates and compliance.",
};

export default function UnifiedCalendarPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-slate-800" style={{ fontFamily: "Poppins, sans-serif" }}>
            Unified Calendar
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            All your school calendars in one view. Toggle layers in the sidebar.
          </p>
        </div>
      </div>

      {/* Calendar fills the rest of the viewport */}
      <div className="flex-1 overflow-hidden">
        <UnifiedCalendar />
      </div>
    </div>
  );
}
