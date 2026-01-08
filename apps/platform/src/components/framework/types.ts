export interface LocalEvidenceMatch {
    fileId: string;
    fileName: string;
    filePath: string;
    frameworkArea: string;
    frameworkAreaLabel: string;
    confidence: number;
    confidenceLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
    matchedKeywords: string[];
    relevantExcerpt: string;
    suggestedCategory?: string;
}

export interface ActionItem {
    id: string;
    description: string;
    category: string;
    rationale?: string;
    priority: 'low' | 'medium' | 'high';
    status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
    assignee?: string;
    dueDate?: string;
}

export interface AssessmentData {
    schoolRating?: string;
    schoolRationale?: string;
    aiRating?: string;
    aiRationale?: string;
    actions?: ActionItem[];
}

export interface FrameworkAssessment {
    [key: string]: AssessmentData;
}
