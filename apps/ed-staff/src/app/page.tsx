"use client";

import { useState } from 'react';
import {
    Camera, FileText, Users, Calendar, BarChart3,
    Settings, HelpCircle, Zap, BookOpen, Search,
    Clock, TrendingUp, Shield
} from 'lucide-react';
import StaffChat from '@/components/StaffChat';
import ScreenCapture from '@/components/ScreenCapture';

const QUICK_SKILLS = [
    {
        icon: Users,
        label: "Arbor Help",
        prompt: "I need help with Arbor MIS - can you guide me through common tasks?",
        color: "emerald"
    },
    {
        icon: FileText,
        label: "SIMS Navigation",
        prompt: "How do I navigate SIMS to complete [specific task]?",
        color: "blue"
    },
    {
        icon: Calendar,
        label: "Attendance Codes",
        prompt: "What attendance codes should I use for different scenarios?",
        color: "purple"
    },
    {
        icon: BarChart3,
        label: "Data Analysis",
        prompt: "Help me analyze pupil progress data and identify trends",
        color: "orange"
    },
    {
        icon: Shield,
        label: "Safeguarding",
        prompt: "What are the key safeguarding procedures I should follow?",
        color: "red"
    },
    {
        icon: BookOpen,
        label: "Curriculum Planning",
        prompt: "Help me plan a sequence of lessons using research-based approaches",
        color: "teal"
    },
];

export default function Home() {
    const [capturedScreen, setCapturedScreen] = useState<string | null>(null);
    const [contextPrompt, setContextPrompt] = useState<string>('');

    const handleScreenCapture = (imageData: string, prompt: string) => {
        setCapturedScreen(imageData);
        setContextPrompt(prompt);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Zap className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Ed for Staff</h1>
                                <p className="text-sm text-gray-600">Your AI assistant for school operations</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                                <Clock size={16} />
                                <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <ScreenCapture onCapture={handleScreenCapture} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chat Area */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
                                <h2 className="text-xl font-bold mb-2">Chat with Ed</h2>
                                <p className="text-sm text-indigo-100">
                                    Ask Ed anything about MIS systems, school operations, or capture your screen for contextual help
                                </p>
                            </div>
                            <StaffChat
                                schoolSlug="demo-school"
                                schoolName="Demo Primary School"
                                capturedScreen={capturedScreen}
                                contextPrompt={contextPrompt}
                                onClearCapture={() => {
                                    setCapturedScreen(null);
                                    setContextPrompt('');
                                }}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Skills */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Zap className="text-indigo-600" size={20} />
                                <h3 className="font-bold text-gray-900">Quick Skills</h3>
                            </div>
                            <div className="space-y-2">
                                {QUICK_SKILLS.map((skill, idx) => {
                                    const colorClasses = {
                                        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
                                        blue: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
                                        purple: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
                                        orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
                                        red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
                                        teal: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
                                    };
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setContextPrompt(skill.prompt)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${colorClasses[skill.color as keyof typeof colorClasses]}`}
                                        >
                                            <skill.icon size={18} className="flex-shrink-0" />
                                            <span className="text-sm font-medium">{skill.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <HelpCircle className="text-indigo-600" size={20} />
                                <h3 className="font-bold text-gray-900">Pro Tips</h3>
                            </div>
                            <ul className="space-y-3 text-sm text-gray-700">
                                <li className="flex items-start gap-2">
                                    <Camera size={16} className="mt-0.5 text-indigo-600 flex-shrink-0" />
                                    <span><strong>Screen Capture:</strong> Take a screenshot of your MIS system and Ed will provide step-by-step guidance</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Search size={16} className="mt-0.5 text-indigo-600 flex-shrink-0" />
                                    <span><strong>Specific Questions:</strong> The more specific your question, the better Ed can help you</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <TrendingUp size={16} className="mt-0.5 text-indigo-600 flex-shrink-0" />
                                    <span><strong>Data Analysis:</strong> Ask Ed to help interpret pupil data and identify patterns</span>
                                </li>
                            </ul>
                        </div>

                        {/* Stats */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Your Impact</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-gray-600">Time Saved</span>
                                        <span className="text-lg font-bold text-indigo-600">2.5 hrs</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm text-gray-600">Tasks Completed</span>
                                        <span className="text-lg font-bold text-purple-600">23</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
