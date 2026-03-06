import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

/**
 * Serves aggregated Ofsted inspection data from real DfE CSV exports.
 *
 * GET /api/data/ofsted?view=region    → National + regional breakdown (5-year inspections)
 * GET /api/data/ofsted?view=la        → All local authorities (5-year inspections)
 * GET /api/data/ofsted?view=la&la=Kent → Single LA detail
 * GET /api/data/ofsted?view=la-list   → List of all LAs with region
 * GET /api/data/ofsted?view=national   → National KPIs (5-year inspections)
 * GET /api/data/ofsted?view=latest     → Latest per-school data (as at Aug 2025)
 * GET /api/data/ofsted?view=latest-la  → Latest per-school by LA
 * GET /api/data/ofsted?view=latest-region → Latest per-school by region
 */
/** Find the content/data directory — works both locally and on Vercel */
function findDataDir(): string | null {
  const candidates = [
    path.resolve(process.cwd(), "..", "..", "content", "data"),
    path.resolve(process.cwd(), "content", "data"),
    path.resolve(process.cwd(), "..", "content", "data"),
    path.join(process.cwd(), "content", "data"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const view = request.nextUrl.searchParams.get("view") || "region";
  const dataDir = findDataDir();
  if (!dataDir) {
    console.error("Could not find content/data directory. cwd:", process.cwd());
    return NextResponse.json(
      { error: "Data directory not found" },
      { status: 500 },
    );
  }

  try {
    if (view === "national") {
      const filePath = path.join(dataDir, "ofsted-national.json");
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { error: "Data not generated" },
          { status: 404 },
        );
      }
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return NextResponse.json(data);
    }

    if (view === "region") {
      const filePath = path.join(dataDir, "ofsted-by-region.json");
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { error: "Data not generated" },
          { status: 404 },
        );
      }
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return NextResponse.json(data);
    }

    if (view === "la-list") {
      const filePath = path.join(dataDir, "la-list.json");
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { error: "Data not generated" },
          { status: 404 },
        );
      }
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return NextResponse.json(data);
    }

    if (view === "la") {
      const filePath = path.join(dataDir, "ofsted-by-la.json");
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { error: "Data not generated" },
          { status: 404 },
        );
      }
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      const laParam = request.nextUrl.searchParams.get("la");
      if (laParam) {
        const laData = data[laParam];
        if (!laData) {
          return NextResponse.json({ error: "LA not found" }, { status: 404 });
        }
        return NextResponse.json({ [laParam]: laData });
      }

      return NextResponse.json(data);
    }

    // Latest per-school data (Aug 2025)
    if (view === "latest") {
      const filePath = path.join(dataDir, "ofsted-latest.json");
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { error: "Data not generated" },
          { status: 404 },
        );
      }
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return NextResponse.json(data);
    }

    if (view === "latest-la") {
      const filePath = path.join(dataDir, "ofsted-latest-by-la.json");
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { error: "Data not generated" },
          { status: 404 },
        );
      }
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const laParam = request.nextUrl.searchParams.get("la");
      if (laParam) {
        const laData = data[laParam];
        if (!laData) {
          return NextResponse.json({ error: "LA not found" }, { status: 404 });
        }
        return NextResponse.json({ [laParam]: laData });
      }
      return NextResponse.json(data);
    }

    if (view === "latest-region") {
      const filePath = path.join(dataDir, "ofsted-latest-by-region.json");
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { error: "Data not generated" },
          { status: 404 },
        );
      }
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: "Invalid view parameter" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error serving Ofsted data:", error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
