// Document Generator - Creates statutory documents from school data
// Supports: SEF, SDP, Pupil Premium Strategy, Sports Premium Report

import { STATUTORY_DOCUMENTS, EEF_TOOLKIT, DocumentRequirement } from './ed-knowledge-base';
import { OFSTED_FRAMEWORK, OFSTED_RATINGS } from './ofsted-framework';
import { SIAMS_FRAMEWORK, SIAMS_RATINGS } from './siams-framework';

// ============================================================================
// TYPES
// ============================================================================

export interface SchoolData {
    name: string;
    urn?: string;
    academicYear: string;
    isChurchSchool: boolean;
    
    // Pupil numbers
    totalPupils?: number;
    ppPupils?: number;
    sendPupils?: number;
    
    // Funding
    ppAllocation?: number;
    recoveryPremium?: number;
    sportsPremiumAllocation?: number;
    
    // Assessments
    ofstedAssessments?: Record<string, any>;
    siamsAssessments?: Record<string, any>;
    
    // Actions
    actions?: any[];
    
    // Evidence
    evidenceMatches?: any[];
}

export interface GeneratedDocument {
    type: string;
    title: string;
    academicYear: string;
    generatedAt: string;
    sections: GeneratedSection[];
    metadata: {
        wordCount: number;
        completionPercentage: number;
        missingData: string[];
    };
}

export interface GeneratedSection {
    id: string;
    title: string;
    content: string;
    status: 'complete' | 'partial' | 'empty';
    dataUsed: string[];
    suggestionsForImprovement?: string[];
}

// ============================================================================
// SEF GENERATOR
// ============================================================================

export function generateSEF(
    schoolData: SchoolData,
    assessments: Record<string, any>,
    evidenceMatches: any[],
    actions: any[]
): GeneratedDocument {
    const sections: GeneratedSection[] = [];
    
    // Generate section for each Ofsted category
    for (const category of OFSTED_FRAMEWORK) {
        const categoryAssessments = Object.entries(assessments)
            .filter(([key, _]) => key.startsWith(category.id));
        
        const categoryEvidence = evidenceMatches.filter(e => 
            e.categoryId === category.id
        );
        
        const categoryActions = actions.filter(a => 
            a.categoryId === category.id
        );
        
        // Calculate overall rating for category
        let avgRating = 'not_assessed';
        const ratings = categoryAssessments
            .map(([_, a]) => a.schoolRating)
            .filter(r => r && r !== 'not_assessed');
        
        if (ratings.length > 0) {
            const ratingScores = ratings.map(r => {
                const rating = OFSTED_RATINGS[r as keyof typeof OFSTED_RATINGS];
                return rating?.score || 0;
            });
            const avgScore = ratingScores.reduce((a, b) => a + b, 0) / ratingScores.length;
            
            if (avgScore >= 4.5) avgRating = 'exceptional';
            else if (avgScore >= 3.5) avgRating = 'strong_standard';
            else if (avgScore >= 2.5) avgRating = 'expected_standard';
            else if (avgScore >= 1.5) avgRating = 'needs_attention';
            else avgRating = 'urgent_improvement';
        }
        
        const ratingLabel = OFSTED_RATINGS[avgRating as keyof typeof OFSTED_RATINGS]?.label || 'Not Assessed';
        
        // Build strengths from assessments and evidence
        const strengths: string[] = [];
        const areasForDevelopment: string[] = [];
        
        categoryAssessments.forEach(([key, assessment]) => {
            if (assessment.schoolRationale) {
                if (assessment.schoolRating === 'exceptional' || assessment.schoolRating === 'strong_standard') {
                    strengths.push(assessment.schoolRationale);
                } else if (assessment.schoolRating === 'needs_attention' || assessment.schoolRating === 'urgent_improvement') {
                    areasForDevelopment.push(assessment.schoolRationale);
                }
            }
        });
        
        // Build content
        let content = `## ${category.name}\n\n`;
        content += `**Self-Evaluation Grade: ${ratingLabel}**\n\n`;
        
        content += `### Context\n`;
        content += `${category.description}\n\n`;
        
        content += `### Key Strengths\n`;
        if (strengths.length > 0) {
            strengths.forEach(s => {
                content += `- ${s}\n`;
            });
        } else {
            content += `_No strengths documented yet. Complete self-assessments to populate._\n`;
        }
        content += '\n';
        
        content += `### Areas for Development\n`;
        if (areasForDevelopment.length > 0) {
            areasForDevelopment.forEach(a => {
                content += `- ${a}\n`;
            });
        } else if (avgRating === 'needs_attention' || avgRating === 'urgent_improvement') {
            content += `_Areas for development should be documented for this grade._\n`;
        } else {
            content += `_No significant areas for development identified._\n`;
        }
        content += '\n';
        
        content += `### Evidence Base\n`;
        content += `${categoryEvidence.length} pieces of evidence identified:\n`;
        categoryEvidence.slice(0, 5).forEach(e => {
            content += `- ${e.documentName} (${Math.round(e.confidence * 100)}% match)\n`;
        });
        if (categoryEvidence.length > 5) {
            content += `_...and ${categoryEvidence.length - 5} more documents_\n`;
        }
        content += '\n';
        
        content += `### Actions in Progress\n`;
        const pendingActions = categoryActions.filter(a => a.status !== 'completed');
        if (pendingActions.length > 0) {
            pendingActions.forEach(a => {
                content += `- ${a.title} (${a.priority} priority, due ${a.dueDate})\n`;
            });
        } else {
            content += `_No current actions for this area._\n`;
        }
        content += '\n';
        
        sections.push({
            id: category.id,
            title: category.name,
            content,
            status: ratings.length > 0 ? (strengths.length > 0 ? 'complete' : 'partial') : 'empty',
            dataUsed: [`assessments:${categoryAssessments.length}`, `evidence:${categoryEvidence.length}`, `actions:${categoryActions.length}`]
        });
    }
    
    // Calculate completion
    const completeSections = sections.filter(s => s.status === 'complete').length;
    const totalSections = sections.length;
    const completionPercentage = Math.round((completeSections / totalSections) * 100);
    
    // Find missing data
    const missingData: string[] = [];
    sections.forEach(s => {
        if (s.status === 'empty') {
            missingData.push(`No assessment data for ${s.title}`);
        }
    });
    
    return {
        type: 'sef',
        title: `Self-Evaluation Form - ${schoolData.name}`,
        academicYear: schoolData.academicYear,
        generatedAt: new Date().toISOString(),
        sections,
        metadata: {
            wordCount: sections.reduce((acc, s) => acc + s.content.split(/\s+/).length, 0),
            completionPercentage,
            missingData
        }
    };
}

// ============================================================================
// PUPIL PREMIUM STRATEGY GENERATOR
// ============================================================================

export interface PPData {
    totalPupils: number;
    ppPupils: number;
    allocation: number;
    recoveryPremium?: number;
    
    barriers: Array<{
        id: string;
        description: string;
        category: 'academic' | 'social' | 'attendance';
    }>;
    
    outcomes: {
        reading?: { pp: number; nonPp: number; national: number };
        writing?: { pp: number; nonPp: number; national: number };
        maths?: { pp: number; nonPp: number; national: number };
    };
    
    attendance: {
        pp: number;
        nonPp: number;
        ppPersistentAbsence: number;
    };
    
    spending: Array<{
        tier: 1 | 2 | 3;
        activity: string;
        description: string;
        eefStrategyId?: string;
        cost: number;
        barrierIds: string[];
        intendedOutcomes: string;
    }>;
    
    previousYearReview?: {
        whatWorked: string[];
        whatDidntWork: string[];
        lessonsLearned: string;
    };
}

export function generatePupilPremiumStrategy(
    schoolData: SchoolData,
    ppData: PPData
): GeneratedDocument {
    const sections: GeneratedSection[] = [];
    
    // Section 1: School Overview
    const ppPercentage = ppData.ppPupils && ppData.totalPupils 
        ? Math.round((ppData.ppPupils / ppData.totalPupils) * 100) 
        : 0;
    
    let overviewContent = `## School Overview\n\n`;
    overviewContent += `| Metric | Data |\n|--------|------|\n`;
    overviewContent += `| School name | ${schoolData.name} |\n`;
    overviewContent += `| Number of pupils | ${ppData.totalPupils || '_Not provided_'} |\n`;
    overviewContent += `| Proportion disadvantaged | ${ppPercentage}% (${ppData.ppPupils || 0} pupils) |\n`;
    overviewContent += `| Pupil Premium allocation | £${ppData.allocation?.toLocaleString() || '_Not provided_'} |\n`;
    if (ppData.recoveryPremium) {
        overviewContent += `| Recovery Premium | £${ppData.recoveryPremium.toLocaleString()} |\n`;
    }
    overviewContent += `| Academic year | ${schoolData.academicYear} |\n`;
    overviewContent += `| Publish date | ${new Date().toLocaleDateString('en-GB')} |\n`;
    
    sections.push({
        id: 'overview',
        title: 'School Overview',
        content: overviewContent,
        status: ppData.totalPupils ? 'complete' : 'partial',
        dataUsed: ['totalPupils', 'ppPupils', 'allocation']
    });
    
    // Section 2: Disadvantaged Pupil Profile
    let profileContent = `## Disadvantaged Pupil Performance Overview\n\n`;
    
    if (ppData.outcomes) {
        profileContent += `### Academic Outcomes\n\n`;
        profileContent += `| Subject | PP % | Non-PP % | National % | Gap |\n`;
        profileContent += `|---------|------|----------|------------|-----|\n`;
        
        if (ppData.outcomes.reading) {
            const gap = ppData.outcomes.reading.nonPp - ppData.outcomes.reading.pp;
            profileContent += `| Reading | ${ppData.outcomes.reading.pp}% | ${ppData.outcomes.reading.nonPp}% | ${ppData.outcomes.reading.national}% | ${gap > 0 ? '-' : '+'}${Math.abs(gap)}pp |\n`;
        }
        if (ppData.outcomes.writing) {
            const gap = ppData.outcomes.writing.nonPp - ppData.outcomes.writing.pp;
            profileContent += `| Writing | ${ppData.outcomes.writing.pp}% | ${ppData.outcomes.writing.nonPp}% | ${ppData.outcomes.writing.national}% | ${gap > 0 ? '-' : '+'}${Math.abs(gap)}pp |\n`;
        }
        if (ppData.outcomes.maths) {
            const gap = ppData.outcomes.maths.nonPp - ppData.outcomes.maths.pp;
            profileContent += `| Maths | ${ppData.outcomes.maths.pp}% | ${ppData.outcomes.maths.nonPp}% | ${ppData.outcomes.maths.national}% | ${gap > 0 ? '-' : '+'}${Math.abs(gap)}pp |\n`;
        }
    }
    
    profileContent += `\n### Attendance\n\n`;
    profileContent += `| Metric | PP | Non-PP | Gap |\n`;
    profileContent += `|--------|----|---------| ----|\n`;
    profileContent += `| Overall attendance | ${ppData.attendance?.pp || '_'}% | ${ppData.attendance?.nonPp || '_'}% | ${ppData.attendance?.pp && ppData.attendance?.nonPp ? `${(ppData.attendance.nonPp - ppData.attendance.pp).toFixed(1)}pp` : '_'} |\n`;
    profileContent += `| Persistent absence | ${ppData.attendance?.ppPersistentAbsence || '_'}% | - | - |\n`;
    
    sections.push({
        id: 'profile',
        title: 'Disadvantaged Pupil Performance',
        content: profileContent,
        status: ppData.outcomes ? 'complete' : 'empty',
        dataUsed: ['outcomes', 'attendance']
    });
    
    // Section 3: Barriers to Learning
    let barriersContent = `## Barriers to Learning\n\n`;
    barriersContent += `The key barriers our disadvantaged pupils face are:\n\n`;
    
    if (ppData.barriers && ppData.barriers.length > 0) {
        ppData.barriers.forEach((barrier, i) => {
            barriersContent += `### Barrier ${i + 1}: ${barrier.description}\n`;
            barriersContent += `_Category: ${barrier.category}_\n\n`;
        });
    } else {
        barriersContent += `_Barriers have not yet been identified. This should be completed based on assessment data, pupil voice, and staff knowledge._\n`;
    }
    
    sections.push({
        id: 'barriers',
        title: 'Barriers to Learning',
        content: barriersContent,
        status: ppData.barriers?.length > 0 ? 'complete' : 'empty',
        dataUsed: ['barriers']
    });
    
    // Sections 4-6: Tiered Spending
    for (const tier of [1, 2, 3]) {
        const tierName = tier === 1 ? 'Teaching (Tier 1)' : tier === 2 ? 'Targeted Academic Support (Tier 2)' : 'Wider Strategies (Tier 3)';
        const tierDescription = tier === 1 
            ? 'High-quality teaching for all pupils, including disadvantaged'
            : tier === 2 
            ? 'Targeted interventions and small group tuition'
            : 'Non-academic barriers including attendance and wellbeing';
        
        let tierContent = `## ${tierName}\n\n`;
        tierContent += `_${tierDescription}_\n\n`;
        
        const tierSpending = ppData.spending?.filter(s => s.tier === tier) || [];
        const tierTotal = tierSpending.reduce((acc, s) => acc + s.cost, 0);
        
        if (tierSpending.length > 0) {
            tierContent += `| Activity | Cost | EEF Evidence | Barriers Addressed | Intended Outcomes |\n`;
            tierContent += `|----------|------|--------------|-------------------|-------------------|\n`;
            
            tierSpending.forEach(s => {
                const eefStrategy = s.eefStrategyId 
                    ? EEF_TOOLKIT.find(e => e.id === s.eefStrategyId)
                    : null;
                const eefEvidence = eefStrategy 
                    ? `+${eefStrategy.impactMonths} months` 
                    : '_Custom_';
                
                tierContent += `| ${s.activity} | £${s.cost.toLocaleString()} | ${eefEvidence} | ${s.barrierIds.join(', ')} | ${s.intendedOutcomes} |\n`;
            });
            
            tierContent += `\n**Tier ${tier} Total: £${tierTotal.toLocaleString()}**\n`;
        } else {
            tierContent += `_No spending allocated to Tier ${tier} yet._\n`;
        }
        
        sections.push({
            id: `tier-${tier}`,
            title: tierName,
            content: tierContent,
            status: tierSpending.length > 0 ? 'complete' : 'empty',
            dataUsed: [`tier${tier}Spending`]
        });
    }
    
    // Section 7: Review of Previous Year
    let reviewContent = `## Review of Previous Academic Year\n\n`;
    
    if (ppData.previousYearReview) {
        reviewContent += `### What Worked Well\n`;
        ppData.previousYearReview.whatWorked.forEach(item => {
            reviewContent += `- ${item}\n`;
        });
        
        reviewContent += `\n### What Didn't Work\n`;
        ppData.previousYearReview.whatDidntWork.forEach(item => {
            reviewContent += `- ${item}\n`;
        });
        
        reviewContent += `\n### Lessons Learned\n`;
        reviewContent += ppData.previousYearReview.lessonsLearned;
    } else {
        reviewContent += `_Previous year review not yet completed._\n`;
    }
    
    sections.push({
        id: 'review',
        title: 'Review of Previous Year',
        content: reviewContent,
        status: ppData.previousYearReview ? 'complete' : 'empty',
        dataUsed: ['previousYearReview']
    });
    
    // Calculate metadata
    const completeSections = sections.filter(s => s.status === 'complete').length;
    const missingData: string[] = [];
    sections.forEach(s => {
        if (s.status === 'empty') {
            missingData.push(`Missing: ${s.title}`);
        }
    });
    
    return {
        type: 'pp_strategy',
        title: `Pupil Premium Strategy Statement - ${schoolData.name}`,
        academicYear: schoolData.academicYear,
        generatedAt: new Date().toISOString(),
        sections,
        metadata: {
            wordCount: sections.reduce((acc, s) => acc + s.content.split(/\s+/).length, 0),
            completionPercentage: Math.round((completeSections / sections.length) * 100),
            missingData
        }
    };
}

// ============================================================================
// SPORTS PREMIUM REPORT GENERATOR
// ============================================================================

export interface SportsPremiumData {
    allocation: number;
    carriedForward: number;
    
    swimming: {
        percentage25m: number;
        percentageStrokes: number;
        percentageRescue: number;
    };
    
    spending: Array<{
        keyIndicator: 1 | 2 | 3 | 4 | 5;
        activity: string;
        cost: number;
        intendedImpact: string;
        actualImpact?: string;
        isSustainable: boolean;
        sustainabilityPlan?: string;
    }>;
}

export function generateSportsPremiumReport(
    schoolData: SchoolData,
    sportsData: SportsPremiumData
): GeneratedDocument {
    const sections: GeneratedSection[] = [];
    
    // Key Indicator names
    const keyIndicatorNames = {
        1: 'Engagement of all pupils in regular physical activity',
        2: 'Profile of PESSPA raised across school',
        3: 'Increased confidence, knowledge and skills of all staff',
        4: 'Broader experience of a range of sports and activities',
        5: 'Increased participation in competitive sport'
    };
    
    // Funding Overview
    let fundingContent = `## Funding Overview\n\n`;
    fundingContent += `| | Amount |\n|--|--------|\n`;
    fundingContent += `| Total amount allocated | £${sportsData.allocation?.toLocaleString() || '_Not set_'} |\n`;
    fundingContent += `| Carried forward from previous year | £${sportsData.carriedForward?.toLocaleString() || '0'} |\n`;
    fundingContent += `| **Total available** | **£${((sportsData.allocation || 0) + (sportsData.carriedForward || 0)).toLocaleString()}** |\n`;
    
    sections.push({
        id: 'funding',
        title: 'Funding Overview',
        content: fundingContent,
        status: sportsData.allocation ? 'complete' : 'empty',
        dataUsed: ['allocation', 'carriedForward']
    });
    
    // Swimming Data
    let swimmingContent = `## Swimming Data (Year 6)\n\n`;
    swimmingContent += `_Meeting national curriculum requirements for swimming and water safety_\n\n`;
    swimmingContent += `| Criteria | % Meeting |\n|----------|-----------|`;
    swimmingContent += `| Swim competently over 25 metres | ${sportsData.swimming?.percentage25m || '_'}% |\n`;
    swimmingContent += `| Use a range of strokes effectively | ${sportsData.swimming?.percentageStrokes || '_'}% |\n`;
    swimmingContent += `| Perform safe self-rescue | ${sportsData.swimming?.percentageRescue || '_'}% |\n`;
    
    sections.push({
        id: 'swimming',
        title: 'Swimming Data',
        content: swimmingContent,
        status: sportsData.swimming?.percentage25m ? 'complete' : 'empty',
        dataUsed: ['swimming']
    });
    
    // Spending by Key Indicator
    for (let ki = 1; ki <= 5; ki++) {
        const kiSpending = sportsData.spending?.filter(s => s.keyIndicator === ki) || [];
        const kiTotal = kiSpending.reduce((acc, s) => acc + s.cost, 0);
        
        let kiContent = `## Key Indicator ${ki}\n\n`;
        kiContent += `**${keyIndicatorNames[ki as keyof typeof keyIndicatorNames]}**\n\n`;
        
        if (kiSpending.length > 0) {
            kiContent += `| Activity | Cost | Impact | Sustainable? |\n`;
            kiContent += `|----------|------|--------|-------------|\n`;
            
            kiSpending.forEach(s => {
                kiContent += `| ${s.activity} | £${s.cost.toLocaleString()} | ${s.actualImpact || s.intendedImpact} | ${s.isSustainable ? '✓' : '✗'} |\n`;
            });
            
            kiContent += `\n**Key Indicator ${ki} Total: £${kiTotal.toLocaleString()}**\n`;
        } else {
            kiContent += `_No spending allocated to this key indicator._\n`;
        }
        
        sections.push({
            id: `ki-${ki}`,
            title: `Key Indicator ${ki}`,
            content: kiContent,
            status: kiSpending.length > 0 ? 'complete' : 'empty',
            dataUsed: [`keyIndicator${ki}`]
        });
    }
    
    // Calculate metadata
    const completeSections = sections.filter(s => s.status === 'complete').length;
    const missingData: string[] = [];
    sections.forEach(s => {
        if (s.status === 'empty') {
            missingData.push(`Missing: ${s.title}`);
        }
    });
    
    return {
        type: 'sports_premium',
        title: `PE and Sport Premium Report - ${schoolData.name}`,
        academicYear: schoolData.academicYear,
        generatedAt: new Date().toISOString(),
        sections,
        metadata: {
            wordCount: sections.reduce((acc, s) => acc + s.content.split(/\s+/).length, 0),
            completionPercentage: Math.round((completeSections / sections.length) * 100),
            missingData
        }
    };
}

// ============================================================================
// SDP GENERATOR
// ============================================================================

export interface SDPPriority {
    number: number;
    title: string;
    description: string;
    rationale: string;
    ofstedCategoryId?: string;
    siamsStrandId?: string;
    leadPerson: string;
    successCriteria: string[];
    allocatedBudget?: number;
    milestones: Array<{
        title: string;
        targetTerm: string;
        status: 'pending' | 'in_progress' | 'completed' | 'missed';
    }>;
}

export function generateSDP(
    schoolData: SchoolData,
    priorities: SDPPriority[],
    assessments: Record<string, any>
): GeneratedDocument {
    const sections: GeneratedSection[] = [];
    
    // Context Section
    let contextContent = `## School Context\n\n`;
    contextContent += `### Vision and Values\n`;
    contextContent += `_[School vision statement should be inserted here]_\n\n`;
    
    // Add last inspection summary
    contextContent += `### Current Position\n`;
    contextContent += `Based on self-evaluation, key strengths and areas for development are:\n\n`;
    
    // Calculate from assessments
    const strengths: string[] = [];
    const areasForDev: string[] = [];
    
    Object.entries(assessments).forEach(([key, assessment]) => {
        if (assessment.schoolRating === 'exceptional' || assessment.schoolRating === 'strong_standard') {
            if (assessment.schoolRationale) strengths.push(assessment.schoolRationale);
        } else if (assessment.schoolRating === 'needs_attention' || assessment.schoolRating === 'urgent_improvement') {
            if (assessment.schoolRationale) areasForDev.push(assessment.schoolRationale);
        }
    });
    
    contextContent += `**Strengths:**\n`;
    strengths.slice(0, 5).forEach(s => contextContent += `- ${s}\n`);
    if (strengths.length === 0) contextContent += `_Complete self-evaluation to populate_\n`;
    
    contextContent += `\n**Areas for Development:**\n`;
    areasForDev.slice(0, 5).forEach(a => contextContent += `- ${a}\n`);
    if (areasForDev.length === 0) contextContent += `_Complete self-evaluation to populate_\n`;
    
    sections.push({
        id: 'context',
        title: 'School Context',
        content: contextContent,
        status: strengths.length > 0 || areasForDev.length > 0 ? 'partial' : 'empty',
        dataUsed: ['assessments']
    });
    
    // Priorities Summary
    let summaryContent = `## Strategic Priorities ${schoolData.academicYear}\n\n`;
    summaryContent += `| # | Priority | Lead | Ofsted Link | Budget |\n`;
    summaryContent += `|---|----------|------|-------------|--------|\n`;
    
    priorities.forEach(p => {
        const ofstedLink = p.ofstedCategoryId 
            ? OFSTED_FRAMEWORK.find(c => c.id === p.ofstedCategoryId)?.name || '-'
            : '-';
        summaryContent += `| ${p.number} | ${p.title} | ${p.leadPerson} | ${ofstedLink} | £${(p.allocatedBudget || 0).toLocaleString()} |\n`;
    });
    
    sections.push({
        id: 'summary',
        title: 'Strategic Priorities Summary',
        content: summaryContent,
        status: priorities.length > 0 ? 'complete' : 'empty',
        dataUsed: ['priorities']
    });
    
    // Detailed priority sections
    priorities.forEach(priority => {
        let priorityContent = `## Priority ${priority.number}: ${priority.title}\n\n`;
        
        priorityContent += `### Rationale\n${priority.rationale || '_Not provided_'}\n\n`;
        
        priorityContent += `### Success Criteria\n`;
        if (priority.successCriteria && priority.successCriteria.length > 0) {
            priority.successCriteria.forEach(sc => {
                priorityContent += `- ${sc}\n`;
            });
        } else {
            priorityContent += `_Success criteria not defined_\n`;
        }
        
        priorityContent += `\n### Milestones\n`;
        priorityContent += `| Milestone | Target | Status |\n`;
        priorityContent += `|-----------|--------|--------|\n`;
        
        if (priority.milestones && priority.milestones.length > 0) {
            priority.milestones.forEach(m => {
                const statusEmoji = m.status === 'completed' ? '✓' : 
                                   m.status === 'in_progress' ? '🔄' : 
                                   m.status === 'missed' ? '✗' : '○';
                priorityContent += `| ${m.title} | ${m.targetTerm} | ${statusEmoji} ${m.status} |\n`;
            });
        } else {
            priorityContent += `| _No milestones defined_ | - | - |\n`;
        }
        
        sections.push({
            id: `priority-${priority.number}`,
            title: `Priority ${priority.number}: ${priority.title}`,
            content: priorityContent,
            status: priority.successCriteria?.length > 0 ? 'complete' : 'partial',
            dataUsed: [`priority${priority.number}`]
        });
    });
    
    // Calculate metadata
    const completeSections = sections.filter(s => s.status === 'complete').length;
    const missingData: string[] = [];
    sections.forEach(s => {
        if (s.status === 'empty') {
            missingData.push(`Missing: ${s.title}`);
        }
    });
    
    return {
        type: 'sdp',
        title: `School Development Plan - ${schoolData.name}`,
        academicYear: schoolData.academicYear,
        generatedAt: new Date().toISOString(),
        sections,
        metadata: {
            wordCount: sections.reduce((acc, s) => acc + s.content.split(/\s+/).length, 0),
            completionPercentage: Math.round((completeSections / sections.length) * 100),
            missingData
        }
    };
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

export function documentToMarkdown(doc: GeneratedDocument): string {
    let markdown = `# ${doc.title}\n\n`;
    markdown += `_Academic Year: ${doc.academicYear}_\n`;
    markdown += `_Generated: ${new Date(doc.generatedAt).toLocaleDateString('en-GB')}_\n\n`;
    markdown += `---\n\n`;
    
    doc.sections.forEach(section => {
        markdown += section.content + '\n\n';
    });
    
    return markdown;
}

export function documentToHTML(doc: GeneratedDocument): string {
    // Basic markdown to HTML conversion
    let html = `<!DOCTYPE html>
<html>
<head>
    <title>${doc.title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
        h1 { color: #1a365d; }
        h2 { color: #2d4a6f; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 32px; }
        h3 { color: #4a5568; }
        table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
        th { background: #f7fafc; }
        .meta { color: #718096; font-size: 14px; }
    </style>
</head>
<body>
    <h1>${doc.title}</h1>
    <p class="meta">Academic Year: ${doc.academicYear} | Generated: ${new Date(doc.generatedAt).toLocaleDateString('en-GB')}</p>
    <hr>
`;
    
    doc.sections.forEach(section => {
        // Basic markdown conversion
        let sectionHtml = section.content
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^\*\*(.*)\*\*$/gm, '<strong>$1</strong>')
            .replace(/\|(.*)\|/g, (match) => {
                const cells = match.split('|').filter(c => c.trim());
                return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
            })
            .replace(/^- (.*)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/\n/g, '<br>');
        
        html += sectionHtml;
    });
    
    html += `</body></html>`;
    return html;
}

