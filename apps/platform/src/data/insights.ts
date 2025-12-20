export interface Insight {
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    status: 'draft' | 'coming_soon' | 'published';
    readingModes?: boolean;
    featured?: boolean;
    content?: string;
    heroImage?: string;
}

export const insights: Insight[] = [
    {
        slug: 'ai-expert-work-schools',
        title: 'When AI Starts Replacing Expert Work (and Why Schools Should Pay Attention)',
        excerpt: 'Recent AI updates are quietly shifting expert work. What this means for schools — and why people still matter.',
        date: '2025-12-13',
        status: 'coming_soon',
        featured: true,
        heroImage: '/insights/ai-expert-work-schools/hero.png',
    },
    {
        slug: 'intelligence-not-software',
        title: 'Why School Operations Need Intelligence, Not Just Software',
        excerpt: 'Most school systems store data. Very few help you make better decisions with it.',
        date: '2025-01-20',
        status: 'coming_soon',
        featured: false,
    },
];

// Helper functions
export function getPublishedInsights(): Insight[] {
    return insights.filter(insight => insight.status === 'published');
}

export function getComingSoonInsights(): Insight[] {
    return insights.filter(insight => insight.status === 'coming_soon');
}

export function getPublicInsights(): Insight[] {
    return insights.filter(insight => insight.status === 'published' || insight.status === 'coming_soon');
}

export function getInsightBySlug(slug: string): Insight | undefined {
    return insights.find(insight => insight.slug === slug);
}

export function getLatestPublicInsights(count: number = 2): Insight[] {
    return getPublicInsights()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, count);
}
