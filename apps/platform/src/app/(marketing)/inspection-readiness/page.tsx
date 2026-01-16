import ModulePageTemplate from '@/components/website/ModulePageTemplate';
import { moduleContent } from '@/lib/moduleContent';

export default function InspectionReadinessPage() {
    const content = moduleContent.improvement;
    return (
        <ModulePageTemplate
            moduleSlug="improvement"
            howEdHelps={content.howEdHelps}
            typicalJobs={content.typicalJobs}
            whatItCovers={content.whatItCovers}
        />
    );
}
