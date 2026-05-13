import { NextResponse } from "next/server";
import { buildStaffImportExcelHtml, buildStaffImportTemplateCsv } from "@/lib/staff-import-template";

export function GET(request: Request) {
  const url = new URL(request.url);
  const inline = url.searchParams.get("inline") === "true";
  const format = url.searchParams.get("format");

  if (format === "excel") {
    return new NextResponse(buildStaffImportExcelHtml(), {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": 'attachment; filename="staff_directory_template_styled.xls"',
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(buildStaffImportTemplateCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": inline
        ? 'inline; filename="staff_directory_template.csv"'
        : 'attachment; filename="staff_directory_template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
