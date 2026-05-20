import mammoth from "mammoth";
// import officeParser from 'officeparser'; // Disabled - not used
import * as XLSX from "xlsx";
import OpenAI from "openai";
// pdfjs-dist is dynamically imported to avoid DOMMatrix error in Node.js
import { logger } from "./logger";

type PdfjsTextItem = { str?: string };
type PdfjsTextContent = { items: PdfjsTextItem[] };
type PdfjsPage = { getTextContent: () => Promise<PdfjsTextContent> };
type PdfjsDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfjsPage>;
};
type PdfjsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (options: {
    data: Uint8Array;
    useSystemFonts: boolean;
    disableWorker: boolean;
  }) => { promise: Promise<PdfjsDocument> };
};
type Pdf2JsonRun = { T: string };
type Pdf2JsonText = { R: Pdf2JsonRun[] };
type Pdf2JsonPage = { Texts: Pdf2JsonText[] };
type Pdf2JsonData = { Pages: Pdf2JsonPage[] };

// Lazy-loaded PDF.js instance
let pdfjsLib: PdfjsModule | null = null;
let preferPdf2json = false;

async function getPdfjs() {
  if (!pdfjsLib) {
    // Dynamic import to avoid build-time issues with DOMMatrix
    pdfjsLib = (await import(
      "pdfjs-dist/legacy/build/pdf.mjs"
    )) as unknown as PdfjsModule;
    // Configure worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = "";
  }
  return pdfjsLib;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : String(error || "Unknown error");
}

/**
 * Parse PDF files using pdf.js
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  const context = { function: "parsePDF", file: "extractors.ts" };

  try {
    logger.debug("Starting PDF extraction", context, {
      bufferSize: buffer.length,
    });

    if (preferPdf2json) {
      const fallbackText = await tryParsePDFWithPdf2json(buffer, context);
      if (fallbackText) return fallbackText;
    }

    // Get lazy-loaded pdfjs
    const pdfjs = await getPdfjs();

    // Convert Buffer to Uint8Array for pdfjs-dist
    const data = new Uint8Array(buffer);

    // Load the PDF document
    const loadingTask = pdfjs.getDocument({
      data: data,
      useSystemFonts: true,
      disableWorker: true,
    });

    const pdf = await loadingTask.promise;
    let fullText = "";

    logger.debug("PDF loaded successfully", context, {
      pageCount: pdf.numPages,
    });

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Combine text items with spaces
        const pageText = textContent.items
          .map((item) => {
            // Handle text items with str property
            return item.str || "";
          })
          .join(" ");

        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
      } catch (pageError) {
        logger.warn(`Error extracting PDF page ${pageNum}`, context, pageError);
        fullText += `\n--- Page ${pageNum} ---\n[Error extracting page content]\n`;
      }
    }

    // Clean up extra whitespace
    fullText = fullText.replace(/\s+/g, " ").trim();

    // If we got very little text, it might be an image-based PDF
    if (fullText.length < 100 && pdf.numPages > 0) {
      logger.warn("Image-based PDF detected with limited text", context, {
        textLength: fullText.length,
      });
      return "[Image-based PDF detected - Limited text extraction. Consider using OCR service for better results]";
    }

    if (!fullText) {
      logger.warn("No text content found in PDF", context);
      return "[No text content found in PDF]";
    }

    logger.info("PDF extraction successful", context, {
      pageCount: pdf.numPages,
      textLength: fullText.length,
    });

    return fullText;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    if (
      errorMessage.includes("fake worker") ||
      errorMessage.includes("workerSrc")
    ) {
      preferPdf2json = true;
    }

    logger.warn(
      "pdfjs-dist extraction failed, trying pdf2json fallback",
      context,
      error,
    );

    // Fallback to pdf2json which works better in Node.js server environments
    const fallbackText = await tryParsePDFWithPdf2json(buffer, context);
    if (fallbackText) return fallbackText;

    // Handle specific error cases
    if (
      errorMessage.includes("password") ||
      errorMessage.includes("encrypted")
    ) {
      return "[PDF is password-protected or encrypted - Cannot extract text]";
    }

    if (errorMessage.includes("Invalid PDF")) {
      return "[Invalid or corrupted PDF file]";
    }

    return `[PDF extraction error: ${errorMessage}]`;
  }
}

async function tryParsePDFWithPdf2json(
  buffer: Buffer,
  context: { function: string; file: string },
): Promise<string | null> {
  try {
    const text = await parsePDFWithPdf2json(buffer);
    if (text && text.length > 50) {
      logger.info("pdf2json fallback successful", context, {
        textLength: text.length,
      });
      return text;
    }
  } catch (fallbackError) {
    logger.warn("pdf2json fallback also failed", context, fallbackError);
  }

  return null;
}

/**
 * Fallback PDF parser using pdf2json (works better in Node.js)
 */
function safeDecodePdfText(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    try {
      return decodeURIComponent(value.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
    } catch {
      return value.replace(/%20/g, " ");
    }
  }
}

async function parsePDFWithPdf2json(buffer: Buffer): Promise<string> {
  const PDFParser = (await import("pdf2json")).default;

  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    const timeout = setTimeout(() => {
      reject(new Error("pdf2json timed out after 30s"));
    }, 30000);

    parser.on("pdfParser_dataReady", (data: Pdf2JsonData) => {
      clearTimeout(timeout);
      try {
        const text = data.Pages.map((page, idx) => {
          const pageText = page.Texts.map((textItem) =>
            safeDecodePdfText(textItem.R.map((run) => run.T).join("")),
          ).join(" ");
          return `--- Page ${idx + 1} ---\n${pageText}`;
        }).join("\n\n");
        resolve(text);
      } catch (e) {
        reject(e);
      }
    });

    parser.on("pdfParser_dataError", (err: unknown) => {
      clearTimeout(timeout);
      reject(err);
    });

    parser.parseBuffer(buffer);
  });
}

/**
 * Parse DOCX files using mammoth
 */
export async function parseDocx(buffer: Buffer): Promise<string> {
  const context = { function: "parseDocx", file: "extractors.ts" };

  try {
    logger.debug("Starting DOCX extraction", context, {
      bufferSize: buffer.length,
    });

    const result = await mammoth.extractRawText({ buffer });

    if (!result.value || result.value.length === 0) {
      logger.warn("DOCX extraction returned empty content", context);
      return "";
    }

    logger.info("DOCX extraction successful", context, {
      textLength: result.value.length,
      hasMessages: result.messages.length > 0,
    });

    // Log any warnings from mammoth
    if (result.messages.length > 0) {
      logger.debug("Mammoth extraction warnings", context, {
        warnings: result.messages.map((m) => m.message),
      });
    }

    return result.value;
  } catch (error) {
    logger.error("DOCX extraction failed", context, error);
    return "";
  }
}

/**
 * Parse PPTX files
 * Currently disabled due to build constraints
 */
export async function parsePPTX(buffer: Buffer): Promise<string> {
  void buffer;
  logger.warn("PPTX extraction attempted but currently disabled", {
    function: "parsePPTX",
    file: "extractors.ts",
  });
  // PPTX extraction temporarily disabled due to build environment constraints.
  return "[PPTX Content Extraction Disabled in MVP]";
}

/**
 * Parse Excel files using xlsx
 */
export async function parseExcel(buffer: Buffer): Promise<string> {
  const context = { function: "parseExcel", file: "extractors.ts" };

  try {
    logger.debug("Starting Excel extraction", context, {
      bufferSize: buffer.length,
    });

    const workbook = XLSX.read(buffer, { type: "buffer" });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      logger.warn("Excel file contains no sheets", context);
      return "";
    }

    let text = "";
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      text += `Sheet: ${sheetName}\n`;
      text += XLSX.utils.sheet_to_csv(sheet);
      text += "\n";
    });

    if (!text || text.length < 10) {
      logger.warn("Excel extraction returned minimal content", context, {
        textLength: text.length,
      });
      return "";
    }

    logger.info("Excel extraction successful", context, {
      sheetCount: workbook.SheetNames.length,
      textLength: text.length,
    });

    return text;
  } catch (error) {
    logger.error("Excel extraction failed", context, error);
    return "";
  }
}

/**
 * Parse images using OpenAI Vision API
 */
export async function parseImage(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const context = { function: "parseImage", file: "extractors.ts", mimeType };

  try {
    // Check for API key
    if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
      logger.warn("Image OCR attempted without API key", context);
      return "[Image OCR Disabled - Missing API Key]";
    }

    logger.debug("Starting image OCR", context, { bufferSize: buffer.length });

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        "HTTP-Referer": "https://schoolgle.co.uk",
        "X-Title": "Schoolgle",
      },
    });

    const base64Image = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe the text in this image exactly. Do not add commentary.",
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
    });

    const extractedText = response.choices[0]?.message?.content || "";

    if (!extractedText) {
      logger.warn("Image OCR returned no text", context);
      return "";
    }

    logger.info("Image OCR successful", context, {
      textLength: extractedText.length,
      model: response.model,
      usage: response.usage,
    });

    return extractedText;
  } catch (error) {
    logger.error("Image OCR failed", context, error);

    // Don't throw error for OCR failures, just return empty string
    // OCR is best-effort
    return "";
  }
}
