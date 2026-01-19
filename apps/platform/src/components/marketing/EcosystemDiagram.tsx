"use client";

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';

const EcosystemDiagram = () => {
    const shouldReduceMotion = useReducedMotion();
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const nodes = [
        { id: 'compliance', label: 'Compliance', initial: 'C', x: 150, y: 100, color: '#a855f7', tooltip: 'Statutory checks & policy management' },
        { id: 'estates', label: 'Estates', initial: 'E', x: 450, y: 100, color: '#0d9488', tooltip: 'Health & safety and asset tracking' },
        { id: 'hr', label: 'HR & People', initial: 'HR', x: 550, y: 300, color: '#0ea5e9', tooltip: 'Staff wellbeing & performance reviews' },
        { id: 'finance', label: 'Finance', initial: 'F', x: 450, y: 500, color: '#f59e0b', tooltip: 'Budget monitoring & SFVS compliance' },
        { id: 'send', label: 'SEND', initial: 'S', x: 150, y: 500, color: '#22c55e', tooltip: 'Provision mapping & EHCP workflows' },
        { id: 'improvement', label: 'Improvement', initial: 'I', x: 50, y: 300, color: '#6366f1', tooltip: 'Inspection readiness & SIAMS prep' },
    ];

    const center = { x: 300, y: 300, label: 'ED' };

    if (!mounted) return <div className="aspect-square max-w-[600px] mx-auto" />;

    return (
        <div className="relative w-full aspect-square max-w-[600px] mx-auto flex items-center justify-center p-8 select-none">
            <svg viewBox="0 0 600 600" className="w-full h-full overflow-visible">
                {/* Connecting Lines */}
                <g className="opacity-10 dark:opacity-20">
                    {nodes.map((node) => (
                        <motion.line
                            key={`line-${node.id}`}
                            x1={node.x}
                            y1={node.y}
                            x2={center.x}
                            y2={center.y}
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />
                    ))}
                </g>

                {/* Outer Nodes (Planet Badges) */}
                {nodes.map((node, i) => (
                    <motion.g
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 + 0.5 }}
                        onMouseEnter={() => setHoveredNode(node.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                        onClick={() => setHoveredNode(hoveredNode === node.id ? null : node.id)}
                        onFocus={() => setHoveredNode(node.id)}
                        onBlur={() => setHoveredNode(null)}
                        tabIndex={0}
                        role="button"
                        aria-label={`View details for ${node.label}`}
                        className="cursor-pointer outline-none"
                    >
                        {/* Orbit Path / Ring */}
                        <motion.circle
                            cx={node.x}
                            cy={node.y}
                            r="42"
                            fill="none"
                            stroke={node.color}
                            strokeWidth="1"
                            strokeDasharray="2 4"
                            className="opacity-20 dark:opacity-40"
                            animate={shouldReduceMotion ? {} : {
                                rotate: 360,
                            }}
                            transition={{ duration: 10 + i, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Main Badge Body */}
                        <motion.circle
                            cx={node.x}
                            cy={node.y}
                            r="32"
                            className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-white/10 shadow-lg"
                            strokeWidth="1.5"
                            animate={shouldReduceMotion ? {} : {
                                y: [0, -8, 0],
                                transition: { duration: 4 + i, repeat: Infinity, ease: "easeInOut" }
                            }}
                            whileHover={{ scale: 1.1, strokeWidth: 2, stroke: node.color }}
                            whileFocus={{ scale: 1.1, strokeWidth: 2, stroke: node.color }}
                        />

                        {/* Tinted Accent Inner Ring */}
                        <circle
                            cx={node.x}
                            cy={node.y}
                            r="26"
                            fill="none"
                            stroke={node.color}
                            strokeWidth="0.5"
                            className="opacity-30"
                        />

                        {/* Initial Text */}
                        <text
                            x={node.x}
                            y={node.y + 4}
                            textAnchor="middle"
                            className="text-[12px] font-black outfit"
                            fill={node.color}
                        >
                            {node.initial}
                        </text>

                        {/* Label beneath badge */}
                        <text
                            x={node.x}
                            y={node.y + 55}
                            textAnchor="middle"
                            className="text-[10px] font-black uppercase tracking-widest outfit fill-slate-900 dark:fill-white"
                        >
                            {node.label}
                        </text>

                        {/* Tooltip Background & Text */}
                        <AnimatePresence>
                            {hoveredNode === node.id && (
                                <motion.g
                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                    className="pointer-events-none"
                                >
                                    <rect
                                        x={node.x - 85}
                                        y={node.y - 80}
                                        width="170"
                                        height="34"
                                        rx="17"
                                        className="fill-slate-900 dark:fill-white shadow-2xl"
                                    />
                                    <text
                                        x={node.x}
                                        y={node.y - 58}
                                        textAnchor="middle"
                                        className="text-[10px] font-black fill-white dark:fill-slate-900 outfit uppercase tracking-tighter"
                                    >
                                        {node.tooltip}
                                    </text>
                                </motion.g>
                            )}
                        </AnimatePresence>
                    </motion.g>
                ))}

                {/* Central Hub */}
                <motion.g
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Shadow layer */}
                    <circle
                        cx={center.x}
                        cy={center.y}
                        r="85"
                        fill="black"
                        className="opacity-5 blur-xl pointer-events-none"
                    />

                    <motion.circle
                        cx={center.x}
                        cy={center.y}
                        r="80"
                        className="fill-white dark:fill-slate-900 stroke-slate-200 dark:stroke-white/10"
                        strokeWidth="2"
                    />

                    {/* Pulse Ring */}
                    <motion.circle
                        cx={center.x}
                        cy={center.y}
                        r="80"
                        fill="none"
                        stroke={nodes[5].color}
                        strokeWidth="2"
                        className="opacity-20"
                        animate={shouldReduceMotion ? {} : {
                            scale: [1, 1.1, 1],
                            opacity: [0.2, 0, 0.2]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />

                    <motion.circle
                        cx={center.x}
                        cy={center.y}
                        r="64"
                        fill="none"
                        stroke={nodes[0].color}
                        strokeWidth="0.5"
                        strokeDasharray="2 6"
                        animate={shouldReduceMotion ? {} : { rotate: 360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    />

                    <text
                        x={center.x}
                        y={center.y + 12}
                        textAnchor="middle"
                        className="text-5xl font-black uppercase tracking-tighter fill-slate-900 dark:fill-white outfit"
                    >
                        {center.label}
                    </text>
                </motion.g>

                {/* Ambient Center Glow */}
                <circle
                    cx={center.x}
                    cy={center.y}
                    r="150"
                    fill="url(#centerGlow)"
                    className="pointer-events-none opacity-40 dark:opacity-20"
                />

                <defs>
                    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </radialGradient>
                </defs>
            </svg>
        </div>
    );
};

export default EcosystemDiagram;
