// ─── Lesson Studio: PDF Ingestion ──────────────────────────────────────────
// Extracts text from PDF lesson plans. Handles multi-page documents, tables,
// and structured layouts. Uses pdfjs-dist (already in project deps).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
  }
  return pdfjsLib;
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PdfIngestionResult {
  text: string;
  pageCount: number;
  hasStructuredLayout: boolean;
  pages: PageContent[];
}

export interface PageContent {
  pageNumber: number;
  text: string;
  hasTable: boolean;
}

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

// ─── Main Function ─────────────────────────────────────────────────────────

export async function ingestPdf(buffer: Buffer): Promise<PdfIngestionResult> {
  if (!buffer || buffer.length === 0) {
    throw new Error("Cannot ingest empty PDF buffer");
  }

  const pdfjs = await getPdfjs();
  const data = new Uint8Array(buffer);

  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const pages: PageContent[] = [];
  let hasStructuredLayout = false;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items: TextItem[] = textContent.items
      .filter((item: Record<string, unknown>) => typeof item.str === "string")
      .map((item: Record<string, unknown>) => ({
        str: item.str as string,
        transform: item.transform as number[],
        width: item.width as number,
        height: item.height as number,
      }));

    const { text, hasTable } = extractStructuredText(items);

    if (hasTable) {
      hasStructuredLayout = true;
    }

    pages.push({
      pageNumber: pageNum,
      text,
      hasTable,
    });
  }

  const fullText = pages
    .map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`)
    .join("\n\n");

  return {
    text: fullText,
    pageCount: pdf.numPages,
    hasStructuredLayout,
    pages,
  };
}

// ─── Structured Text Extraction ────────────────────────────────────────────

function extractStructuredText(items: TextItem[]): {
  text: string;
  hasTable: boolean;
} {
  if (items.length === 0) {
    return { text: "", hasTable: false };
  }

  // Group items by Y position (same line) with tolerance
  const LINE_TOLERANCE = 3;
  const lines: { y: number; items: TextItem[] }[] = [];

  for (const item of items) {
    const y = item.transform[5]; // Y position from transform matrix
    const existingLine = lines.find(
      (line) => Math.abs(line.y - y) < LINE_TOLERANCE,
    );

    if (existingLine) {
      existingLine.items.push(item);
    } else {
      lines.push({ y, items: [item] });
    }
  }

  // Sort lines top-to-bottom (higher Y = higher on page in PDF coords)
  lines.sort((a, b) => b.y - a.y);

  // Sort items within each line left-to-right by X position
  for (const line of lines) {
    line.items.sort((a, b) => a.transform[4] - b.transform[4]);
  }

  // Detect table-like structure: multiple lines with similar column positions
  const hasTable = detectTableStructure(lines);

  // Build text output
  const textLines: string[] = [];

  for (const line of lines) {
    const lineItems = line.items;
    let lineText = "";

    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      const prevItem = i > 0 ? lineItems[i - 1] : null;

      if (prevItem) {
        const prevEnd = prevItem.transform[4] + prevItem.width;
        const gap = item.transform[4] - prevEnd;
        // Large gap suggests column separator
        if (gap > 20) {
          lineText += " | ";
        } else if (gap > 2) {
          lineText += " ";
        }
      }

      lineText += item.str;
    }

    const trimmed = lineText.trim();
    if (trimmed.length > 0) {
      textLines.push(trimmed);
    }
  }

  return {
    text: textLines.join("\n"),
    hasTable,
  };
}

function detectTableStructure(
  lines: { y: number; items: TextItem[] }[],
): boolean {
  if (lines.length < 3) return false;

  // Count lines with multiple distinct column positions
  let multiColumnLines = 0;
  const columnPositions: Map<number, number> = new Map();

  for (const line of lines) {
    if (line.items.length < 2) continue;

    const xPositions = line.items.map((item) =>
      Math.round(item.transform[4] / 10) * 10,
    );
    const uniqueX = new Set(xPositions);

    if (uniqueX.size >= 2) {
      multiColumnLines++;
      for (const x of uniqueX) {
        columnPositions.set(x, (columnPositions.get(x) || 0) + 1);
      }
    }
  }

  // If many lines share column positions, it's likely a table
  const repeatedColumns = [...columnPositions.values()].filter(
    (count) => count >= 3,
  ).length;

  return multiColumnLines >= 3 && repeatedColumns >= 2;
}
