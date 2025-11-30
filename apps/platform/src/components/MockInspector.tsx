"use client";

import React, { useState } from 'react';
import { 
    Search, MessageSquare, AlertTriangle, CheckCircle, Clock,
    FileText, Loader2, ChevronRight, ChevronDown, Target,
    Shield, Users, BookOpen, TrendingUp, HelpCircle
} from 'lucide-react';

interface MockInspectorProps {
    schoolData: { name: string; phase: string };
    ofstedAssessments: Record<string, any>;
    actions: any[];
    evidenceCount: number;
}

interface InspectorQuestion {
    id: string;
    category: string;
    question: string;
    context: string;
    followUps: string[];
    expectedEvidence: string[];
    redFlags: string[];
}

interface InspectionSimulation {
    greeting: string;
    questions: InspectorQuestion[];
    challengeAreas: string[];
    tips: string[];
    overallReadiness: string;
}

const MockInspector: React.FC<MockInspectorProps> = ({
    schoolData,
    ofstedAssessments,
    actions,
    evidenceCount
}) => {
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulation, setSimulation] = useState<InspectionSimulation | null>(null);
    const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
    const [selectedPersona, setSelectedPersona] = useState('lead');
    const [chatMessages, setChatMessages] = useState<{role: string; content: string}[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isChatting, setIsChatting] = useState(false);

    const personas = [
        { id: 'lead', name: 'Lead Inspector', icon: Search, focus: 'Overall effectiveness, leadership' },
        { id: 'curriculum', name: 'Curriculum Deep Diver', icon: BookOpen, focus: 'Subject leadership, curriculum design' },
        { id: 'safeguarding', name: 'Safeguarding Lead', icon: Shield, focus: 'Child protection, culture of vigilance' },
        { id: 'send', name: 'SEND Specialist', icon: Users, focus: 'Inclusion, adaptive teaching, support' },
        { id: 'eyfs', name: 'EYFS Expert', icon: Target, focus: 'Early years provision, development' }
    ];

    const runSimulation = async () => {
        setIsSimulating(true);
        setChatMessages([]);
        
        try {
            const response = await fetch('/api/mock-inspector/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schoolData,
                    assessments: ofstedAssessments,
                    persona: selectedPersona
                })
            });

            if (response.ok) {
                const data = await response.json();
                setSimulation(data);
            } else {
                // Demo simulation
                setSimulation(generateDemoSimulation());
            }
        } catch {
            setSimulation(generateDemoSimulation());
        } finally {
            setIsSimulating(false);
        }
    };

    const generateDemoSimulation = (): InspectionSimulation => {
        const questions: InspectorQuestion[] = [
            {
                id: '1',
                category: 'Leadership',
                question: "What's your vision for education at this school, and how do you ensure all staff share it?",
                context: 'Inspectors assess whether leaders have high ambitions and a clear vision.',
                followUps: [
                    'How do you communicate this vision to new staff?',
                    'Can you give an example of how this vision influenced a recent decision?'
                ],
                expectedEvidence: ['Vision statement', 'Staff meeting minutes', 'CPD plan'],
                redFlags: ['Vague responses', 'Disconnect between stated vision and practice']
            },
            {
                id: '2',
                category: 'Curriculum',
                question: 'Talk me through how you\'ve designed the curriculum in [subject]. What are the key concepts pupils must learn?',
                context: 'Deep dives examine curriculum intent and implementation.',
                followUps: [
                    'How does this build on what pupils learned previously?',
                    'What do pupils find most challenging and how do you address this?'
                ],
                expectedEvidence: ['Curriculum map', 'Lesson sequences', 'Assessment examples'],
                redFlags: ['No clear rationale', 'Content-heavy without skill progression']
            },
            {
                id: '3',
                category: 'Safeguarding',
                question: 'Tell me about your safeguarding culture. How do staff know what to do if they have a concern?',
                context: 'Safeguarding is always inspected. Culture matters as much as procedures.',
                followUps: [
                    'What training have staff received recently?',
                    'Can you walk me through a recent case (anonymised)?'
                ],
                expectedEvidence: ['SCR', 'Training records', 'Concern logs', 'Policy'],
                redFlags: ['Hesitation', 'Gaps in training', 'Poor record keeping']
            },
            {
                id: '4',
                category: 'SEND',
                question: 'How do you identify and support pupils with SEND? What does adaptive teaching look like here?',
                context: 'Inclusion is a central focus of the new framework.',
                followUps: [
                    'How do you ensure SEND pupils access the full curriculum?',
                    'What\'s your relationship with parents of SEND pupils like?'
                ],
                expectedEvidence: ['SEND register', 'Provision maps', 'Progress data', 'EHCPs'],
                redFlags: ['Withdrawal as default', 'No progress data', 'Generic provision']
            },
            {
                id: '5',
                category: 'Behaviour',
                question: 'What are your expectations for behaviour, and how do you ensure consistency across the school?',
                context: 'Behaviour and attitudes are now part of the report card framework.',
                followUps: [
                    'How do you support pupils who struggle with behaviour?',
                    'What does your data show about exclusions and suspensions?'
                ],
                expectedEvidence: ['Behaviour policy', 'Exclusion data', 'Support plans'],
                redFlags: ['High exclusions', 'Inconsistent application', 'No support for struggling pupils']
            }
        ];

        const weakAreas = Object.entries(ofstedAssessments)
            .filter(([_, a]) => a.schoolRating === 'needs_attention' || a.schoolRating === 'urgent_improvement')
            .map(([key]) => key.replace(/-/g, ' '));

        return {
            greeting: `Good morning. I'm the Lead Inspector for today's inspection of ${schoolData.name}. We'll be spending 1-2 days looking at the quality of education, behaviour and attitudes, personal development, and leadership. Let's start with some questions.`,
            questions,
            challengeAreas: weakAreas.length > 0 ? weakAreas : ['Consider reviewing curriculum coherence', 'Ensure SEND evidence is robust'],
            tips: [
                'Be specific with examples - avoid general statements',
                'Know your data inside out, especially for disadvantaged pupils',
                'Be honest about areas for development - we can see through spin',
                'Have evidence to hand - don\'t make inspectors wait',
                'Ensure all staff can articulate the vision consistently'
            ],
            overallReadiness: evidenceCount > 20 && Object.keys(ofstedAssessments).length > 5 ? 'Good' : 'Needs more preparation'
        };
    };

    const handleChat = async () => {
        if (!userInput.trim()) return;
        
        const newMessage = { role: 'user', content: userInput };
        setChatMessages(prev => [...prev, newMessage]);
        setUserInput('');
        setIsChatting(true);

        try {
            const response = await fetch('/api/mock-inspector/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...chatMessages, newMessage],
                    persona: selectedPersona,
                    schoolContext: { ...schoolData, assessments: ofstedAssessments }
                })
            });

            if (response.ok) {
                const data = await response.json();
                setChatMessages(prev => [...prev, { role: 'inspector', content: data.response }]);
            } else {
                setChatMessages(prev => [...prev, { 
                    role: 'inspector', 
                    content: "Thank you for that response. Can you tell me more about how you monitor the impact of your actions? I'd like to understand the evidence you use to measure success."
                }]);
            }
        } catch {
            setChatMessages(prev => [...prev, { 
                role: 'inspector', 
                content: "Interesting. Now, let's talk about how you support your disadvantaged pupils specifically. What strategies have you implemented this year?"
            }]);
        } finally {
            setIsChatting(false);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'leadership': return <Target className="w-5 h-5" />;
            case 'curriculum': return <BookOpen className="w-5 h-5" />;
            case 'safeguarding': return <Shield className="w-5 h-5" />;
            case 'send': return <Users className="w-5 h-5" />;
            case 'behaviour': return <TrendingUp className="w-5 h-5" />;
            default: return <HelpCircle className="w-5 h-5" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <Search className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Mock Inspector</h1>
                </div>
                <p className="text-slate-300">Prepare for inspection with AI-powered practice scenarios</p>
            </div>

            {/* Persona Selection */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Select Inspector Persona</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {personas.map(persona => (
                        <button
                            key={persona.id}
                            onClick={() => setSelectedPersona(persona.id)}
                            className={`p-4 rounded-xl text-left transition-all ${
                                selectedPersona === persona.id 
                                    ? 'bg-slate-100 border-2 border-slate-500' 
                                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            <persona.icon className={`w-6 h-6 mb-2 ${selectedPersona === persona.id ? 'text-slate-700' : 'text-gray-400'}`} />
                            <h3 className="font-medium text-sm">{persona.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">{persona.focus}</p>
                        </button>
                    ))}
                </div>
                <button
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className="mt-4 px-6 py-3 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {isSimulating ? <><Loader2 className="w-5 h-5 animate-spin" /> Preparing...</> : <><Search className="w-5 h-5" /> Start Mock Inspection</>}
                </button>
            </div>

            {/* Simulation Results */}
            {simulation && (
                <>
                    {/* Opening */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-slate-100 rounded-full">
                                <Search className="w-6 h-6 text-slate-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Inspector Opening</h3>
                                <p className="text-gray-700 italic">"{simulation.greeting}"</p>
                            </div>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                            <h2 className="font-semibold text-gray-900">Likely Questions</h2>
                            <p className="text-sm text-gray-500">Click to expand and see follow-ups, expected evidence, and red flags</p>
                        </div>
                        <div className="divide-y">
                            {simulation.questions.map(q => (
                                <div key={q.id} className="p-4">
                                    <button
                                        onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                                        className="w-full flex items-start gap-3 text-left"
                                    >
                                        <div className={`p-2 rounded-lg ${expandedQuestion === q.id ? 'bg-slate-100' : 'bg-gray-100'}`}>
                                            {getCategoryIcon(q.category)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-medium px-2 py-0.5 bg-gray-200 rounded">{q.category}</span>
                                            </div>
                                            <p className="font-medium text-gray-900">{q.question}</p>
                                        </div>
                                        {expandedQuestion === q.id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                                    </button>
                                    
                                    {expandedQuestion === q.id && (
                                        <div className="mt-4 pl-14 space-y-4">
                                            <div className="p-3 bg-blue-50 rounded-lg">
                                                <p className="text-sm text-blue-800"><strong>Context:</strong> {q.context}</p>
                                            </div>
                                            
                                            <div>
                                                <h4 className="font-medium text-sm text-gray-700 mb-2">Likely Follow-ups:</h4>
                                                <ul className="space-y-1">{q.followUps.map((f, i) => <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><ChevronRight className="w-4 h-4 mt-0.5" />{f}</li>)}</ul>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-3 bg-green-50 rounded-lg">
                                                    <h4 className="font-medium text-sm text-green-800 mb-2">Expected Evidence</h4>
                                                    <ul className="space-y-1">{q.expectedEvidence.map((e, i) => <li key={i} className="text-sm text-green-700 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{e}</li>)}</ul>
                                                </div>
                                                <div className="p-3 bg-red-50 rounded-lg">
                                                    <h4 className="font-medium text-sm text-red-800 mb-2">Red Flags</h4>
                                                    <ul className="space-y-1">{q.redFlags.map((r, i) => <li key={i} className="text-sm text-red-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{r}</li>)}</ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Practice Chat */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Practice Conversation</h2>
                        </div>
                        <div className="h-64 overflow-y-auto p-4 space-y-4">
                            {chatMessages.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                    <p>Start a practice conversation with the inspector</p>
                                </div>
                            )}
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isChatting && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 p-3 rounded-lg"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t flex gap-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                                placeholder="Practice your response..."
                                className="flex-1 px-4 py-2 border rounded-lg"
                            />
                            <button onClick={handleChat} disabled={isChatting || !userInput.trim()} className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50">Send</button>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                        <h3 className="font-semibold text-amber-900 mb-3">💡 Top Tips for Inspection Day</h3>
                        <ul className="space-y-2">{simulation.tips.map((tip, i) => <li key={i} className="text-sm text-amber-800 flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5" />{tip}</li>)}</ul>
                    </div>
                </>
            )}
        </div>
    );
};

export default MockInspector;

