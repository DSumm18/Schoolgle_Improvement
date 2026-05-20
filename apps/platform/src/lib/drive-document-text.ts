import { parseDocx, parseExcel, parseImage, parsePDF } from "./extractors";

export const GOOGLE_NATIVE_EXPORT: Record<
  string,
  { exportMime: string; outputMime: string }
> = {
  "application/vnd.google-apps.document": {
    exportMime: "text/plain",
    outputMime: "text/plain",
  },
  "application/vnd.google-apps.spreadsheet": {
    exportMime:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    outputMime:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  "application/vnd.google-apps.presentation": {
    exportMime: "application/pdf",
    outputMime: "application/pdf",
  },
  "application/vnd.google-apps.form": {
    exportMime: "text/plain",
    outputMime: "text/plain",
  },
};

const WORD_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const EXCEL_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.ms-excel.sheet.macroEnabled.12",
]);

const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/csv",
  "application/csv",
  "application/json",
]);

export function isSupportedDriveDocumentMimeType(mimeType: string): boolean {
  return (
    mimeType in GOOGLE_NATIVE_EXPORT ||
    mimeType === "application/pdf" ||
    WORD_MIME_TYPES.has(mimeType) ||
    EXCEL_MIME_TYPES.has(mimeType) ||
    TEXT_MIME_TYPES.has(mimeType) ||
    mimeType.startsWith("image/")
  );
}

function buildDriveUrl(
  path: string,
  params: Record<string, string>,
  accessToken?: string | null,
  apiKey?: string | null,
) {
  const search = new URLSearchParams(params);
  if (!accessToken && apiKey) search.set("key", apiKey);
  return `https://www.googleapis.com/drive/v3/${path}?${search}`;
}

async function fetchDriveBuffer(
  url: string,
  accessToken?: string | null,
): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(
    url,
    accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  );

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Failed to download Drive file (${res.status}): ${errorText || res.statusText}`,
    );
  }

  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get("content-type") || "application/octet-stream",
  };
}

async function extractPdfWithVisionFallback(
  buffer: Buffer,
): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) return "";

  const base64 = buffer.toString("base64");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://schoolgle.co.uk",
      "X-Title": "Schoolgle Document Reader",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the readable text from this PDF. Return only the text, preserving headings and bullets where possible.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64}`,
              },
            },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 8000,
    }),
  });

  if (!res.ok) return "";
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function extractTextFromBuffer(input: {
  buffer: Buffer;
  mimeType: string;
  fileName?: string;
}): Promise<{ text: string; extractionMethod: string; limited: boolean }> {
  const { buffer, mimeType } = input;

  if (TEXT_MIME_TYPES.has(mimeType)) {
    return {
      text: buffer.toString("utf8"),
      extractionMethod: "text",
      limited: false,
    };
  }

  if (mimeType === "application/pdf") {
    const text = await parsePDF(buffer);
    const limited =
      text.length < 100 ||
      text.includes("Image-based PDF detected") ||
      text.includes("No text content found");

    if (!limited) {
      return { text, extractionMethod: "pdf_text", limited: false };
    }

    const fallbackText = await extractPdfWithVisionFallback(buffer);
    if (fallbackText.length > 50) {
      return {
        text: fallbackText,
        extractionMethod: "pdf_vision_ocr",
        limited: false,
      };
    }

    return {
      text,
      extractionMethod: "pdf_text_limited",
      limited: true,
    };
  }

  if (WORD_MIME_TYPES.has(mimeType)) {
    const text = await parseDocx(buffer);
    return {
      text,
      extractionMethod: "docx",
      limited: text.length < 100,
    };
  }

  if (EXCEL_MIME_TYPES.has(mimeType)) {
    const text = await parseExcel(buffer);
    return {
      text,
      extractionMethod: "excel",
      limited: text.length < 100,
    };
  }

  if (mimeType.startsWith("image/")) {
    const text = await parseImage(buffer, mimeType);
    return {
      text,
      extractionMethod: "image_ocr",
      limited: text.length < 50,
    };
  }

  return {
    text: "",
    extractionMethod: "unsupported",
    limited: true,
  };
}

export async function extractTextFromDriveFile(input: {
  fileId: string;
  mimeType: string;
  fileName: string;
  accessToken?: string | null;
  apiKey?: string | null;
}): Promise<{ text: string; extractionMethod: string; limited: boolean }> {
  const exportConfig = GOOGLE_NATIVE_EXPORT[input.mimeType];

  if (exportConfig) {
    const url = buildDriveUrl(
      `files/${input.fileId}/export`,
      { mimeType: exportConfig.exportMime },
      input.accessToken,
      input.apiKey,
    );
    const { buffer } = await fetchDriveBuffer(url, input.accessToken);
    return extractTextFromBuffer({
      buffer,
      mimeType: exportConfig.outputMime,
      fileName: input.fileName,
    });
  }

  const url = buildDriveUrl(
    `files/${input.fileId}`,
    { alt: "media" },
    input.accessToken,
    input.apiKey,
  );
  const { buffer, contentType } = await fetchDriveBuffer(url, input.accessToken);

  return extractTextFromBuffer({
    buffer,
    mimeType: input.mimeType || contentType,
    fileName: input.fileName,
  });
}
