/**
 * API Route: Extract Text from File
 *
 * Extracts text from uploaded files (PDF, DOCX, XLSX, images).
 * POST /api/estates-compliance/extract-text
 */

import { NextRequest, NextResponse } from 'next/server';
import { parsePDF, parseDocx, parseExcel, parseImage } from '@/lib/extractors';

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds timeout

/**
 * POST /api/estates-compliance/extract-text
 *
 * Extracts text from an uploaded file.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || getMimeTypeFromFileName(file.name);

    let extractedText = '';

    // Extract text based on file type
    if (mimeType.includes('pdf')) {
      extractedText = await parsePDF(buffer);
    } else if (mimeType.includes('wordprocessingml.document')) {
      extractedText = await parseDocx(buffer);
    } else if (mimeType.includes('sheet')) {
      extractedText = await parseExcel(buffer);
    } else if (mimeType.includes('image')) {
      extractedText = await parseImage(buffer, mimeType);
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType}` },
        { status: 400 }
      );
    }

    // Check if extraction was successful
    if (!extractedText || extractedText.length < 10) {
      return NextResponse.json(
        {
          error: 'Could not extract text from file',
          text: extractedText,
          hint: 'The file may be image-based or password-protected'
        },
        { status: 422 }
      );
    }

    // Check for error messages
    if (extractedText.startsWith('[') && extractedText.includes(']')) {
      return NextResponse.json(
        {
          error: 'Text extraction issue',
          text: extractedText,
          message: extractedText
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: extractedText,
      fileName: file.name,
      fileSize: file.size,
      mimeType,
      textLength: extractedText.length
    });

  } catch (error: any) {
    console.error('Error extracting text:', error);

    return NextResponse.json(
      {
        error: 'Failed to extract text from file',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get MIME type from file name
 */
function getMimeTypeFromFileName(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();

  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
