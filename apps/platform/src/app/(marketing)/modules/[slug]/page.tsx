"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import ModulePageTemplate from '@/components/website/ModulePageTemplate';
import { moduleContent } from '@/lib/moduleContent';

export default function DynamicModulePage() {
    const params = useParams();
    const slug = params?.slug as string;
    const content = moduleContent[slug];

    if (!content) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Module Not Found</h1>
                    <p className="text-slate-500 mb-8">The module you're looking for doesn't exist yet.</p>
                </div>
            </div>
        );
    }

    return (
        <ModulePageTemplate
            moduleSlug={slug}
            howEdHelps={content.howEdHelps}
            typicalJobs={content.typicalJobs}
            whatItCovers={content.whatItCovers}
        />
    );
}
