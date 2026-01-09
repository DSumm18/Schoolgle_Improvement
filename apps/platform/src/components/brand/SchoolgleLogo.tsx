"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface SchoolgleLogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl' | number;
    showText?: boolean;
}

const SchoolgleLogo = ({ size = 'md', showText = false }: SchoolgleLogoProps) => {
    const sizeMap = {
        sm: 32,
        md: 48,
        lg: 96,
        xl: 192,
    };

    const baseSize = typeof size === 'number' ? size : sizeMap[size];
    const sunSize = baseSize * 0.25;

    const segments = [
        { name: 'Improvement', color: '#3b82f6', speed: 3, radius: 0.4 },
        { name: 'Compliance', color: '#10b981', speed: 5, radius: 0.55 },
        { name: 'Estates', color: '#f97316', speed: 8, radius: 0.7 },
        { name: 'HR', color: '#8b5cf6', speed: 12, radius: 0.85 },
        { name: 'Finance', color: '#ef4444', speed: 18, radius: 1.0 },
        { name: 'SEND', color: '#06b6d4', speed: 25, radius: 1.15 },
    ];

    return (
        <div className="flex items-center gap-4">
            <div
                className="relative flex items-center justify-center"
                style={{ width: baseSize * 2.5, height: baseSize * 2.5 }}
            >
                {/* Central Sun */}
                <motion.div
                    animate={{
                        boxShadow: [
                            `0 0 ${sunSize * 0.5}px #f59e0b`,
                            `0 0 ${sunSize * 1.5}px #f59e0b`,
                            `0 0 ${sunSize * 0.5}px #f59e0b`,
                        ]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        width: sunSize,
                        height: sunSize,
                        backgroundColor: '#f59e0b',
                        borderRadius: '50%',
                        zIndex: 10,
                    }}
                />

                {/* Orbiting Planets */}
                {segments.map((planet, idx) => (
                    <div
                        key={planet.name}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{
                            width: baseSize * 2.5 * planet.radius,
                            height: baseSize * 2.5 * planet.radius,
                        }}
                    >
                        {/* Orbit Path Ring */}
                        <div className="absolute inset-0 border border-gray-200 dark:border-white/10 rounded-full" />

                        {/* Planet Container */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: planet.speed,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                            style={{ width: '100%', height: '100%', position: 'relative' }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '-3px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: baseSize * 0.08,
                                    height: baseSize * 0.08,
                                    backgroundColor: planet.color,
                                    borderRadius: '50%',
                                    boxShadow: `0 0 ${baseSize * 0.1}px ${planet.color}`,
                                }}
                            />
                        </motion.div>
                    </div>
                ))}
            </div>

            {showText && (
                <span
                    className="font-black tracking-tighter outfit leading-none"
                    style={{ fontSize: baseSize * 0.6 }}
                >
                    SCHOOLGLE
                </span>
            )}
        </div>
    );
};

export default SchoolgleLogo;
