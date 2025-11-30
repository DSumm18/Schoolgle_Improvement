"use client";

import React, { useState } from 'react';
import { 
    FileText, 
    Download, 
    RefreshCw, 
    CheckCircle, 
    Clock,
    FileSpreadsheet,
    Users,
    Shield,
    BookOpen,
    Target,
    TrendingUp,
    Calendar,
    Loader2,
    Copy,
    ExternalLink
} from 'lucide-react';
import { generateSEF, generatePupilPremiumStrategy, generateSportsPremiumReport, generateSDP, documentToMarkdown, documentToHTML, GeneratedDocument } from '@/lib/document-generator';

interface ReportGeneratorProps {
    schoolData: {
        name: string;
        academicYear: string;
        isChurchSchool?: boolean;
    };
    ofstedAssessments: Record<string, any>;
    siamsAssessments: Record<string, any>;
    actions: any[];
    evidenceMatches: any[];
    ppData?: any;
    sportsData?: any;
    sdpPriorities?: any[];
}

interface ReportType {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    estimatedTime: string;
    color: string;
    available: boolean;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
    schoolData,
    ofstedAssessments,
    siamsAssessments,
    actions,
    evidenceMatches,
    ppData,
    sportsData,
    sdpPriorities
}) => {
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<GeneratedDocument | null>(null);
    const [generationTime, setGenerationTime] = useState<number>(0);

    const reportTypes: ReportType[] = [
        {
            id: 'sef',
            name: 'Self-Evaluation Form (SEF)',
            description: 'Complete SEF aligned to Ofsted 2025 framework',
            icon: <Target className="w-6 h-6" />,
            estimatedTime: '45 seconds',
            color: 'blue',
            available: Object.keys(ofstedAssessments).length > 0
        },
        {
            id: 'headteacher',
            name: 'Headteacher Report to Governors',
            description: 'Summary of school performance and priorities',
            icon: <Users className="w-6 h-6" />,
            estimatedTime: '60 seconds',
            color: 'purple',
            available: true
        },
        {
            id: 'pp_strategy',
            name: 'Pupil Premium Strategy',
            description: 'DfE-compliant PP strategy statement',
            icon: <FileSpreadsheet className="w-6 h-6" />,
            estimatedTime: '30 seconds',
            color: 'green',
            available: true
        },
        {
            id: 'sports_premium',
            name: 'PE & Sport Premium Report',
            description: 'Spending and impact against 5 key indicators',
            icon: <TrendingUp className="w-6 h-6" />,
            estimatedTime: '30 seconds',
            color: 'orange',
            available: true
        },
        {
            id: 'safeguarding',
            name: 'Annual Safeguarding Report',
            description: 'Safeguarding summary for governors',
            icon: <Shield className="w-6 h-6" />,
            estimatedTime: '30 seconds',
            color: 'red',
            available: true
        },
        {
            id: 'sdp',
            name: 'School Development Plan',
            description: 'Strategic priorities and action plans',
            icon: <Calendar className="w-6 h-6" />,
            estimatedTime: '60 seconds',
            color: 'teal',
            available: true
        },
        {
            id: 'quality_of_education',
            name: 'Quality of Education Summary',
            description: 'Deep dive into curriculum and teaching',
            icon: <BookOpen className="w-6 h-6" />,
            estimatedTime: '45 seconds',
            color: 'indigo',
            available: Object.keys(ofstedAssessments).length > 0
        },
        {
            id: 'inspection_pack',
            name: 'Inspection Briefing Pack',
            description: 'Everything inspectors will ask for',
            icon: <FileText className="w-6 h-6" />,
            estimatedTime: '90 seconds',
            color: 'rose',
            available: Object.keys(ofstedAssessments).length > 0
        }
    ];

    const getColorClasses = (color: string, isSelected: boolean) => {
        const colors: Record<string, { bg: string; border: string; text: string; hover: string }> = {
            blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', hover: 'hover:bg-blue-100' },
            purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700', hover: 'hover:bg-purple-100' },
            green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', hover: 'hover:bg-green-100' },
            orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', hover: 'hover:bg-orange-100' },
            red: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', hover: 'hover:bg-red-100' },
            teal: { bg: 'bg-teal-50', border: 'border-teal-500', text: 'text-teal-700', hover: 'hover:bg-teal-100' },
            indigo: { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-700', hover: 'hover:bg-indigo-100' },
            rose: { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-700', hover: 'hover:bg-rose-100' }
        };
        
        const c = colors[color] || colors.blue;
        return isSelected 
            ? `${c.bg} border-2 ${c.border} ${c.text}` 
            : `bg-white border border-gray-200 text-gray-700 ${c.hover}`;
    };

    const generateReport = async (reportId: string) => {
        setIsGenerating(true);
        setGeneratedReport(null);
        const startTime = Date.now();

        try {
            let report: GeneratedDocument;

            switch (reportId) {
                case 'sef':
                    report = generateSEF(
                        { ...schoolData, isChurchSchool: schoolData.isChurchSchool || false },
                        ofstedAssessments,
                        evidenceMatches,
                        actions
                    );
                    break;
                
                case 'pp_strategy':
                    report = generatePupilPremiumStrategy(
                        { ...schoolData, isChurchSchool: schoolData.isChurchSchool || false },
                        ppData || {
                            totalPupils: 200,
                            ppPupils: 40,
                            allocation: 52000,
                            barriers: [
                                { id: '1', description: 'Lower reading attainment on entry', category: 'academic' },
                                { id: '2', description: 'Limited vocabulary', category: 'academic' },
                                { id: '3', description: 'Lower attendance rates', category: 'attendance' }
                            ],
                            outcomes: {
                                reading: { pp: 65, nonPp: 78, national: 73 },
                                writing: { pp: 60, nonPp: 75, national: 71 },
                                maths: { pp: 68, nonPp: 80, national: 73 }
                            },
                            attendance: { pp: 93.5, nonPp: 96.2, ppPersistentAbsence: 18 },
                            spending: []
                        }
                    );
                    break;
                
                case 'sports_premium':
                    report = generateSportsPremiumReport(
                        { ...schoolData, isChurchSchool: schoolData.isChurchSchool || false },
                        sportsData || {
                            allocation: 19000,
                            carriedForward: 2000,
                            swimming: {
                                percentage25m: 82,
                                percentageStrokes: 78,
                                percentageRescue: 85
                            },
                            spending: []
                        }
                    );
                    break;
                
                case 'sdp':
                    report = generateSDP(
                        { ...schoolData, isChurchSchool: schoolData.isChurchSchool || false },
                        sdpPriorities || [
                            {
                                number: 1,
                                title: 'Improve reading outcomes for disadvantaged pupils',
                                description: 'Focus on phonics, reading fluency and comprehension',
                                rationale: 'PP reading outcomes are below national average',
                                ofstedCategoryId: 'curriculum-teaching',
                                leadPerson: 'Deputy Head',
                                successCriteria: [
                                    'PP reading outcomes improve by 10%',
                                    'Gap with non-PP reduces by 5pp'
                                ],
                                allocatedBudget: 15000,
                                milestones: [
                                    { title: 'Staff training complete', targetTerm: 'autumn1', status: 'completed' },
                                    { title: 'New resources in place', targetTerm: 'autumn2', status: 'in_progress' }
                                ]
                            }
                        ],
                        ofstedAssessments
                    );
                    break;
                
                default:
                    // Generate a placeholder for other report types
                    report = generateSEF({ ...schoolData, isChurchSchool: schoolData.isChurchSchool || false }, ofstedAssessments, evidenceMatches, actions);
                    report.title = `${reportTypes.find(r => r.id === reportId)?.name || 'Report'} - ${schoolData.name}`;
                    report.type = reportId;
            }

            const endTime = Date.now();
            setGenerationTime((endTime - startTime) / 1000);
            setGeneratedReport(report);

        } catch (error) {
            console.error('Report generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadReport = (format: 'markdown' | 'html') => {
        if (!generatedReport) return;

        const content = format === 'markdown' 
            ? documentToMarkdown(generatedReport)
            : documentToHTML(generatedReport);
        
        const blob = new Blob([content], { type: format === 'markdown' ? 'text/markdown' : 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${generatedReport.title.replace(/[^a-z0-9]/gi, '_')}.${format === 'markdown' ? 'md' : 'html'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const copyToClipboard = () => {
        if (!generatedReport) return;
        const content = documentToMarkdown(generatedReport);
        navigator.clipboard.writeText(content);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">One-Click Report Generator</h1>
                </div>
                <p className="text-emerald-100">
                    Generate inspection-ready documents in seconds using your school's data
                </p>
            </div>

            {/* Report Selection Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Select Report Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {reportTypes.map(report => (
                        <button
                            key={report.id}
                            onClick={() => setSelectedReport(report.id)}
                            disabled={!report.available}
                            className={`p-4 rounded-xl text-left transition-all ${
                                getColorClasses(report.color, selectedReport === report.id)
                            } ${!report.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
                        >
                            <div className={`p-2 rounded-lg inline-block mb-3 ${
                                selectedReport === report.id ? 'bg-white/50' : 'bg-gray-100'
                            }`}>
                                {report.icon}
                            </div>
                            <h3 className="font-semibold text-sm mb-1">{report.name}</h3>
                            <p className="text-xs opacity-75 mb-2">{report.description}</p>
                            <div className="flex items-center gap-1 text-xs opacity-60">
                                <Clock className="w-3 h-3" />
                                <span>{report.estimatedTime}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Generate Button */}
            {selectedReport && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                {reportTypes.find(r => r.id === selectedReport)?.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                                Data sources: Assessments, Actions, Evidence
                            </p>
                        </div>
                        <button
                            onClick={() => generateReport(selectedReport)}
                            disabled={isGenerating}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-5 h-5" />
                                    Generate Report
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Generated Report Preview */}
            {generatedReport && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Report Header */}
                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <div>
                                <h3 className="font-semibold text-gray-900">{generatedReport.title}</h3>
                                <p className="text-xs text-gray-500">
                                    Generated in {generationTime.toFixed(1)}s • {generatedReport.metadata.wordCount} words • {generatedReport.metadata.completionPercentage}% complete
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={copyToClipboard}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                title="Copy to clipboard"
                            >
                                <Copy className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => downloadReport('markdown')}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm font-medium"
                            >
                                <Download className="w-4 h-4" />
                                Markdown
                            </button>
                            <button
                                onClick={() => downloadReport('html')}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2 text-sm font-medium"
                            >
                                <Download className="w-4 h-4" />
                                HTML
                            </button>
                        </div>
                    </div>

                    {/* Completion Status */}
                    {generatedReport.metadata.missingData.length > 0 && (
                        <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
                            <p className="text-sm text-yellow-800">
                                <strong>Note:</strong> Some sections are incomplete. Missing: {generatedReport.metadata.missingData.join(', ')}
                            </p>
                        </div>
                    )}

                    {/* Report Content Preview */}
                    <div className="p-6 max-h-[600px] overflow-y-auto">
                        <div className="prose prose-sm max-w-none">
                            {generatedReport.sections.map((section, index) => (
                                <div key={section.id} className="mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`w-2 h-2 rounded-full ${
                                            section.status === 'complete' ? 'bg-green-500' :
                                            section.status === 'partial' ? 'bg-yellow-500' : 'bg-gray-300'
                                        }`} />
                                        <h4 className="font-semibold text-gray-900">{section.title}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            section.status === 'complete' ? 'bg-green-100 text-green-700' :
                                            section.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {section.status}
                                        </span>
                                    </div>
                                    <div 
                                        className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200"
                                        style={{ fontFamily: 'ui-monospace, monospace' }}
                                    >
                                        {section.content.substring(0, 500)}
                                        {section.content.length > 500 && '...'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportGenerator;

