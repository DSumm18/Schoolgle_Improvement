import mammoth from 'mammoth';
// @ts-ignore
// import officeParser from 'officeparser';
// @ts-ignore
// import PDFParser from 'pdf2json';
import * as XLSX from 'xlsx';
import OpenAI from 'openai';

export async function parsePDF(buffer: Buffer): Promise<string> {
    // PDF extraction temporarily disabled due to build environment constraints with pdf2json.
    // TODO: Implement using a robust server-side parser or external service.
    return "[PDF Content Extraction Disabled in MVP - Use External Service]";
}

export async function parseDocx(buffer: Buffer): Promise<string> {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        console.error("Error parsing DOCX:", error);
        return "";
    }
}

export async function parsePPTX(buffer: Buffer): Promise<string> {
    // PPTX extraction temporarily disabled due to build environment constraints.
    return "[PPTX Content Extraction Disabled in MVP]";
}

export async function parseExcel(buffer: Buffer): Promise<string> {
    try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        let text = "";
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            text += `Sheet: ${sheetName}\n`;
            text += XLSX.utils.sheet_to_csv(sheet);
            text += "\n";
        });
        return text;
    } catch (error) {
        console.error("Error parsing Excel:", error);
        return "";
    }
}

export async function parseImage(buffer: Buffer, mimeType: string): Promise<string> {
    try {
        if (!process.env.OPENAI_API_KEY && !process.env.VITE_OPENROUTER_API_KEY) {
            console.warn("OpenAI API Key missing for Image OCR");
            return "[Image OCR Disabled - Missing API Key]";
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENROUTER_API_KEY,
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
            model: "openai/gpt-4o", // OpenRouter model ID
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

        return response.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Error parsing Image:", error);
        return "";
    }
}
