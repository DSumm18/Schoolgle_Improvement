"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Linkedin, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import OrigamiParticles from '@/components/OrigamiParticles';
import InsightEmbed, { EmbedConfig } from '@/components/InsightEmbed';
import { getInsightBySlug } from '@/data/insights';
import type { Source } from '@/lib/mdx-loader';

export default function InsightPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const slug = params.slug as string;
    const [mdxContent, setMdxContent] = useState<string | null>(null);
    const [embed, setEmbed] = useState<EmbedConfig | null>(null);
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState(true);
    const [linkCopied, setLinkCopied] = useState(false);

    const insight = getInsightBySlug(slug);

    // Load MDX content for coming-soon articles
    useEffect(() => {
        if (insight?.status === 'coming_soon') {
            fetch(`/api/insights/${slug}/content`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        if (data.content) {
                            setMdxContent(data.content);
                        }
                        // Get embed from frontmatter
                        if (data.frontmatter?.embed && data.frontmatter.embed.url &&
                            !data.frontmatter.embed.url.includes('VIDEO_URL_GOES_HERE') &&
                            !data.frontmatter.embed.url.includes('PLACEHOLDER') &&
                            !data.frontmatter.embed.url.includes('VIDEO_ID')) {
                            setEmbed(data.frontmatter.embed);
                        }
                        // Get sources from frontmatter
                        if (data.frontmatter?.sources && Array.isArray(data.frontmatter.sources)) {
                            setSources(data.frontmatter.sources);
                        }
                    }
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [slug, insight]);

    // Copy link handler
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    // Share on LinkedIn handler
    const handleShareLinkedIn = () => {
        const url = encodeURIComponent(window.location.href);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
    };

    // Preview mode check
    const isPreviewMode = searchParams.get('preview') === '1';
    const previewToken = searchParams.get('token');
    const validPreviewToken = process.env.NEXT_PUBLIC_PREVIEW_TOKEN || 'preview-token-123';
    const hasValidPreview = isPreviewMode && previewToken === validPreviewToken;

    // If insight doesn't exist, 404
    if (!insight) {
        notFound();
    }

    // If draft and no valid preview, 404
    if (insight.status === 'draft' && !hasValidPreview) {
        notFound();
    }

    // If coming soon, show full article with content
    if (insight.status === 'coming_soon' && !hasValidPreview) {
        return (
            <div className="min-h-screen bg-transparent relative">
                <main className="relative z-10 bg-transparent">
                    <article className="py-24">
                        <div className="max-w-4xl mx-auto px-6">
                            <Link
                                href="/insights"
                                className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-12 transition-colors"
                            >
                                <ArrowLeft size={20} />
                                Back to Insights
                            </Link>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="mb-8">
                                    <span className="inline-block px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium mb-6">
                                        Coming Soon
                                    </span>
                                </div>

                                {insight.heroImage && (
                                    <div className="mb-16 -mx-6 md:-mx-0">
                                        <Image
                                            src={insight.heroImage}
                                            alt={insight.title}
                                            width={1200}
                                            height={600}
                                            className="w-full h-auto rounded-2xl"
                                            priority
                                            sizes="(max-width: 768px) 100vw, 768px"
                                        />
                                    </div>
                                )}

                                <div className="mb-8">
                                    <span className="text-sm text-gray-500 dark:text-neutral-400 font-medium">
                                        {new Date(insight.date).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <h1 className="text-4xl md:text-5xl font-medium text-gray-900 dark:text-gray-50 mb-4 tracking-tight">
                                        {insight.title}
                                    </h1>

                                    {/* Share buttons */}
                                    <div className="flex items-center gap-3 mt-6">
                                        <button
                                            onClick={handleCopyLink}
                                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            {linkCopied ? (
                                                <>
                                                    <Check size={16} />
                                                    Copied
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={16} />
                                                    Copy link
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={handleShareLinkedIn}
                                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <Linkedin size={16} />
                                            Share on LinkedIn
                                        </button>
                                    </div>
                                </div>

                                <p className="text-xl text-gray-600 dark:text-neutral-300 mb-16 leading-relaxed">
                                    {insight.excerpt}
                                </p>

                                {/* Embed Block */}
                                {embed && <InsightEmbed embed={embed} />}

                                {loading ? (
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-12 text-center">
                                        <p className="text-gray-600 dark:text-gray-300">Loading content...</p>
                                    </div>
                                ) : mdxContent ? (
                                    <>
                                        <div
                                            className="prose prose-lg prose-neutral dark:prose-invert max-w-none space-y-6
                                                       prose-p:text-neutral-800 dark:prose-p:text-neutral-200 prose-p:leading-relaxed prose-p:mb-6
                                                       prose-lead:text-neutral-600 dark:prose-lead:text-neutral-300 prose-lead:leading-relaxed
                                                       prose-headings:text-gray-900 dark:prose-headings:text-gray-50 prose-headings:font-medium
                                                       prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8
                                                       prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6
                                                       prose-a:text-gray-900 dark:prose-a:text-gray-200 prose-a:underline prose-a:decoration-gray-300 dark:prose-a:decoration-gray-600 hover:prose-a:text-gray-700 dark:hover:prose-a:text-gray-100
                                                       prose-strong:text-gray-900 dark:prose-strong:text-gray-50
                                                       prose-ul:text-neutral-800 dark:prose-ul:text-neutral-200 prose-ul:mb-6 prose-ul:space-y-2
                                                       prose-li:text-neutral-800 dark:prose-li:text-neutral-200 prose-li:mb-2
                                                       [&_iframe]:rounded-xl [&_iframe]:border [&_iframe]:border-gray-200 [&_iframe]:dark:border-gray-800 [&_iframe]:bg-gray-50 [&_iframe]:dark:bg-gray-900 [&_iframe]:overflow-hidden [&_iframe]:shadow-sm
                                                       [&_div.rounded-2xl]:border [&_div.rounded-2xl]:border-gray-200 [&_div.rounded-2xl]:dark:border-gray-800 [&_div.rounded-2xl]:shadow-sm"
                                            dangerouslySetInnerHTML={{ __html: mdxContent }}
                                        />

                                        {/* Sources Section */}
                                        {sources.length > 0 && (
                                            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
                                                <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-50 mb-6">
                                                    Sources
                                                </h2>
                                                <ul className="space-y-3">
                                                    {sources.map((source, index) => (
                                                        <li key={index}>
                                                            <a
                                                                href={source.url}
                                                                target="_blank"
                                                                rel="noreferrer noopener"
                                                                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-4 transition-colors"
                                                            >
                                                                {source.label}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-12 text-center">
                                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                                            This insight is being prepared. Join early access to be notified when it's published.
                                        </p>
                                        <a
                                            href="/#early-access"
                                            className="inline-block px-8 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                                        >
                                            Join early access
                                        </a>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </article>
                </main>
            </div>
        );
    }

    // Published or valid preview: show full article
    return (
        <div className="min-h-screen bg-transparent relative">
            <main className="relative z-10 bg-transparent">
                <article className="py-24">
                    <div className="max-w-4xl mx-auto px-6">
                        <Link
                            href="/insights"
                            className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-12 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Back to Insights
                        </Link>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {hasValidPreview && (
                                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                                        Preview Mode: This is a {insight.status} article
                                    </p>
                                </div>
                            )}

                            <div className="mb-8">
                                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    {new Date(insight.date).toLocaleDateString('en-GB', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>

                            <div className="mb-6">
                                <h1 className="text-4xl md:text-5xl font-medium text-gray-900 dark:text-gray-50 mb-4 tracking-tight">
                                    {insight.title}
                                </h1>

                                {/* Share buttons */}
                                <div className="flex items-center gap-3 mt-6">
                                    <button
                                        onClick={handleCopyLink}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        {linkCopied ? (
                                            <>
                                                <Check size={16} />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={16} />
                                                Copy link
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleShareLinkedIn}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        <Linkedin size={16} />
                                        Share on LinkedIn
                                    </button>
                                </div>
                            </div>

                            {insight.heroImage && (
                                <div className="mb-16 -mx-6 md:-mx-0">
                                    <Image
                                        src={insight.heroImage}
                                        alt={insight.title}
                                        width={1200}
                                        height={600}
                                        className="w-full h-auto rounded-2xl"
                                        priority
                                        sizes="(max-width: 768px) 100vw, 768px"
                                    />
                                </div>
                            )}

                            <p className="text-xl text-gray-600 dark:text-neutral-300 mb-16 leading-relaxed">
                                {insight.excerpt}
                            </p>

                            {/* Embed Block */}
                            {embed && <InsightEmbed embed={embed} />}

                            <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none space-y-6
                                           prose-p:text-neutral-800 dark:prose-p:text-neutral-200 prose-p:leading-relaxed prose-p:mb-6
                                           prose-lead:text-neutral-600 dark:prose-lead:text-neutral-300 prose-lead:leading-relaxed
                                           prose-headings:text-gray-900 dark:prose-headings:text-gray-50 prose-headings:font-medium
                                           prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8
                                           prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6
                                           prose-a:text-gray-900 dark:prose-a:text-gray-200 prose-a:underline prose-a:decoration-gray-300 dark:prose-a:decoration-gray-600 hover:prose-a:text-gray-700 dark:hover:prose-a:text-gray-100
                                           prose-strong:text-gray-900 dark:prose-strong:text-gray-50
                                           prose-ul:text-neutral-800 dark:prose-ul:text-neutral-200 prose-ul:mb-6 prose-ul:space-y-2
                                           prose-li:text-neutral-800 dark:prose-li:text-neutral-200 prose-li:mb-2
                                           [&_iframe]:rounded-xl [&_iframe]:border [&_iframe]:border-gray-200 [&_iframe]:dark:border-gray-800 [&_iframe]:bg-gray-50 [&_iframe]:dark:bg-gray-900 [&_iframe]:overflow-hidden [&_iframe]:shadow-sm
                                           [&_div.rounded-2xl]:border [&_div.rounded-2xl]:border-gray-200 [&_div.rounded-2xl]:dark:border-gray-800 [&_div.rounded-2xl]:shadow-sm">
                                {insight.content ? (
                                    <>
                                        <div dangerouslySetInnerHTML={{ __html: insight.content }} />

                                        {/* Sources Section */}
                                        {sources.length > 0 && (
                                            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
                                                <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-50 mb-6">
                                                    Sources
                                                </h2>
                                                <ul className="space-y-3">
                                                    {sources.map((source, index) => (
                                                        <li key={index}>
                                                            <a
                                                                href={source.url}
                                                                target="_blank"
                                                                rel="noreferrer noopener"
                                                                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-4 transition-colors"
                                                            >
                                                                {source.label}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-12 text-center">
                                        <p className="text-gray-600 dark:text-gray-300">
                                            Article content coming soon. This is where the full insight will appear.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </article>
            </main>
        </div>
    );
}
