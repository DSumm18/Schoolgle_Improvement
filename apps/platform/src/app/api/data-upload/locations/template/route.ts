import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locationUploadTemplate, locationUploadXlsxTemplate } from "@/lib/location-upload";

export async function GET(request: NextRequest) {
  const inline = request.nextUrl.searchParams.get("inline") === "true";
  const format = request.nextUrl.searchParams.get("format");

  if (format === "excel" || format === "xlsx") {
    const buffer = await locationUploadXlsxTemplate();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="schoolgle-locations-template.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(locationUploadTemplate(), {
    headers: {
      "Content-Type": inline ? "text/plain; charset=utf-8" : "text/csv; charset=utf-8",
      "Content-Disposition": inline
        ? 'inline; filename="schoolgle-locations-template.csv"'
        : 'attachment; filename="schoolgle-locations-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
