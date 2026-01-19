"use client";

import React from 'react';
import Navbar from '@/components/website/Navbar';
import { OrbitBackground } from '@/components/effects';
import Hero from '@/components/website/Hero';
import TaskStrip from '@/components/website/TaskStrip';
import ProblemStatement from '@/components/website/ProblemStatement';
import WhatSchoolgleDoes from '@/components/website/WhatSchoolgleDoes';
import TrustSection from '@/components/website/TrustSection';
import PreviewModules from '@/components/website/PreviewModules';
import ProductsSection from '@/components/website/ProductsSection';
import EarlyAccessForm from '@/components/website/EarlyAccessForm';
import Footer from '@/components/website/Footer';

export default function HomePage() {
    return (
        <>
            {/* 1) Hero Section */}
            <Hero />

            {/* 1.5) Task Strip */}
            <TaskStrip />

            {/* 2) The Problem */}
            <ProblemStatement />

            {/* 3) What Schoolgle Is (positioning) */}
            <WhatSchoolgleDoes />

            {/* 3.5) Products */}
            <ProductsSection />

            {/* 4) Modules overview */}
            <PreviewModules />

            {/* 5) Trust & GDPR reassurance */}
            <TrustSection />

            {/* 6) Final CTA */}
            <EarlyAccessForm />
        </>
    );
}
