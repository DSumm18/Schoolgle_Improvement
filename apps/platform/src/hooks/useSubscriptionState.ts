"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";
import type { SubscriptionState } from "@/lib/subscription/state";

export function useSubscriptionState(organizationId: string | null | undefined) {
  const url = organizationId
    ? `/api/subscription/state?organizationId=${organizationId}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<{ data: SubscriptionState }>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      // Treat HTTP errors as "no subscription" rather than throwing
      shouldRetryOnError: false,
    },
  );

  return {
    state: data?.data ?? null,
    error,
    isLoading,
    refresh: mutate,
  };
}
