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
        slug: 'preparing-for-ofsted-2025',
        title: 'Preparing for Ofsted 2025: What Primary Schools Need to Know',
        excerpt: 'The updated framework brings subtle but important changes. Here\'s what Headteachers and School Business Managers should focus on.',
        date: '2024-11-15',
        status: 'published',
        featured: true,
    },
    {
        slug: 'evidence-organisation-before-inspection',
        title: 'Why Evidence Organisation Should Start Long Before Inspection',
        excerpt: 'Schools that organise evidence as they go spend less time preparing and more time improving. Here\'s how to build that habit.',
        date: '2024-10-28',
        status: 'published',
        featured: false,
    },
    {
        slug: 'siams-inspection-readiness',
        title: 'SIAMS Inspection Readiness: A Practical Guide for Church Schools',
        excerpt: 'What makes SIAMS different from Ofsted, and how to prepare evidence that demonstrates your school\'s distinctiveness effectively.',
        date: '2024-10-10',
        status: 'published',
        featured: false,
    },
    {
        slug: 'self-evaluation-that-works',
        title: 'Self-Evaluation That Actually Works',
        excerpt: 'Most SEFs are written in a panic. Here\'s how to make self-evaluation an ongoing process that supports improvement, not just compliance.',
        date: '2024-09-22',
        status: 'published',
        featured: false,
    },
    {
        slug: 'action-plans-that-stay-current',
        title: 'Action Plans That Stay Current',
        excerpt: 'Why school improvement plans go out of date, and how to keep them visible and actionable throughout the year.',
        date: '2024-09-05',
        status: 'published',
        featured: false,
    },
    {
        slug: 'ai-expert-work-schools',
        title: 'When AI Starts Replacing Expert Work (and Why Schools Should Pay Attention)',
        excerpt: 'Recent AI updates are quietly shifting expert work. What this means for schools — and why people still matter.',
        date: '2024-12-13',
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
