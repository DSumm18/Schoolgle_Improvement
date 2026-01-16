"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import Navbar from '@/components/website/Navbar';
import Footer from '@/components/website/Footer';

const GenericResourcePage = () => {
    const params = useParams();
    const slug = params?.slug as string;
    
    // Extract title from path (e.g., "blog" -> "Blog")
    const title = slug?.replace(/-/g, ' ') || 'Resource';
    const capitalizedTitle = title.charAt(0).toUpperCase() + title.slice(1);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="pt-32 px-4 md:px-8 min-h-screen flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center space-y-6"
                >
                    <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-gray-900">
                        {capitalizedTitle}
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        This resource is currently under development. Stay tuned for updates!
                    </p>
                    <div className="w-16 h-1 bg-blue-500 mx-auto rounded-full opacity-50"></div>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
};

export default GenericResourcePage;

