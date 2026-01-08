import { OFSTED_FRAMEWORK } from './ofsted-framework';
import { supabase } from './supabase';

export interface SDPMilestone {
    id: string;
    title: string;
    targetDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed';
}

export interface SDPPriorityData {
    id: string;
    number: number;
    title: string;
    description: string;
    rationale: string;
    ofstedCategoryId: string;
    leadPerson: string;
    budget: number;
    successCriteria: string[];
    milestones: SDPMilestone[];
}

export interface SDPDocumentData {
    title: string;
    academicYear: string;
    priorities: SDPPriorityData[];
    totalBudget: number;
}

export const SDPGenerator = {
    /**
     * Map identified areas for development (AFDs) to strategic priorities automatically
     */
    async suggestPrioritiesFromData(organizationId: string): Promise<Partial<SDPPriorityData>[]> {
        // Fetch low-rated assessments or gap-heavy areas
        const { data: assessments } = await supabase
            .from('ofsted_assessments')
            .select('*')
            .eq('organization_id', organizationId)
            .in('school_rating', ['needs_attention', 'urgent_improvement']);

        if (!assessments || assessments.length === 0) return [];

        // Group by category
        const groups: Record<string, any[]> = {};
        assessments.forEach(a => {
            const cat = a.category_id || a.subcategory_id?.split('.')[0];
            if (cat) {
                if (!groups[cat]) groups[cat] = [];
                groups[cat].push(a);
            }
        });

        return Object.entries(groups).map(([catId, items], index) => {
            const category = OFSTED_FRAMEWORK.find(c => c.id === catId);
            return {
                id: crypto.randomUUID(),
                number: index + 1,
                title: `Strengthen ${category?.name || catId}`,
                description: `Address identified gaps in ${catId} across the curriculum.`,
                rationale: `Self-evaluation identified ${items.length} critical areas needing improvement.`,
                ofstedCategoryId: catId,
                leadPerson: "Senior Leadership Team",
                budget: 0,
                successCriteria: ["Improved inspection ready evidence coverage in all sub-areas."],
                milestones: []
            };
        });
    },

    async saveSDP(organizationId: string, sdp: SDPDocumentData) {
        const { data, error } = await supabase
            .from('sdp_documents')
            .insert({
                organization_id: organizationId,
                title: sdp.title,
                academic_year: sdp.academicYear,
                priorities: sdp.priorities,
                total_budget: sdp.priorities.reduce((acc, p) => acc + (p.budget || 0), 0),
                status: 'draft'
            });

        if (error) throw error;
        return data;
    },

    exportToHTML(sdp: SDPDocumentData): string {
        return `
            <html>
                <head>
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 50px; color: #1e293b; max-width: 1000px; margin: auto; }
                        .header { border-bottom: 5px solid #6366f1; padding-bottom: 30px; margin-bottom: 50px; }
                        h1 { font-size: 40px; font-weight: 900; margin: 0; color: #1e1b4b; }
                        .priority-card { border: 2px solid #e2e8f0; border-radius: 24px; padding: 40px; margin-bottom: 40px; page-break-inside: avoid; }
                        .priority-num { background: #6366f1; color: white; padding: 5px 15px; border-radius: 99px; font-size: 12px; font-weight: 900; vertical-align: middle; margin-right: 10px; }
                        h2 { font-size: 28px; font-weight: 800; color: #1e293b; margin-top: 0; }
                        .meta-grid { display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 20px; margin: 30px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 20px 0; }
                        .meta-item b { display: block; font-size: 10px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; }
                        .meta-item span { font-weight: 800; font-size: 14px; }
                        .milestones-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        .milestones-table th { text-align: left; font-size: 11px; color: #64748b; padding: 10px; border-bottom: 2px solid #f1f5f9; }
                        .milestones-table td { padding: 15px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
                        .status { padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800; }
                        .status-completed { background: #f0fdf4; color: #166534; }
                        .status-pending { background: #f8fafc; color: #64748b; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>School Development Plan</h1>
                        <p>${sdp.academicYear} | Total Budget Allocation: £${sdp.totalBudget?.toLocaleString()}</p>
                    </div>
                    ${sdp.priorities.map(p => `
                        <div class="priority-card">
                            <h2><span class="priority-num">Priority ${p.number}</span> ${p.title}</h2>
                            <p>${p.description}</p>
                            
                            <div class="meta-grid">
                                <div class="meta-item"><b>Lead Responsibility</b><span>${p.leadPerson}</span></div>
                                <div class="meta-item"><b>Ofsted Area</b><span>${p.ofstedCategoryId}</span></div>
                                <div class="meta-item"><b>Budget Allocation</b><span>£${p.budget?.toLocaleString()}</span></div>
                            </div>

                            <h3>Rationale</h3>
                            <p>${p.rationale}</p>

                            <h3>Success Criteria</h3>
                            <ul>${p.successCriteria.map(sc => `<li>${sc}</li>`).join('')}</ul>

                            <h3>Strategic Milestones</h3>
                            <table class="milestones-table">
                                <thead>
                                    <tr><th>Milestone</th><th>Target Date</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    ${p.milestones.map(m => `
                                        <tr>
                                            <td>${m.title}</td>
                                            <td>${new Date(m.targetDate).toLocaleDateString()}</td>
                                            <td><span class="status status-${m.status}">${m.status.toUpperCase()}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `).join('')}
                </body>
            </html>
        `;
    }
};
