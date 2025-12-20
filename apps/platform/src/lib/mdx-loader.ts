import fs from 'fs';
import path from 'path';

export interface EmbedConfig {
    type: 'twitter' | 'youtube' | 'vimeo' | 'generic';
    url: string;
    title?: string;
}

export interface Source {
    label: string;
    url: string;
}

export interface MDXFrontmatter {
    title?: string;
    date?: string;
    status?: string;
    excerpt?: string;
    heroImage?: string;
    embed?: EmbedConfig;
    sources?: Source[];
    [key: string]: any;
}

export interface MDXContent {
    frontmatter: MDXFrontmatter;
    content: string;
}

/**
 * Simple markdown to HTML converter
 * Handles basic markdown syntax and preserves HTML blocks (like iframes, divs)
 */
function markdownToHTML(markdown: string): string {
    let html = markdown;

    // Preserve HTML blocks (iframes, divs, etc.)
    const htmlBlockRegex = /<(iframe|div|a)[\s\S]*?<\/\1>/gi;
    const htmlBlocks: string[] = [];
    html = html.replace(htmlBlockRegex, (match) => {
        htmlBlocks.push(match);
        return `__HTML_BLOCK_${htmlBlocks.length - 1}__`;
    });

    // Also preserve self-closing HTML tags like img, br, hr
    const selfClosingRegex = /<(img|br|hr)[\s\S]*?\/?>/gi;
    html = html.replace(selfClosingRegex, (match) => {
        if (!match.includes('__HTML_BLOCK_')) {
            htmlBlocks.push(match);
            return `__HTML_BLOCK_${htmlBlocks.length - 1}__`;
        }
        return match;
    });

    // Convert headers (only if not already in HTML)
    html = html.replace(/^### (.*$)/gim, (match, content) => {
        if (!match.includes('__HTML_BLOCK_')) {
            return `<h3 class="text-2xl font-medium text-gray-900 dark:text-gray-50 mt-12 mb-4">${content}</h3>`;
        }
        return match;
    });
    html = html.replace(/^## (.*$)/gim, (match, content) => {
        if (!match.includes('__HTML_BLOCK_')) {
            return `<h2 class="text-3xl font-medium text-gray-900 dark:text-gray-50 mt-16 mb-6">${content}</h2>`;
        }
        return match;
    });
    html = html.replace(/^# (.*$)/gim, (match, content) => {
        if (!match.includes('__HTML_BLOCK_')) {
            return `<h1 class="text-4xl font-medium text-gray-900 dark:text-gray-50 mt-16 mb-6">${content}</h1>`;
        }
        return match;
    });

    // Convert paragraphs (lines that aren't headers, lists, or HTML blocks)
    html = html.split('\n\n').map(block => {
        const trimmed = block.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<h') || trimmed.startsWith('__HTML_BLOCK') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('<div')) {
            return trimmed;
        }
        // Don't wrap if it's already HTML
        if (trimmed.startsWith('<')) {
            return trimmed;
        }
        return `<p class="text-neutral-800 dark:text-neutral-200 leading-7 mb-6">${trimmed}</p>`;
    }).filter(Boolean).join('\n\n');

    // Convert lists
    html = html.replace(/^\- (.*$)/gim, '<li class="text-neutral-800 dark:text-neutral-200 leading-7 mb-2">$1</li>');
    html = html.replace(/(<li[\s\S]*?<\/li>)/g, '<ul class="list-disc list-inside mb-6 space-y-2">$1</ul>');

    // Restore HTML blocks
    htmlBlocks.forEach((block, index) => {
        html = html.replace(`__HTML_BLOCK_${index}__`, block);
    });

    // Filter out placeholder iframes
    html = html.replace(/<iframe[^>]*src="VIDEO_URL_GOES_HERE"[\s\S]*?<\/iframe>/gi, '');

    return html;
}

/**
 * Parse a simple YAML-like value (handles strings, numbers, booleans)
 */
function parseValue(value: string): any {
    const trimmed = value.trim();
    
    // Remove quotes if present
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1);
    }
    
    // Boolean
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    
    // Number
    if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);
    
    return trimmed;
}

/**
 * Parse frontmatter from MDX file
 * Handles simple key:value pairs and basic objects/arrays
 */
function parseFrontmatter(content: string): { frontmatter: MDXFrontmatter; body: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (!match) {
        return { frontmatter: {}, body: content };
    }

    const frontmatterText = match[1];
    const body = match[2];

    const frontmatter: MDXFrontmatter = {};
    const lines = frontmatterText.split('\n');
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) {
            i++;
            continue;
        }

        // Check for embed object
        if (line === 'embed:' || line.startsWith('embed:')) {
            const embed: any = {};
            i++;
            while (i < lines.length && lines[i].trim().startsWith('  ')) {
                const embedLine = lines[i].trim();
                const colonIndex = embedLine.indexOf(':');
                if (colonIndex > 0) {
                    const key = embedLine.substring(0, colonIndex).trim();
                    const value = parseValue(embedLine.substring(colonIndex + 1));
                    embed[key] = value;
                }
                i++;
            }
            if (embed.type && embed.url) {
                frontmatter.embed = embed as EmbedConfig;
            }
            continue;
        }

        // Check for sources array
        if (line === 'sources:' || line.startsWith('sources:')) {
            const sources: Source[] = [];
            i++;
            while (i < lines.length && (lines[i].trim().startsWith('-') || lines[i].trim().startsWith('  '))) {
                const sourceLine = lines[i].trim();
                if (sourceLine.startsWith('-')) {
                    // New source item
                    const source: any = {};
                    i++;
                    while (i < lines.length && lines[i].trim().startsWith('  ') && !lines[i].trim().startsWith('-')) {
                        const propLine = lines[i].trim();
                        const colonIndex = propLine.indexOf(':');
                        if (colonIndex > 0) {
                            const key = propLine.substring(0, colonIndex).trim();
                            const value = parseValue(propLine.substring(colonIndex + 1));
                            source[key] = value;
                        }
                        i++;
                    }
                    if (source.label && source.url) {
                        sources.push(source as Source);
                    }
                } else {
                    i++;
                }
            }
            if (sources.length > 0) {
                frontmatter.sources = sources;
            }
            continue;
        }

        // Simple key:value pair
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = parseValue(line.substring(colonIndex + 1));
            frontmatter[key] = value;
        }
        i++;
    }

    return { frontmatter, body };
}

/**
 * Load and parse MDX file
 * Accepts absolute or relative paths (relative to process.cwd())
 */
export function loadMDXFile(filePath: string): MDXContent | null {
    try {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const { frontmatter, body } = parseFrontmatter(content);
        const htmlContent = markdownToHTML(body);

        return {
            frontmatter,
            content: htmlContent,
        };
    } catch (error) {
        console.error('Error loading MDX file:', error);
        return null;
    }
}

