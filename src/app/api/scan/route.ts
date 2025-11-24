import { NextRequest, NextResponse } from "next/server";
import { listGoogleFiles, getGoogleFileContent, listOneDriveFiles, getOneDriveFileContent } from "@/lib/cloud-service";
import { parsePDF, parseDocx, parsePPTX, parseExcel, parseImage } from "@/lib/extractors";
import { generateEmbedding } from "@/lib/embeddings";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const { provider, accessToken, folderId } = await req.json();

        if (!provider || !accessToken || !folderId) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        let files = [];
        if (provider === 'google.com') {
            files = await listGoogleFiles(accessToken, folderId);
        } else if (provider === 'microsoft.com') {
            files = await listOneDriveFiles(accessToken, folderId);
        } else {
            return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
        }

        const results = [];

        // Limit to 5 files for MVP to avoid timeout
        const filesToProcess = files.slice(0, 5);

        for (const file of filesToProcess) {
            let text = "";
            let buffer: Buffer | null = null;

            try {
                if (provider === 'google.com') {
                    // Google Drive MimeTypes
                    if (file.mimeType === 'application/pdf') {
                        buffer = await getGoogleFileContent(accessToken, file.id);
                        text = await parsePDF(buffer);
                    } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                        buffer = await getGoogleFileContent(accessToken, file.id);
                        text = await parseDocx(buffer);
                    } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
                        buffer = await getGoogleFileContent(accessToken, file.id);
                        text = await parsePPTX(buffer);
                    } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                        buffer = await getGoogleFileContent(accessToken, file.id);
                        text = await parseExcel(buffer);
                    } else if (file.mimeType === 'image/jpeg' || file.mimeType === 'image/png') {
                        buffer = await getGoogleFileContent(accessToken, file.id);
                        text = await parseImage(buffer, file.mimeType);
                    }
                } else {
                    // OneDrive - check extension or mime
                    const name = file.name.toLowerCase();
                    if (name.endsWith('.pdf')) {
                        buffer = await getOneDriveFileContent(accessToken, file.id);
                        text = await parsePDF(buffer);
                    } else if (name.endsWith('.docx')) {
                        buffer = await getOneDriveFileContent(accessToken, file.id);
                        text = await parseDocx(buffer);
                    } else if (name.endsWith('.pptx')) {
                        buffer = await getOneDriveFileContent(accessToken, file.id);
                        text = await parsePPTX(buffer);
                    } else if (name.endsWith('.xlsx')) {
                        buffer = await getOneDriveFileContent(accessToken, file.id);
                        text = await parseExcel(buffer);
                    } else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) {
                        buffer = await getOneDriveFileContent(accessToken, file.id);
                        text = await parseImage(buffer, 'image/jpeg');
                    } else if (name.endsWith('.png')) {
                        buffer = await getOneDriveFileContent(accessToken, file.id);
                        text = await parseImage(buffer, 'image/png');
                    }
                }

                if (text && !text.startsWith("[") && text.length > 0) {
                    // Generate Embedding
                    const embedding = await generateEmbedding(text);

                    // Store in Supabase
                    const { error } = await supabase.from('documents').insert({
                        content: text,
                        metadata: {
                            filename: file.name,
                            fileId: file.id,
                            mimeType: file.mimeType || 'unknown',
                            provider: provider
                        },
                        embedding: embedding
                    });

                    if (error) {
                        console.error("Supabase Insert Error:", error);
                        results.push({
                            id: file.id,
                            name: file.name,
                            status: "error_saving_to_db",
                            error: error.message
                        });
                    } else {
                        results.push({
                            id: file.id,
                            name: file.name,
                            textSnippet: text.substring(0, 200) + "...",
                            status: "scanned_and_indexed"
                        });
                    }
                } else {
                    results.push({
                        id: file.id,
                        name: file.name,
                        status: "skipped_or_empty",
                        reason: text // e.g. "PDF Content Extraction Disabled..."
                    });
                }

            } catch (err) {
                console.error(`Failed to process file ${file.name}`, err);
                results.push({ id: file.id, name: file.name, status: "error", error: String(err) });
            }
        }

        return NextResponse.json({ results });

    } catch (error) {
        console.error("Scan API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
