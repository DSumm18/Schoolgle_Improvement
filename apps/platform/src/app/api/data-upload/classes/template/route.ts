import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { classUploadExcelTemplate, classUploadTemplate } from "@/lib/class-upload";

export function GET(request: NextRequest) {
  const inline = request.nextUrl.searchParams.get("inline") === "true";
  const format = request.nextUrl.searchParams.get("format");

  if (format === "excel") {
    return new NextResponse(classUploadExcelTemplate(), {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": 'attachment; filename="schoolgle-class-upload-template-styled.xls"',
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(classUploadTemplate(), {
    headers: {
      "Content-Type": inline ? "text/plain; charset=utf-8" : "text/csv; charset=utf-8",
      "Content-Disposition": inline
        ? 'inline; filename="schoolgle-class-upload-template.csv"'
        : 'attachment; filename="schoolgle-class-upload-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
