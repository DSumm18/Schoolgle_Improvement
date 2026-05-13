import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { pupilUploadExcelTemplate, pupilUploadTemplate } from "@/lib/pupil-pass";

export function GET(request: NextRequest) {
  const inline = request.nextUrl.searchParams.get("inline") === "true";
  const format = request.nextUrl.searchParams.get("format");

  if (format === "excel") {
    return new NextResponse(pupilUploadExcelTemplate(), {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": 'attachment; filename="schoolgle-pupil-upload-template-styled.xls"',
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(pupilUploadTemplate(), {
    headers: {
      "Content-Type": inline ? "text/plain; charset=utf-8" : "text/csv; charset=utf-8",
      "Content-Disposition": inline
        ? 'inline; filename="schoolgle-pupil-upload-template.csv"'
        : 'attachment; filename="schoolgle-pupil-upload-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
