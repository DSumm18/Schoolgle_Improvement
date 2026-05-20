import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import {
  extractTextFromBuffer,
  isSupportedDriveDocumentMimeType,
} from "./drive-document-text";

describe("drive-document-text", () => {
  it("recognises Drive document formats used by Ofsted evidence scans", () => {
    expect(isSupportedDriveDocumentMimeType("application/pdf")).toBe(true);
    expect(
      isSupportedDriveDocumentMimeType(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe(true);
    expect(
      isSupportedDriveDocumentMimeType("application/vnd.google-apps.document"),
    ).toBe(true);
    expect(
      isSupportedDriveDocumentMimeType(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ),
    ).toBe(true);
    expect(isSupportedDriveDocumentMimeType("image/png")).toBe(true);
  });

  it("extracts text from plain text and CSV style uploads", async () => {
    const result = await extractTextFromBuffer({
      buffer: Buffer.from("Safeguarding policy,Compliant\nReview,2026"),
      mimeType: "text/csv",
    });

    expect(result.extractionMethod).toBe("text");
    expect(result.limited).toBe(false);
    expect(result.text).toContain("Safeguarding policy");
  });

  it("extracts workbook content for spreadsheet evidence", async () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Requirement", "Status"],
      ["Safeguarding", "Compliant"],
      ["Review date", "September 2026"],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Checks");

    const buffer = Buffer.from(
      XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
    );

    const result = await extractTextFromBuffer({
      buffer,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    expect(result.extractionMethod).toBe("excel");
    expect(result.text).toContain("Sheet: Checks");
    expect(result.text).toContain("Safeguarding");
    expect(result.text).toContain("September 2026");
  });
});
