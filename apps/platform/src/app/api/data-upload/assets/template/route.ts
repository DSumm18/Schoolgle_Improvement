import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { assetUploadExcelTemplate, assetUploadTemplate } from "@/lib/asset-upload";

export function GET(request: NextRequest) {
  const inline = request.nextUrl.searchParams.get("inline") === "true";
  const format = request.nextUrl.searchParams.get("format");

  if (format === "excel") {
    return new NextResponse(assetUploadExcelTemplate(), {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": 'attachment; filename="schoolgle-assets-template-styled.xls"',
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(assetUploadTemplate(), {
    headers: {
      "Content-Type": inline ? "text/plain; charset=utf-8" : "text/csv; charset=utf-8",
      "Content-Disposition": inline
        ? 'inline; filename="schoolgle-assets-template.csv"'
        : 'attachment; filename="schoolgle-assets-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
