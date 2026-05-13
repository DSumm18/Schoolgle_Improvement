import { NextResponse } from "next/server";
import { protectedRoute, apiError } from "@/lib/api-utils";
import { locationUploadXlsxTemplate } from "@/lib/location-upload";
import { createServiceRoleClient } from "@/lib/supabase-server";

type LocationExportRow = {
  id: string;
  parent_id: string | null;
  parent_location_id: string | null;
  room_code: string | null;
  name: string | null;
  location_type: string | null;
  current_use: string | null;
  area_sqm: number | null;
  capacity: number | null;
  metadata: {
    building_or_block?: string | null;
    floor?: string | null;
    year_built?: string | null;
    notes?: string | null;
    active?: boolean | null;
  } | null;
};

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("estates_locations")
    .select("id,parent_id,parent_location_id,room_code,name,location_type,current_use,area_sqm,capacity,metadata")
    .eq("organization_id", auth.organizationId)
    .order("room_code", { ascending: true, nullsFirst: false });

  if (error) return apiError(error.message, 500);

  const locations = ((data ?? []) as LocationExportRow[]).filter((location) => location.room_code || location.name);
  const codeById = new Map(locations.map((location) => [location.id, location.room_code || ""]));
  const rows = locations.map((location) => {
    const parentId = location.parent_location_id || location.parent_id;
    return [
      location.room_code || "",
      location.name || "",
      location.location_type || "TBC / Other",
      parentId ? codeById.get(parentId) || "" : "",
      location.metadata?.building_or_block || "",
      location.metadata?.floor || "",
      location.current_use || "",
      location.area_sqm == null ? "" : String(location.area_sqm),
      location.capacity == null ? "" : String(location.capacity),
      location.metadata?.year_built || "",
      location.metadata?.notes || "",
      location.metadata?.active === false ? "no" : "yes",
    ];
  });

  const buffer = await locationUploadXlsxTemplate(rows);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="schoolgle-locations-current.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}, { requiredRole: "slt" });
