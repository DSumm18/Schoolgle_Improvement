'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronRight, Users, Calculator, FileText, Heart, TrendingUp } from 'lucide-react'

const tools = [
    {
        title: 'Staff Directory',
        description: 'Centralised people management with roles, direct reports and contact data.',
        status: 'Live',
        href: '/people',
        icon: Users
    },
    {
        title: 'Maternity Calculator',
        description: 'Specialized tool for calculating parental leave payouts and schedules.',
        status: 'Live',
        href: '/hr/maternity-leave-calculator',
        icon: Calculator
    },
    {
        title: 'Performance Review',
        description: 'Manage appraisal cycles and staff development goals.',
        status: 'Beta',
        href: '#',
        icon: TrendingUp
    }
]

export default function HRModulePage() {
    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="p-8 max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-indigo-600 p-2 rounded-xl text-white">
                                <Users size={20} />
                            </div>
                            <span className="text-[10px] font-black tracking-[0.3em] text-indigo-600 uppercase">HR & People</span>
                        </div>
                        <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none">
                            WORKFORCE <br />
                            <span className="text-gray-400">EXCELLENCE.</span>
                        </h1>
                        <p className="text-gray-500 mt-4 max-w-lg font-medium">
                            Streamline personnel management, compliance and staff wellbeing with integrated HR intelligence.
                        </p>
                    </div>
                </div>

                {/* Tools Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    {tools.map((tool, index) => (
                        <motion.div
                            key={tool.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-50 shadow-sm hover:shadow-xl transition-all group"
                        >
                            <div className="bg-indigo-50 w-14 h-14 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                                <tool.icon size={28} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">{tool.title}</h3>
                            <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">
                                {tool.description}
                            </p>
                            <Link href={tool.href}>
                                <Button variant="ghost" className="p-0 text-indigo-600 hover:text-indigo-700 font-black text-xs tracking-widest uppercase flex items-center gap-2 group/btn">
                                    Launch Tool <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Info Section */}
                <div className="bg-indigo-600 rounded-[3rem] p-12 text-white overflow-hidden relative">
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-3xl font-black mb-4">The Science of Staff Retention</h2>
                        <p className="text-indigo-100 font-medium mb-8">
                            Our HR tools are built on research from the EEF and CIPD, focusing on reducing teacher cognitive overload and fostering professional growth.
                        </p>
                        <Button className="bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-2xl px-8 h-12">
                            Research Library
                        </Button>
                    </div>
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 translate-x-1/2" />
                </div>
            </div>
        </div>
    )
}
