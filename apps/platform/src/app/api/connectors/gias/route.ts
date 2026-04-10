import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  getSchoolByURN,
  searchSchools,
  getSchoolSummary,
} from "@/lib/connectors/gias/service";
import type { GIASConnectorError } from "@/lib/connectors/gias/types";

export const GET = protectedRoute(async (_auth, request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const urn = searchParams.get("urn");
  const search = searchParams.get("search");
  const summary = searchParams.get("summary") === "true";

  if (!urn && !search) {
    return apiError(
      "Missing required parameter: provide ?urn= or ?search=",
      400,
      "MISSING_PARAM",
    );
  }

  try {
    if (urn) {
      const urnNumber = parseInt(urn, 10);
      if (isNaN(urnNumber)) {
        return apiError("URN must be a number", 400, "INVALID_URN");
      }

      if (summary) {
        const result = await getSchoolSummary(urnNumber);
        return apiSuccess({ school: result });
      }

      const school = await getSchoolByURN(urnNumber);
      return apiSuccess({ school });
    }

    if (search) {
      if (search.length < 2) {
        return apiError(
          "Search query must be at least 2 characters",
          400,
          "QUERY_TOO_SHORT",
        );
      }
      const results = await searchSchools(search);
      return apiSuccess({ schools: results, total: results.length, query: search });
    }

    return apiError("Invalid request", 400);
  } catch (err) {
    const connectorError = err as GIASConnectorError;
    if (connectorError.code === "NOT_FOUND") {
      return apiError(connectorError.message, 404, "NOT_FOUND");
    }
    if (connectorError.code === "INVALID_URN") {
      return apiError(connectorError.message, 400, "INVALID_URN");
    }
    return apiError(
      connectorError.message || "Failed to fetch GIAS data",
      502,
      "GIAS_ERROR",
    );
  }
});
