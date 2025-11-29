"use client";

import React from 'react';
import { School, Building2 } from 'lucide-react';

const AudienceSection = () => {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* For Schools */}
                    <div className="p-12 rounded-3xl bg-blue-50 border border-blue-100 flex flex-col items-start gap-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                            <School size={32} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-medium text-gray-900 mb-4">For Schools</h3>
                            <p className="text-xl text-gray-600 leading-relaxed">
                                Lightweight to adopt, powerful in use. Start with one product – add more when your team is ready.
                            </p>
                        </div>
                    </div>

                    {/* For Trusts */}
                    <div className="p-12 rounded-3xl bg-purple-50 border border-purple-100 flex flex-col items-start gap-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                            <Building2 size={32} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-medium text-gray-900 mb-4">For Trusts</h3>
                            <p className="text-xl text-gray-600 leading-relaxed">
                                Consistency, compliance and honest data across every school – without forcing everyone into the same way of working.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AudienceSection;

