type SupabaseSessionClient = {
  auth: {
    getSession: () => Promise<{
      data: {
        session: { access_token?: string | null } | null;
      };
    }>;
  };
};

export async function buildClientAuthHeaders(
  supabase: SupabaseSessionClient,
  headers: Record<string, string> = {},
): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) return headers;

  return {
    ...headers,
    Authorization: `Bearer ${session.access_token}`,
  };
}

export async function clientAuthFetch(
  supabase: SupabaseSessionClient,
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = await buildClientAuthHeaders(
    supabase,
    options.headers as Record<string, string>,
  );

  return fetch(url, { ...options, headers });
}
