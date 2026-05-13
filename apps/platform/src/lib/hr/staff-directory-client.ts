import type { StaffMember } from "@/lib/staff-directory";
import { supabase } from "@/lib/supabase";

type StaffPayload = Partial<StaffMember> & {
  organization_id?: string;
};

function cleanPayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

export async function saveStaffMember(
  staff: StaffPayload,
  fetcher: typeof fetch = fetch,
) {
  const { id, organization_id, ...rest } = staff;
  const method = id ? "PUT" : "POST";
  const body = id
    ? cleanPayload({ id, ...rest, salutation: rest.salutation || undefined })
    : cleanPayload({
        ...rest,
        salutation: rest.salutation || undefined,
        organizationId: organization_id,
      });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetcher("/api/staff", {
    method,
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = "Failed to save staff member";
    try {
      const errorBody = await response.json();
      message = errorBody.error || errorBody.message || message;
    } catch {
      // Keep the generic message if the API does not return JSON.
    }
    throw new Error(message);
  }

  return response.json();
}
