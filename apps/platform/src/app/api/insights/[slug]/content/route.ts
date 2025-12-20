import { NextRequest, NextResponse } from 'next/server';
import { loadMDXFile } from '@/lib/mdx-loader';
import path from 'path';
import fs from 'fs';

/**
 * Find content folder by slug
 * Matches folders like "2025-12-13-ai-expert-work-schools" to slug "ai-expert-work-schools"
 */
function findContentFolder(slug: string): string | null {
    const rootDir = path.resolve(process.cwd(), '..', '..');
    const insightsDir = path.join(rootDir, 'content', 'insights');

    if (!fs.existsSync(insightsDir)) {
        console.warn(`Insights content directory not found: ${insightsDir}`);
        return null;
    }

    // List all folders in insights directory
    const folders = fs.readdirSync(insightsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    // Find folder that ends with the slug (after stripping date prefix)
    for (const folder of folders) {
        // Remove date prefix (YYYY-MM-DD-) if present
        const folderWithoutDate = folder.replace(/^\d{4}-\d{2}-\d{2}-/, '');
        if (folderWithoutDate === slug) {
            return folder;
        }
    }

    return null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
    try {
        const resolvedParams = params instanceof Promise ? await params : params;
        const { slug } = resolvedParams;

        if (!slug) {
            return NextResponse.json({
                success: false,
                content: null,
                error: 'Slug is missing from request parameters.',
            }, { status: 400 });
        }

        // Find the content folder for this slug
        const contentFolder = findContentFolder(slug);

        if (!contentFolder) {
            return NextResponse.json({
                success: false,
                content: null,
                error: `No content folder found for slug: ${slug}`,
            }, { status: 404 });
        }

        // Construct possible paths for index.mdx or index.md
        const rootDir = path.resolve(process.cwd(), '..', '..');
        const possiblePaths = [
            path.join(rootDir, 'content', 'insights', contentFolder, 'index.mdx'),
            path.join(rootDir, 'content', 'insights', contentFolder, 'index.md'),
        ];

        let mdxPath: string | null = null;
        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath)) {
                mdxPath = testPath;
                break;
            }
        }

        if (!mdxPath) {
            return NextResponse.json({
                success: false,
                content: null,
                error: `No MDX/MD file found in folder: ${contentFolder}`,
            }, { status: 404 });
        }

        const mdxContent = loadMDXFile(mdxPath);

        if (mdxContent) {
            // Filter out placeholder iframe from content if it exists
            const cleanedContent = mdxContent.content.replace(/<iframe[^>]*src="VIDEO_URL_GOES_HERE"[\s\S]*?<\/iframe>/gi, '');

            return NextResponse.json({
                success: true,
                content: cleanedContent,
                frontmatter: mdxContent.frontmatter,
            });
        }

        return NextResponse.json({
            success: false,
            content: null,
            error: 'Failed to parse MDX content',
        }, { status: 500 });
    } catch (error) {
        console.error('Error loading MDX content:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to load content' },
            { status: 500 }
        );
    }
}

