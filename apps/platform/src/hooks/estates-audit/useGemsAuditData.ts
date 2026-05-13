import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";
import { DEMO_SCHOOLS } from "@/lib/estates-audit/demo-data";
import type { GemsAuditResponse } from "@/types/estates-audit";

interface UseGemsAuditDataOptions {
  organizationId?: string;
  demo?: boolean;
}

const DEMO_RESPONSE: GemsAuditResponse = {
  source: "demo",
  schools: DEMO_SCHOOLS,
  summary: {
    schoolCount: DEMO_SCHOOLS.length,
    averageScore:
      DEMO_SCHOOLS.length > 0
        ? Math.round(
            DEMO_SCHOOLS.reduce((sum, school) => sum + school.overallScore, 0) /
              DEMO_SCHOOLS.length,
          )
        : 0,
    gaps: 0,
    domainCount: DEMO_SCHOOLS[0]?.categories.length ?? 0,
  },
};

export function useGemsAuditData({
  organizationId,
  demo = false,
}: UseGemsAuditDataOptions) {
  const key =
    organizationId && !demo
      ? `/api/estates/gems-audit?organizationId=${organizationId}`
      : null;

  const { data, error, isLoading, mutate } = useSWR<GemsAuditResponse>(
    key,
    fetcher,
  );

  if (demo) {
    return {
      data: DEMO_RESPONSE,
      schoolData: DEMO_RESPONSE.schools,
      loading: false,
      error: null,
      mutate,
    };
  }

  return {
    data,
    schoolData: data?.schools ?? [],
    loading: Boolean(organizationId) && isLoading,
    error:
      error instanceof Error
        ? error.message
        : !organizationId
          ? "Select an organisation to build the GEMS audit."
          : null,
    mutate,
  };
}
