/**
 * Trust Search API
 *
 * Searches DfE database for trusts by name or URN.
 * Returns all schools belonging to the trust.
 *
 * GET /api/onboarding/search-trust?query=Pennine
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("query");

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Query parameter must be at least 2 characters" },
      { status: 400 }
    );
  }

  // Supabase clients
  const mainSupabase = createClient();
  const dfeSupabase = createClient(
    process.env.DFE_SUPABASE_URL!,
    process.env.DFE_SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Search DfE database for trust
    const { data: trusts, error: trustError } = await dfeSupabase
      .from("establishments")
      .select("trust_name, trust_code, la_name, urn, establishment_name, phase, total_pupils")
      .or(`trust_name.ilike.%${query}%,trust_code.ilike.%${query}%`)
      .not("trust_name", "is", null)
      .not("trust_code", "is", null)
      .order("establishment_name", { ascending: true })
      .limit(100);

    if (trustError) {
      console.error("Trust search error:", trustError);
      return NextResponse.json(
        { error: "Failed to search DfE database" },
        { status: 500 }
      );
    }

    if (!trusts || trusts.length === 0) {
      return NextResponse.json({
        found: false,
        message: "No trusts found matching your search",
        suggestion: "Try searching by trust name or Companies House number"
      });
    }

    // Group schools by trust
    const trustGroups = new Map<string, any[]>();

    for (const school of trusts) {
      const trustKey = `${school.trust_name}|${school.trust_code}`;

      if (!trustGroups.has(trustKey)) {
        trustGroups.set(trustKey, []);
      }

      trustGroups.get(trustKey)!.push({
        urn: school.urn,
        name: school.establishment_name,
        phase: school.phase,
        pupilCount: school.total_pupils || 0,
        localAuthority: school.la_name
      });
    }

    // Format response
    const results = Array.from(trustGroups.entries()).map(([key, schools]) => {
      const [trustName, trustCode] = key.split("|");

      // Count schools by phase
      const primaryCount = schools.filter((s: any) => s.phase?.toLowerCase().includes("primary")).length;
      const secondaryCount = schools.filter((s: any) => s.phase?.toLowerCase().includes("secondary")).length;
      const totalPupils = schools.reduce((sum: number, s: any) => sum + (s.pupilCount || 0), 0);

      return {
        trustName,
        trustCode,
        schoolCount: schools.length,
        breakdown: {
          primary: primaryCount,
          secondary: secondaryCount,
          totalPupils
        },
        schools: schools.sort((a: any, b: any) => a.name.localeCompare(b.name))
      };
    });

    return NextResponse.json({
      found: true,
      query,
      resultCount: results.length,
      trusts: results
    });

  } catch (error) {
    console.error("Trust search error:", error);
    return NextResponse.json(
      { error: "Failed to search for trust" },
      { status: 500 }
    );
  }
});
