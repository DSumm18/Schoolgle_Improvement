"use client";

import React from 'react';
import { Monitor, Apple } from 'lucide-react';

const DownloadSection = () => {
    return (
        <section className="py-24 bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <h2 className="text-4xl font-medium text-gray-900 mb-4">Bring Schoolgle to the desktop</h2>
                <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
                    Faster reporting, secure local document creation and a smoother experience for busy staff.
                </p>

                <div className="flex flex-col items-center gap-6">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                        <button className="px-8 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-all flex items-center gap-3 min-w-[240px] justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                            <Monitor size={20} />
                            Download for Windows
                        </button>
                        <button className="px-8 py-4 bg-gray-100 text-gray-900 rounded-full font-medium hover:bg-gray-200 transition-colors flex items-center gap-3 min-w-[240px] justify-center">
                            <Apple size={20} />
                            Download for Mac
                        </button>
                    </div>
                    <span className="text-sm text-gray-400 font-medium">Mobile and browser versions available.</span>
                </div>
            </div>
        </section>
    );
};

export default DownloadSection;

