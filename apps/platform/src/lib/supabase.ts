import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Helper to get the current session token for API requests
 */
export async function getSessionToken() {
  if (typeof window === "undefined") return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

/**
 * Authenticated fetch wrapper for client-side API calls.
 * Automatically includes the Supabase session token and organizationId.
 *
 * Usage:
 * ```ts
 * const response = await authFetch("/api/notices?limit=12", { organizationId: "xxx" });
 * const data = await response.json();
 * ```
 */
export async function authFetch(
  url: string,
  options?: RequestInit & { organizationId?: string },
): Promise<Response> {
  if (typeof window === "undefined") {
    throw new Error("authFetch can only be used client-side");
  }

  // Get the session and potentially refresh it
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("[authFetch] Session error:", sessionError);
  }

  // Debug: log if no session
  if (!sessionData?.session?.access_token) {
    console.warn("[authFetch] No active session found - user may need to log in", { sessionData });
    // Return a 401-like response for consistent handling
    return new Response(JSON.stringify({ error: "No active session", code: "NO_SESSION" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build URL with organizationId if provided and not already in URL
  let finalUrl = url;
  if (options?.organizationId && !url.includes("organizationId=")) {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set("organizationId", options.organizationId);
    finalUrl = urlObj.toString();
  }

  // Build headers with auth token
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  // Only set Content-Type for non-GET requests that have a body
  if (options?.method && options.method !== "GET" && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (sessionData.session?.access_token) {
    headers["Authorization"] = `Bearer ${sessionData.session.access_token}`;
  }

  return fetch(finalUrl, {
    ...options,
    headers,
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
  supabase = createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder-key",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  ) as SupabaseClient;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  });
}

export { supabase };
