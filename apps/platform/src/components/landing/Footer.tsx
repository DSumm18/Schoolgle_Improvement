"use client";

import React from 'react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="py-20 px-6 bg-lp-bg border-t border-lp-border">
            <div className="container max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
                <div className="space-y-6 max-w-sm">
                    <Link href="/" className="text-2xl font-black tracking-tighter text-lp-text outfit">
                        SCHOOLGLE
                    </Link>
                    <p className="text-lp-text-muted text-sm leading-relaxed font-medium">
                        Building the modern OS for UK school operations. <br />
                        Proudly designed for Headteachers and SBMs.
                    </p>
                    <div className="text-[10px] font-black uppercase tracking-widest text-lp-text-muted">
                        © 2025 SCHOOLGLE LIMITED. ALL RIGHTS RESERVED.
                    </div>
                </div>

                <div className="flex flex-wrap gap-16">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-lp-text">Product</h4>
                        <div className="flex flex-col gap-3">
                            <Link href="#features" className="text-sm font-medium text-lp-text-sec hover:text-lp-text transition-colors">Features</Link>
                            <Link href="#how-it-works" className="text-sm font-medium text-lp-text-sec hover:text-lp-text transition-colors">Methodology</Link>
                            <Link href="/pricing" className="text-sm font-medium text-lp-text-sec hover:text-lp-text transition-colors">Pricing</Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-lp-text">Company</h4>
                        <div className="flex flex-col gap-3">
                            <Link href="/about" className="text-sm font-medium text-lp-text-sec hover:text-lp-text transition-colors">Our Mission</Link>
                            <Link href="/blog" className="text-sm font-medium text-lp-text-sec hover:text-lp-text transition-colors">Insights</Link>
                            <Link href="/contact" className="text-sm font-medium text-lp-text-sec hover:text-lp-text transition-colors">Support</Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-lp-text">Legal</h4>
                        <div className="flex flex-col gap-3">
                            <Link href="/privacy" className="text-sm font-medium text-lp-text-sec hover:text-lp-text transition-colors">Privacy Policy</Link>
                            <Link href="/terms" className="text-sm font-medium text-lp-text-sec hover:text-lp-text transition-colors">Terms of Service</Link>
                            <Link href="/security" className="text-sm font-medium text-lp-text-sec hover:text-lp-text transition-colors">Data Security</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
