"use client";

import React from 'react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="bg-white pt-24 pb-12 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">

                    {/* Brand & Address */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-medium text-gray-900">Schoolgle</h2>
                        <div className="text-gray-500 space-y-2 text-sm">
                            <p className="font-medium text-gray-900">Schoolgle Limited</p>
                            <p>Registered Office: 46 Hawthorn Drive</p>
                            <p>Yeadon, Leeds, LS19 7XB</p>
                        </div>
                        <div className="text-gray-500 space-y-1 text-sm">
                            <p>Email: admin@schoolgle.co.uk</p>
                            <p>Phone: 07909 524414</p>
                        </div>
                    </div>

                    {/* Products */}
                    <div>
                        <h3 className="font-medium text-gray-900 mb-6">Products</h3>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/products/ed-parent" className="text-gray-500 hover:text-black transition-colors">Schoolgle Ed (Parents)</Link></li>
                            <li><Link href="/products/ed-staff" className="text-gray-500 hover:text-black transition-colors">Schoolgle Ed (Staff)</Link></li>
                            <li><Link href="/products/improvement" className="text-gray-500 hover:text-black transition-colors">Schoolgle Improvement</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-medium text-gray-900 mb-6">Company</h3>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="#" className="text-gray-500 hover:text-black transition-colors">Pricing</Link></li>
                            <li><Link href="#" className="text-gray-500 hover:text-black transition-colors">Blog</Link></li>
                            <li><Link href="#" className="text-gray-500 hover:text-black transition-colors">Support</Link></li>
                            <li><Link href="#" className="text-gray-500 hover:text-black transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="font-medium text-gray-900 mb-6">Legal</h3>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="#" className="text-gray-500 hover:text-black transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="text-gray-500 hover:text-black transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-gray-400">
                    <div className="space-y-1">
                        <p>© SCHOOLGLE LIMITED — All rights reserved 2025.</p>
                        <p>Company number: 110-692685 · Corporation Tax Ref: BRCT00003513569</p>
                    </div>
                    <div className="flex gap-6">
                        <p>Jurisdiction: England & Wales</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

