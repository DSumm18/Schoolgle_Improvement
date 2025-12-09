import { NextRequest } from "next/server";
import {
    listGoogleFilesRecursive,
    listOneDriveFilesRecursive,
    getGoogleFileContent,
    getOneDriveFileContent,
    exportGoogleDoc,
    shouldRescanFile,
    type FileMetadataExtended,
    type ScanProgress
} from "@/lib/cloud-service";
import { createClient } from '@supabase/supabase-js';
import { parseDocx, parseExcel, parseImage } from "@/lib/extractors";
import { matchDocumentToEvidenceRequirements } from "@/lib/ai-evidence-matcher";
import { updateAssessmentsFromEvidence, generateCategorySummaries } from "@/lib/assessment-updater";
import { generateEmbedding } from "@/lib/embeddings";

// --- Types ---

interface ScanRequest {
    provider: 'google.com' | 'microsoft.com';
    accessToken: string;
    folderId: string;
    userId?: string;
    recursive?: boolean; // Default true
    maxFiles?: number; // Limit for testing
    useAI?: boolean; // Default true
}

interface ScanResult {
    status: 'complete' | 'partial' | 'error';
    stats: {
        totalFiles: number;
        processedFiles: number;
        skippedFiles: number;
        failedFiles: number;
        evidenceMatches: number;
    };
    assessmentUpdates?: Record<string, any>;
    categorySummaries?: any[];
    errors?: string[];
}

// --- Helper Functions ---

/**
 * Extract text from file buffer based on MIME type
 */
async function extractTextFromFile(
    buffer: Buffer,
    mimeType: string,
    fileId: string,
    accessToken: string,
    provider: string
): Promise<string> {
    try {
        // Handle Google Workspace files (export as text)
        if (provider === 'google.com' && mimeType.includes('vnd.google-apps')) {
            console.log(`[Extract] Exporting Google Workspace file: ${mimeType}`);
            return await exportGoogleDoc(accessToken, fileId, mimeType);
        }

        // Handle DOCX
        if (mimeType.includes('wordprocessingml') || mimeType.includes('docx')) {
            return await parseDocx(buffer);
        }

        // Handle XLSX
        if (mimeType.includes('spreadsheetml') || mimeType.includes('xlsx')) {
            return await parseExcel(buffer);
        }

        // Handle images (OCR)
        if (mimeType.includes('image')) {
            return await parseImage(buffer, mimeType);
        }

        // Fallback: Try as plain text
        return buffer.toString('utf-8').substring(0, 10000);

    } catch (error) {
        console.error(`[Extract] Failed to extract text:`, error);
        return '';
    }
}

/**
 * Check if file should be processed (deduplication)
 */
async function shouldProcessFile(
    file: FileMetadataExtended,
    supabase: any,
    userId?: string
): Promise<boolean> {
    if (!supabase || !userId || !file.modifiedTime) {
        return true; // Process if we can't check
    }

    try {
        // Check if file exists in database and hasn't been modified
        const { data, error } = await supabase
            .from('documents')
            .select('metadata')
            .eq('metadata->>fileId', file.id)
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return true; // File not in DB, process it
        }

        const lastScannedTime = data.metadata?.scannedAt;
        return shouldRescanFile(file.modifiedTime, lastScannedTime);

    } catch (error) {
        console.error('[Dedup] Error checking file:', error);
        return true; // On error, process the file
    }
}

// --- Main Handler ---

export async function POST(req: NextRequest) {
    try {
        const body: ScanRequest = await req.json();
        const {
            provider,
            accessToken,
            folderId,
            userId,
            recursive = true,
            maxFiles = 50,
            useAI = true
        } = body;

        console.log(`[Scan] Starting scan - Provider: ${provider}, Recursive: ${recursive}, AI: ${useAI}`);

        // Validate inputs
        if (!provider || !accessToken || !folderId) {
            return new Response(JSON.stringify({ error: "Missing required parameters" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Initialize Supabase
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        let supabase = null;

        if (supabaseUrl && supabaseKey) {
            supabase = createClient(supabaseUrl, supabaseKey);
            console.log("[Scan] Supabase client initialized");
        }

        // Scan folder structure
        let allFiles: FileMetadataExtended[] = [];

        if (recursive) {
            console.log("[Scan] Starting recursive folder scan...");
            const scanFunc = provider === 'google.com'
                ? listGoogleFilesRecursive
                : listOneDriveFilesRecursive;

            allFiles = await scanFunc(accessToken, folderId, (progress: ScanProgress) => {
                console.log(`[Progress] Folder: ${progress.currentFolder}, Files: ${progress.totalFiles}`);
            });
        } else {
            // Non-recursive scan (legacy)
            console.log("[Scan] Single folder scan...");
            const { listGoogleFiles, listOneDriveFiles } = await import("@/lib/cloud-service");
            const files = provider === 'google.com'
                ? await listGoogleFiles(accessToken, folderId)
                : await listOneDriveFiles(accessToken, folderId);

            allFiles = files.map(f => ({
                ...f,
                folderPath: 'Root',
                isFolder: false
            }));
        }

        console.log(`[Scan] Found ${allFiles.length} total files`);

        // Filter out folders, limit files
        const filesToProcess = allFiles
            .filter(f => !f.isFolder)
            .slice(0, maxFiles);

        console.log(`[Scan] Processing ${filesToProcess.length} files (limit: ${maxFiles})`);

        // Process files
        const stats = {
            totalFiles: filesToProcess.length,
            processedFiles: 0,
            skippedFiles: 0,
            failedFiles: 0,
            evidenceMatches: 0
        };

        const errors: string[] = [];
        const allEvidenceMatches: any[] = [];

        for (const file of filesToProcess) {
            try {
                console.log(`[Process] ${file.name} (${file.folderPath})`);

                // Check if file should be processed (deduplication)
                const shouldProcess = await shouldProcessFile(file, supabase, userId);

                if (!shouldProcess) {
                    console.log(`[Skip] File unchanged: ${file.name}  `);
                    stats.skippedFiles++;
                    continue;
                }

                // Download file
                let buffer: Buffer;
                try {
                    if (provider === 'google.com') {
                        buffer = await getGoogleFileContent(accessToken, file.id);
                    } else {
                        buffer = await getOneDriveFileContent(accessToken, file.id);
                    }
                } catch (downloadError) {
                    console.error(`[Download] Failed: ${file.name}`, downloadError);
                    errors.push(`Failed to download ${file.name}`);
                    stats.failedFiles++;
                    continue;
                }

                // Extract text
                const text = await extractTextFromFile(
                    buffer,
                    file.mimeType,
                    file.id,
                    accessToken,
                    provider
                );

                if (!text || text.length < 50) {
                    console.log(`[Extract] Insufficient text in ${file.name}`);
                    stats.skippedFiles++;
                    continue;
                }

                // Use AI to match evidence (if enabled)
                let evidenceMatches: any[] = [];

                if (useAI) {
                    try {
                        const matchResult = await matchDocumentToEvidenceRequirements(
                            text,
                            {
                                filename: file.name,
                                fileId: file.id,
                                mimeType: file.mimeType,
                                foldername: file.folderPath,
                                webViewLink: file.webViewLink
                            }
                        );

                        evidenceMatches = matchResult.matches;
                        stats.evidenceMatches += evidenceMatches.length;

                        console.log(`[AI] Found ${evidenceMatches.length} evidence matches in ${file.name}`);

                    } catch (aiError) {
                        console.error(`[AI] Error matching ${file.name}:`, aiError);
                        errors.push(`AI matching failed for ${file.name}`);
                    }
                }

                allEvidenceMatches.push(...evidenceMatches);

                // Generate embedding
                let embedding: number[] = [];
                try {
                    // Truncate text for embedding (first 8000 chars)
                    const embeddingText = text.substring(0, 8000);
                    embedding = await generateEmbedding(embeddingText);
                } catch (embError) {
                    console.error(`[Embedding] Failed for ${file.name}:`, embError);
                    embedding = new Array(1536).fill(0); // Dummy embedding
                }

                // Store in database
                if (supabase) {
                    try {
                        // Store document
                        const { data: docData, error: docError } = await supabase
                            .from('documents')
                            .upsert({
                                user_id: userId,
                                content: text.substring(0, 50000), // Limit storage
                                metadata: {
                                    filename: file.name,
                                    fileId: file.id,
                                    mimeType: file.mimeType,
                                    provider: provider,
                                    folderPath: file.folderPath,
                                    webViewLink: file.webViewLink,
                                    size: file.size,
                                    scannedAt: new Date().toISOString()
                                },
                                embedding: embedding
                            }, {
                                onConflict: 'user_id,metadata->>fileId'
                            })
                            .select('id')
                            .single();

                        if (docError) {
                            console.error(`[DB] Error saving document:`, docError);
                        }

                        // Store evidence matches
                        if (evidenceMatches.length > 0 && docData) {
                            const evidenceRecords = evidenceMatches.map(match => ({
                                user_id: userId,
                                document_id: docData.id,
                                category_id: match.categoryId,
                                category_name: match.categoryName,
                                subcategory_id: match.subcategoryId,
                                subcategory_name: match.subcategoryName,
                                evidence_item: match.evidenceItem,
                                confidence: match.confidence,
                                relevance_explanation: match.relevanceExplanation,
                                key_quotes: match.keyQuotes,
                                document_link: file.webViewLink,
                                folder_path: file.folderPath
                            }));

                            const { error: evidenceError } = await supabase
                                .from('evidence_matches')
                                .upsert(evidenceRecords, {
                                    onConflict: 'user_id,document_id,subcategory_id,evidence_item'
                                });

                            if (evidenceError) {
                                console.error(`[DB] Error saving evidence:`, evidenceError);
                            }
                        }

                    } catch (dbError) {
                        console.error(`[DB] Database error:`, dbError);
                        errors.push(`DB error for ${file.name}`);
                    }
                }

                stats.processedFiles++;

            } catch (fileError: any) {
                console.error(`[Process] Error with ${file.name}:`, fileError);
                errors.push(`Error processing ${file.name}: ${fileError.message}`);
                stats.failedFiles++;
            }
        }

        // Generate assessment updates from evidence
        let assessmentUpdates = {};
        let categorySummaries: any[] = [];

        if (useAI && allEvidenceMatches.length > 0) {
            try {
                assessmentUpdates = updateAssessmentsFromEvidence(allEvidenceMatches);
                categorySummaries = generateCategorySummaries(assessmentUpdates);

                console.log(`[Assessments] Updated ${Object.keys(assessmentUpdates).length} subcategories`);

            } catch (assessmentError) {
                console.error('[Assessments] Error generating updates:', assessmentError);
                errors.push('Failed to generate assessment updates');
            }
        }

        // Build response
        const result: ScanResult = {
            status: stats.failedFiles > stats.processedFiles / 2 ? 'partial' : 'complete',
            stats,
            assessmentUpdates,
            categorySummaries,
            errors: errors.length > 0 ? errors : undefined
        };

        console.log(`[Scan] Complete - Processed: ${stats.processedFiles}, Matches: ${stats.evidenceMatches}`);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("[Scan] Fatal error:", error);
        return new Response(JSON.stringify({
            status: 'error',
            error: error.message || "Internal Server Error"
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
