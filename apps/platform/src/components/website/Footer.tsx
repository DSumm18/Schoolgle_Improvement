"use client";

import React from 'react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="bg-white py-16 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-medium text-gray-900">Schoolgle</h2>
                        <p className="text-gray-500 text-sm">Built for UK schools</p>
                    </div>

                    {/* Contact */}
                    <div className="space-y-2 text-sm text-gray-500">
                        <p className="font-medium text-gray-900">Get in touch</p>
                        <p>admin@schoolgle.co.uk</p>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-100 text-xs text-gray-400">
                    <p>© Schoolgle Limited 2025. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

