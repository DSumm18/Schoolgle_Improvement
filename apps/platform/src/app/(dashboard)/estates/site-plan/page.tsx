import { createClient } from "@/lib/supabase/server";
import SitePlanViewer from "./components/SitePlanViewer";

/**
 * Interactive Site Plan Page
 *
 * Shows Grove House Primary School floor plan with:
 * - Interactive pan/zoom using Leaflet.js
 * - Block/room polygons colour-coded by compliance
 * - Click for details, hover for tooltips
 * - Toggle layers for fire equipment, escape routes, etc.
 */
export default async function SitePlanPage() {
  const supabase = await createClient();

  // Get the user's organization to determine which school to load
  const { data: userData } = await supabase.auth.getUser();
  let schoolId: string | null = null;

  if (userData?.user?.id) {
    const { data: memberData } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userData.user.id)
      .limit(1)
      .single();

    if (memberData) {
      schoolId = memberData.organization_id;
    }
  }

  // For demo: use Grove House ID if set, otherwise empty
  // TODO: Replace with actual school lookup
  const groveHouseId = "00000000-0000-0000-0000-000000000001"; // Placeholder

  // Fetch room data for the school
  const { data: rooms } = await supabase
    .from("school_rooms")
    .select("*")
    .eq("school_id", groveHouseId)
    .order("room_name");

  // If no rooms exist, return empty state
  if (!rooms || rooms.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-700 mb-2">Site Plan Not Available</h1>
          <p className="text-gray-500">
            The interactive floor plan hasn't been set up for this school yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Site Plan — Grove House Primary School
          </h1>
          <p className="text-sm text-gray-500">
            Interactive floor plan with compliance status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
            Compliant
          </span>
          <span className="text-xs text-gray-400">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-500 mr-1"></span>
            Action Needed
          </span>
          <span className="text-xs text-gray-400">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
            Overdue
          </span>
        </div>
      </div>

      {/* Map Viewer */}
      <div className="flex-1">
        <SitePlanViewer rooms={rooms} />
      </div>
    </div>
  );
}
