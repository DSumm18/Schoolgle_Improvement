import { supabase } from "./supabase";

interface FetcherError extends Error {
  status?: number;
  info?: unknown;
}

export const fetcher = async (url: string, init: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    // Include Supabase access token so server-side auth can verify the user
    // (the client stores sessions in localStorage, not cookies)
    const headers = new Headers(init.headers);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const info = await res.json().catch(() => ({}));
      const error: FetcherError = new Error(
        info.error || "An error occurred while fetching the data.",
      );
      error.status = res.status;
      error.info = info;
      throw error;
    }
    return res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  }
};

export const supabaseFetcher = async (key: {
  table: string;
  query: string;
  organizationId: string;
}) => {
  const { data, error } = await supabase
    .from(key.table as never)
    .select(key.query)
    .eq("organization_id", key.organizationId);

  if (error) throw error;
  return data;
};
