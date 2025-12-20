"use client";

import React from 'react';

export interface EmbedConfig {
    type: 'twitter' | 'youtube' | 'vimeo' | 'generic';
    url: string;
    title?: string;
}

interface InsightEmbedProps {
    embed: EmbedConfig;
}

/**
 * Convert YouTube URL to embed URL
 */
function getYouTubeEmbedUrl(url: string): string {
    // Handle various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return `https://www.youtube.com/embed/${match[1]}`;
        }
    }

    // If already an embed URL, return as-is
    if (url.includes('youtube.com/embed/')) {
        return url;
    }

    // Fallback: return original URL
    return url;
}

/**
 * Convert Vimeo URL to embed URL
 */
function getVimeoEmbedUrl(url: string): string {
    // Handle various Vimeo URL formats
    const patterns = [
        /vimeo\.com\/(\d+)/,
        /vimeo\.com\/embed\/(\d+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return `https://player.vimeo.com/video/${match[1]}`;
        }
    }

    // If already a player URL, return as-is
    if (url.includes('player.vimeo.com/video/')) {
        return url;
    }

    // Fallback: return original URL
    return url;
}

/**
 * Get embed URL based on type
 */
function getEmbedUrl(embed: EmbedConfig): string {
    switch (embed.type) {
        case 'twitter':
            // Use twitframe for Twitter embeds
            return `https://twitframe.com/show?url=${encodeURIComponent(embed.url)}`;
        
        case 'youtube':
            return getYouTubeEmbedUrl(embed.url);
        
        case 'vimeo':
            return getVimeoEmbedUrl(embed.url);
        
        case 'generic':
        default:
            return embed.url;
    }
}

export default function InsightEmbed({ embed }: InsightEmbedProps) {
    // Don't render if URL is empty or placeholder
    if (!embed.url || embed.url.trim() === '' || 
        embed.url.includes('VIDEO_URL_GOES_HERE') || 
        embed.url.includes('PLACEHOLDER') ||
        embed.url.includes('VIDEO_ID')) {
        return null;
    }

    const embedUrl = getEmbedUrl(embed);

    return (
        <div className="my-12">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <iframe
                    src={embedUrl}
                    title={embed.title || 'Embedded content'}
                    className="absolute inset-0 w-full h-full"
                    loading="lazy"
                    allowFullScreen
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
            </div>
            {embed.title && (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                    {embed.title}
                </p>
            )}
        </div>
    );
}

