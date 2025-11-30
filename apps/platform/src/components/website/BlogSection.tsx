"use client";

import React from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Blog {
    title: string;
    category: string;
    date: string;
}

const blogs: Blog[] = [
    {
        title: "How AI reduces workload in schools",
        category: "Thought Leadership",
        date: "Nov 20, 2025"
    },
    {
        title: "The power of browser vision for staff training",
        category: "Product",
        date: "Nov 18, 2025"
    },
    {
        title: "Preparing for inspection the smart way",
        category: "Guides",
        date: "Nov 15, 2025"
    },
    {
        title: "Why multilingual chatbots matter in 2025",
        category: "Inclusion",
        date: "Nov 10, 2025"
    }
];

const BlogSection = () => {
    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between mb-12">
                    <h2 className="text-3xl font-medium text-gray-900">Latest from the blog</h2>
                    <Link href="#" className="text-blue-600 font-medium hover:text-blue-700 flex items-center gap-2">
                        View all posts <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {blogs.map((blog, index) => (
                        <Link key={index} href="#" className="group block">
                            <div className="aspect-[4/3] bg-gray-200 rounded-2xl mb-4 overflow-hidden">
                                {/* Placeholder for blog image */}
                                <div className="w-full h-full bg-gray-300 group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <span className="font-medium text-blue-600">{blog.category}</span>
                                    <span>•</span>
                                    <span>{blog.date}</span>
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {blog.title}
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BlogSection;

