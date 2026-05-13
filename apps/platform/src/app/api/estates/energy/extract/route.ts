/**
 * Energy Invoice Extraction API
 *
 * POST /api/estates/energy/extract
 *
 * Accepts a Google Drive file ID or raw base64 PDF, runs AI extraction,
 * and stores structured data in Supabase.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { extractEnergyInvoice } from "@/lib/energy/invoice-extractor";
import { saveEnergyExtraction } from "@/lib/energy/invoice-persistence";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export const POST = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const { fileId, fileName, pdfBase64: providedBase64 } = body;
  const orgId = auth.organizationId;

  if (!orgId) return apiError("Missing organizationId", 400);
  if (!fileId && !providedBase64) {
    return apiError("Provide either fileId (Drive) or pdfBase64", 400);
  }

  let pdfBase64: string;

  if (providedBase64) {
    pdfBase64 = providedBase64;
  } else {
    if (!GOOGLE_API_KEY) {
      return apiError("Google API key not configured", 500);
    }

    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_API_KEY}`,
    );

    if (!driveRes.ok) {
      return apiError(
        `Failed to download file from Drive: ${driveRes.status}`,
        driveRes.status,
      );
    }

    const buffer = Buffer.from(await driveRes.arrayBuffer());
    pdfBase64 = buffer.toString("base64");
  }

  const result = await extractEnergyInvoice(
    pdfBase64,
    fileName || "invoice.pdf",
  );
  const saved = await saveEnergyExtraction({
    organizationId: orgId,
    fileId,
    fileName: fileName || null,
    result,
  });

  return apiSuccess(saved);
});
