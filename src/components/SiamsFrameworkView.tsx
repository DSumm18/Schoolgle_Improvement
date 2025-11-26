"use client";

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

// Placeholder data for SIAMS - to be replaced with real data structure later
const SIAMS_STRANDS = [
    { id: 'strand1', name: 'Strand 1: Vision and Leadership', description: 'How the school\'s Christian vision drives its work' },
    { id: 'strand2', name: 'Strand 2: Wisdom, Knowledge and Skills', description: 'Curriculum and spiritual development' },
    { id: 'strand3', name: 'Strand 3: Character Development: Hope, Aspiration and Courageous Advocacy', description: 'Ethical choices and social action' },
    { id: 'strand4', name: 'Strand 4: Community and Living Well Together', description: 'Relationships and mental health' },
    { id: 'strand5', name: 'Strand 5: Dignity and Respect', description: 'Valuing all God\'s children' },
    { id: 'strand6', name: 'Strand 6: The Impact of Collective Worship', description: 'Inclusive and inspiring worship' },
    { id: 'strand7', name: 'Strand 7: The Effectiveness of Religious Education', description: 'High quality RE teaching and learning' },
];

export default function SiamsFrameworkView() {
    return (
        <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">SIAMS Inspection Framework</h2>
                        <p className="text-gray-600">
                            Statutory Inspection of Anglican and Methodist Schools
                        </p>
                    </div>
                    <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        Church Schools Only
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-semibold text-blue-900">Coming Soon</h4>
                        <p className="text-blue-800 text-sm">
                            The SIAMS framework module is currently in development. It will feature the same granular scoring, evidence linking, and gap analysis tools as the Ofsted framework.
                        </p>
                    </div>
                </div>

                <div className="space-y-3 opacity-75">
                    {SIAMS_STRANDS.map((strand) => (
                        <div key={strand.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h3 className="font-semibold text-gray-900">{strand.name}</h3>
                            <p className="text-sm text-gray-600">{strand.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
