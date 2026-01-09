"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

const ParallaxBackground = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            setMousePosition({
                x: (event.clientX / window.innerWidth - 0.5) * 2,
                y: (event.clientY / window.innerHeight - 0.5) * 2,
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const orbs = [
        { size: 400, color: 'rgba(59, 130, 246, 0.1)', top: '10%', left: '10%', depth: 3 },
        { size: 300, color: 'rgba(139, 92, 246, 0.1)', top: '60%', left: '80%', depth: 2 },
        { size: 500, color: 'rgba(16, 185, 129, 0.08)', top: '40%', left: '30%', depth: 5 },
        { size: 250, color: 'rgba(245, 158, 11, 0.05)', top: '15%', left: '70%', depth: 1 },
        { size: 450, color: 'rgba(244, 63, 94, 0.08)', top: '80%', left: '20%', depth: 4 },
        { size: 350, color: 'rgba(6, 182, 212, 0.08)', top: '20%', left: '40%', depth: 2 },
        { size: 280, color: 'rgba(249, 115, 22, 0.06)', top: '70%', left: '50%', depth: 3 },
        { size: 420, color: 'rgba(59, 130, 246, 0.07)', top: '90%', left: '85%', depth: 5 },
        { size: 310, color: 'rgba(139, 92, 246, 0.05)', top: '5%', left: '90%', depth: 1 },
        { size: 380, color: 'rgba(239, 68, 68, 0.05)', top: '50%', left: '5%', depth: 4 },
        { size: 260, color: 'rgba(16, 185, 129, 0.06)', top: '30%', left: '95%', depth: 2 },
        { size: 440, color: 'rgba(245, 158, 11, 0.04)', top: '25%', left: '5%', depth: 3 },
        { size: 320, color: 'rgba(59, 130, 246, 0.06)', top: '75%', left: '35%', depth: 2 },
        { size: 480, color: 'rgba(139, 92, 246, 0.05)', top: '15%', left: '25%', depth: 4 },
        { size: 290, color: 'rgba(6, 182, 212, 0.04)', top: '85%', left: '65%', depth: 3 },
        { size: 360, color: 'rgba(16, 185, 129, 0.05)', top: '45%', left: '75%', depth: 5 },
    ];

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-lp-bg"
        >
            {/* Grid Pattern Overlay */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07]"
                style={{
                    backgroundImage: `
            linear-gradient(to right, #3b82f6 1px, transparent 1px),
            linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Parallax Orbs */}
            {orbs.map((orb, i) => (
                <motion.div
                    key={i}
                    animate={{
                        x: mousePosition.x * orb.depth * 20,
                        y: mousePosition.y * orb.depth * 20,
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 150 }}
                    className="absolute rounded-full blur-[100px]"
                    style={{
                        width: orb.size,
                        height: orb.size,
                        backgroundColor: orb.color,
                        top: orb.top,
                        left: orb.left,
                    }}
                />
            ))}

            {/* Vignette Effect */}
            <div className="absolute inset-0 bg-radial-vignette pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at center, transparent 0%, rgba(10, 10, 18, 0.4) 100%)'
                }}
            />
        </div>
    );
};

export default ParallaxBackground;
