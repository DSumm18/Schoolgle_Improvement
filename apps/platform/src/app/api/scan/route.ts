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
import { generateSmartTasks } from "@/lib/smart-task-generator";
import { generateEmbedding } from "@/lib/embeddings";
import { scanRequestSchema, validateRequest } from "@/lib/validations";
import { scanLimiter } from "@/lib/rateLimit";
import { logger, createOperationLogger } from "@/lib/logger";

// --- Types ---

interface ScanRequest {
    provider: 'google.com' | 'microsoft.com';
    accessToken: string;
    folderId: string;
    organizationId: string; // Mandatory for multi-tenancy
    userId?: string;
    authId?: string;
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
    const extractLogger = createOperationLogger('extractTextFromFile', { fileId, mimeType, provider });

    try {
        // Handle Google Workspace files (export as text)
        if (provider === 'google.com' && mimeType.includes('vnd.google-apps')) {
            extractLogger.debug('Exporting Google Workspace file');
            return await exportGoogleDoc(accessToken, fileId, mimeType);
        }

        // Handle DOCX
        if (mimeType.includes('wordprocessingml') || mimeType.includes('docx')) {
            extractLogger.debug('Parsing DOCX file');
            return await parseDocx(buffer);
        }

        // Handle XLSX
        if (mimeType.includes('spreadsheetml') || mimeType.includes('xlsx')) {
            extractLogger.debug('Parsing Excel file');
            return await parseExcel(buffer);
        }

        // Handle images (OCR)
        if (mimeType.includes('image')) {
            extractLogger.debug('Parsing image with OCR');
            return await parseImage(buffer, mimeType);
        }

        // Fallback: Try as plain text
        extractLogger.debug('Attempting plain text extraction');
        return buffer.toString('utf-8').substring(0, 10000);

    } catch (error) {
        extractLogger.error('Text extraction failed', undefined, error);
        return '';
    }
}

/**
 * Check if file should be processed (deduplication)
 */
async function shouldProcessFile(
    file: FileMetadataExtended,
    supabase: any,
    organizationId?: string,
    userId?: string
): Promise<boolean> {
    if (!supabase || !organizationId || !file.modifiedTime) {
        return true; // Process if we can't check
    }

    const dedupLogger = createOperationLogger('shouldProcessFile', { fileId: file.id, organizationId, userId });

    try {
        // Check if file exists in database and hasn't been modified
        // Priority check by organization_id per user's request
        const { data, error } = await supabase
            .from('documents')
            .select('metadata')
            .eq('metadata->>fileId', file.id)
            .eq('organization_id', organizationId)
            .single();

        if (error || !data) {
            dedupLogger.debug('File not found in database for this org, will process');
            return true;
        }

        const lastScannedTime = data.metadata?.scannedAt;
        const shouldRescan = shouldRescanFile(file.modifiedTime, lastScannedTime);

        dedupLogger.debug('Deduplication check complete', undefined, {
            shouldRescan,
            lastScannedTime,
            modifiedTime: file.modifiedTime
        });

        return shouldRescan;

    } catch (error) {
        dedupLogger.error('Error checking file for deduplication', undefined, error);
        return true;
    }
}

// --- Main Handler ---

export async function POST(req: NextRequest) {
    const encoder = new TextEncoder();

    return new Response(
        new ReadableStream({
            async start(controller) {
                const sendUpdate = (data: any) => {
                    controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
                };

                const scanLogger = createOperationLogger('scan-api', { endpoint: '/api/scan' });

                try {
                    // Rate limiting check
                    const rateLimitResult = await scanLimiter.check(req);
                    if (!rateLimitResult.allowed) {
                        scanLogger.warn('Rate limit exceeded');
                        sendUpdate({ type: 'error', message: 'Rate limit exceeded' });
                        controller.close();
                        return;
                    }

                    // Parse and validate request body
                    const body = await req.json();
                    const validation = validateRequest(scanRequestSchema, body);

                    if (!validation.success) {
                        scanLogger.warn('Invalid request', undefined, undefined, { validationError: validation.error });
                        sendUpdate({ type: 'error', message: 'Invalid request parameters' });
                        controller.close();
                        return;
                    }

                    const {
                        provider,
                        accessToken,
                        folderId,
                        organizationId,
                        userId,
                        authId,
                        recursive,
                        maxFiles,
                        useAI
                    } = validation.data;

                    sendUpdate({ type: 'progress', message: 'Initializing scan...', stats: { totalFiles: 0, processedFiles: 0, evidenceMatches: 0, skippedFiles: 0, failedFiles: 0 } });

                    // Initialize Supabase
                    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
                    let supabase = null;

                    if (supabaseUrl && supabaseKey) {
                        supabase = createClient(supabaseUrl, supabaseKey);
                    }

                    // Scan folder structure
                    let allFiles: FileMetadataExtended[] = [];

                    sendUpdate({ type: 'progress', message: 'Scanning folder structure...' });

                    if (recursive) {
                        const scanFunc = provider === 'google.com'
                            ? listGoogleFilesRecursive
                            : listOneDriveFilesRecursive;

                        allFiles = await scanFunc(accessToken, folderId, (progress: ScanProgress) => {
                            sendUpdate({ type: 'progress', message: `Scanning folders: Found ${progress.totalFiles} files` });
                        });
                    } else {
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

                    const filesToProcess = allFiles
                        .filter(f => !f.isFolder)
                        .slice(0, maxFiles);

                    const stats = {
                        totalFiles: filesToProcess.length,
                        processedFiles: 0,
                        skippedFiles: 0,
                        failedFiles: 0,
                        evidenceMatches: 0
                    };

                    sendUpdate({ type: 'progress', message: `Found ${filesToProcess.length} files to analyze.`, stats });

                    const errors: string[] = [];
                    const allEvidenceMatches: any[] = [];

                    for (const file of filesToProcess) {
                        try {
                            sendUpdate({
                                type: 'progress',
                                message: `Analyzing: ${file.name}`,
                                stats
                            });

                            // Check if file should be processed
                            const shouldProcess = await shouldProcessFile(file, supabase, organizationId, userId);

                            if (!shouldProcess) {
                                stats.skippedFiles++;
                                sendUpdate({ type: 'progress', message: `Skipped (unchanged): ${file.name}`, stats });
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
                                stats.failedFiles++;
                                errors.push(`Failed to download ${file.name}`);
                                continue;
                            }

                            // Extract text
                            const text = await extractTextFromFile(buffer, file.mimeType, file.id, accessToken, provider);

                            if (!text || text.length < 50) {
                                stats.skippedFiles++;
                                continue;
                            }

                            // AI Matching
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
                                            webViewLink: file.webViewLink,
                                            modifiedTime: file.modifiedTime
                                        }
                                    );

                                    evidenceMatches = matchResult.matches;
                                    stats.evidenceMatches += evidenceMatches.length;
                                    allEvidenceMatches.push(...evidenceMatches);
                                } catch (aiError: any) {
                                    errors.push(`AI matching failed for ${file.name}: ${aiError.message}`);
                                }
                            }

                            // Generate embedding
                            let embedding: number[] = [];
                            try {
                                embedding = await generateEmbedding(text.substring(0, 8000));
                            } catch (e) {
                                embedding = new Array(1536).fill(0);
                            }

                            // Store in DB
                            if (supabase) {
                                const { data: docData } = await supabase
                                    .from('documents')
                                    .upsert({
                                        organization_id: organizationId,
                                        user_id: userId,
                                        auth_id: authId || (userId?.includes('-') ? userId : null),
                                        content: text.substring(0, 50000),
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
                                        name: file.name,
                                        file_type: file.mimeType,
                                        file_size: file.size,
                                        provider: provider === 'google.com' ? 'google_drive' : 'onedrive',
                                        external_id: file.id,
                                        web_view_link: file.webViewLink,
                                        folder_path: file.folderPath,
                                        embedding: embedding
                                    }, { onConflict: 'organization_id,external_id' })
                                    .select('id')
                                    .single();

                                if (docData && evidenceMatches.length > 0) {
                                    const evidenceRecords = evidenceMatches.map(match => ({
                                        organization_id: organizationId,
                                        user_id: userId,
                                        auth_id: authId || (userId?.includes('-') ? userId : null),
                                        document_id: docData.id,
                                        framework_type: 'ofsted',
                                        category_id: match.categoryId,
                                        category_name: match.categoryName,
                                        subcategory_id: match.subcategoryId,
                                        subcategory_name: match.subcategoryName,
                                        confidence: match.confidence,
                                        matched_keywords: match.triggeredKeywords, // Using standard column name
                                        relevance_explanation: match.relevanceExplanation,
                                        key_quotes: match.keyQuotes,
                                        document_link: file.webViewLink
                                    }));

                                    await supabase
                                        .from('evidence_matches')
                                        .upsert(evidenceRecords, { onConflict: 'organization_id,document_id,subcategory_id' });
                                }
                            }

                            stats.processedFiles++;
                            sendUpdate({
                                type: 'progress',
                                message: `Processed: ${file.name} (${evidenceMatches.length} matches)`,
                                stats
                            });

                        } catch (fileError: any) {
                            stats.failedFiles++;
                            errors.push(`Error processing ${file.name}: ${fileError.message}`);
                        }
                    }

                    // Assessment Updates
                    let assessmentUpdates = {};
                    let categorySummaries: any[] = [];

                    if (useAI && allEvidenceMatches.length > 0) {
                        assessmentUpdates = updateAssessmentsFromEvidence(allEvidenceMatches);
                        categorySummaries = generateCategorySummaries(assessmentUpdates);

                        if (supabase) {
                            const assessmentRecords = Object.values(assessmentUpdates).map((update: any) => ({
                                organization_id: organizationId,
                                subcategory_id: update.subcategoryId,
                                ai_rating: update.aiRatingRaw,
                                ai_rationale: update.aiRationale,
                                evidence_count: update.evidenceCount,
                                assessed_by: userId,
                                assessed_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            }));

                            if (assessmentRecords.length > 0) {
                                await supabase
                                    .from('ofsted_assessments')
                                    .upsert(assessmentRecords, { onConflict: 'organization_id,subcategory_id' });
                            }

                            // Generate and store smart tasks
                            const smartTasks = generateSmartTasks(
                                assessmentUpdates as any,
                                allEvidenceMatches,
                                { organizationId, userId, authId }
                            );

                            if (smartTasks.length > 0) {
                                await supabase
                                    .from('actions')
                                    .insert(smartTasks);

                                scanLogger.info(`Generated ${smartTasks.length} smart tasks`);
                            }
                        }
                    }

                    sendUpdate({
                        type: 'complete',
                        stats,
                        assessmentUpdates,
                        categorySummaries,
                        errors: errors.length > 0 ? errors : undefined
                    });

                    // Track scan completion in analytics
                    try {
                        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analytics/track`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                event: 'evidence_scan_completed',
                                properties: {
                                    organizationId,
                                    provider,
                                    stats,
                                    hasErrors: errors.length > 0
                                },
                                timestamp: new Date().toISOString()
                            })
                        });
                    } catch (trackError) {
                        console.error('Failed to track scan analytics:', trackError);
                    }

                } catch (error: any) {
                    scanLogger.error('Fatal error in scan', undefined, error);
                    sendUpdate({ type: 'error', message: error.message || 'Internal Server Error' });
                } finally {
                    controller.close();
                }
            }
        }),
        {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        }
    );
}
