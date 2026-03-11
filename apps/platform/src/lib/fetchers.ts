import { supabase } from "./supabase";

export const fetcher = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    // Include Supabase access token so server-side auth can verify the user
    // (the client stores sessions in localStorage, not cookies)
    const headers: Record<string, string> = {};
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const res = await fetch(url, {
      signal: controller.signal,
      headers,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const info = await res.json().catch(() => ({}));
      const error = new Error(
        info.error || "An error occurred while fetching the data.",
      );
      (error as any).status = res.status;
      (error as any).info = info;
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
    .from(key.table as any)
    .select(key.query)
    .eq("organization_id", key.organizationId);

  if (error) throw error;
  return data;
};
