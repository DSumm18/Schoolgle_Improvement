import mammoth from 'mammoth';
// import officeParser from 'officeparser'; // Disabled - not used
import * as XLSX from 'xlsx';
import OpenAI from 'openai';
// pdfjs-dist is dynamically imported to avoid DOMMatrix error in Node.js
import { logger } from './logger';

// Lazy-loaded PDF.js instance
let pdfjsLib: any = null;

async function getPdfjs() {
    if (!pdfjsLib) {
        // Dynamic import to avoid build-time issues with DOMMatrix
        pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        // Configure worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    }
    return pdfjsLib;
}

/**
 * Parse PDF files using pdf.js
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
    const context = { function: 'parsePDF', file: 'extractors.ts' };

    try {
        logger.debug('Starting PDF extraction', context, { bufferSize: buffer.length });

        // Get lazy-loaded pdfjs
        const pdfjs = await getPdfjs();

        // Convert Buffer to Uint8Array for pdfjs-dist
        const data = new Uint8Array(buffer);

        // Load the PDF document
        const loadingTask = pdfjs.getDocument({
            data: data,
            useSystemFonts: true,
        });

        const pdf = await loadingTask.promise;
        let fullText = '';

        logger.debug('PDF loaded successfully', context, { pageCount: pdf.numPages });

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            try {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();

                // Combine text items with spaces
                const pageText = textContent.items
                    .map((item: any) => {
                        // Handle text items with str property
                        return item.str || '';
                    })
                    .join(' ');

                fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
            } catch (pageError) {
                logger.warn(`Error extracting PDF page ${pageNum}`, context, pageError);
                fullText += `\n--- Page ${pageNum} ---\n[Error extracting page content]\n`;
            }
        }

        // Clean up extra whitespace
        fullText = fullText.replace(/\s+/g, ' ').trim();

        // If we got very little text, it might be an image-based PDF
        if (fullText.length < 100 && pdf.numPages > 0) {
            logger.warn('Image-based PDF detected with limited text', context, { textLength: fullText.length });
            return "[Image-based PDF detected - Limited text extraction. Consider using OCR service for better results]";
        }

        if (!fullText) {
            logger.warn('No text content found in PDF', context);
            return "[No text content found in PDF]";
        }

        logger.info('PDF extraction successful', context, {
            pageCount: pdf.numPages,
            textLength: fullText.length
        });

        return fullText;

    } catch (error: any) {
        logger.error('PDF extraction failed', context, error);

        // Handle specific error cases
        if (error.message?.includes('password') || error.message?.includes('encrypted')) {
            return "[PDF is password-protected or encrypted - Cannot extract text]";
        }

        if (error.message?.includes('Invalid PDF')) {
            return "[Invalid or corrupted PDF file]";
        }

        return `[PDF extraction error: ${error.message || 'Unknown error'}]`;
    }
}

/**
 * Parse DOCX files using mammoth
 */
export async function parseDocx(buffer: Buffer): Promise<string> {
    const context = { function: 'parseDocx', file: 'extractors.ts' };

    try {
        logger.debug('Starting DOCX extraction', context, { bufferSize: buffer.length });

        const result = await mammoth.extractRawText({ buffer });

        if (!result.value || result.value.length === 0) {
            logger.warn('DOCX extraction returned empty content', context);
            return "";
        }

        logger.info('DOCX extraction successful', context, {
            textLength: result.value.length,
            hasMessages: result.messages.length > 0
        });

        // Log any warnings from mammoth
        if (result.messages.length > 0) {
            logger.debug('Mammoth extraction warnings', context, {
                warnings: result.messages.map(m => m.message)
            });
        }

        return result.value;
    } catch (error) {
        logger.error('DOCX extraction failed', context, error);
        return "";
    }
}

/**
 * Parse PPTX files
 * Currently disabled due to build constraints
 */
export async function parsePPTX(buffer: Buffer): Promise<string> {
    logger.warn('PPTX extraction attempted but currently disabled', {
        function: 'parsePPTX',
        file: 'extractors.ts'
    });
    // PPTX extraction temporarily disabled due to build environment constraints.
    return "[PPTX Content Extraction Disabled in MVP]";
}

/**
 * Parse Excel files using xlsx
 */
export async function parseExcel(buffer: Buffer): Promise<string> {
    const context = { function: 'parseExcel', file: 'extractors.ts' };

    try {
        logger.debug('Starting Excel extraction', context, { bufferSize: buffer.length });

        const workbook = XLSX.read(buffer, { type: 'buffer' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            logger.warn('Excel file contains no sheets', context);
            return "";
        }

        let text = "";
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            text += `Sheet: ${sheetName}\n`;
            text += XLSX.utils.sheet_to_csv(sheet);
            text += "\n";
        });

        if (!text || text.length < 10) {
            logger.warn('Excel extraction returned minimal content', context, { textLength: text.length });
            return "";
        }

        logger.info('Excel extraction successful', context, {
            sheetCount: workbook.SheetNames.length,
            textLength: text.length
        });

        return text;
    } catch (error) {
        logger.error('Excel extraction failed', context, error);
        return "";
    }
}

/**
 * Parse images using OpenAI Vision API
 */
export async function parseImage(buffer: Buffer, mimeType: string): Promise<string> {
    const context = { function: 'parseImage', file: 'extractors.ts', mimeType };

    try {
        // Check for API key
        if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
            logger.warn('Image OCR attempted without API key', context);
            return "[Image OCR Disabled - Missing API Key]";
        }

        logger.debug('Starting image OCR', context, { bufferSize: buffer.length });

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY,
            baseURL: "https://openrouter.ai/api/v1",
            dangerouslyAllowBrowser: true,
            defaultHeaders: {
                "HTTP-Referer": "https://schoolgle.co.uk",
                "X-Title": "Schoolgle",
            }
        });

        const base64Image = buffer.toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64Image}`;

        const response = await openai.chat.completions.create({
            model: "openai/gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Transcribe the text in this image exactly. Do not add commentary." },
                        {
                            type: "image_url",
                            image_url: {
                                "url": dataUrl,
                            },
                        },
                    ],
                },
            ],
        });

        const extractedText = response.choices[0]?.message?.content || "";

        if (!extractedText) {
            logger.warn('Image OCR returned no text', context);
            return "";
        }

        logger.info('Image OCR successful', context, {
            textLength: extractedText.length,
            model: response.model,
            usage: response.usage
        });

        return extractedText;
    } catch (error) {
        logger.error('Image OCR failed', context, error);

        // Don't throw error for OCR failures, just return empty string
        // OCR is best-effort
        return "";
    }
}
