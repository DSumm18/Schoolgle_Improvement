'use client'

import { motion } from 'framer-motion'
import { Users, Search, Filter, Plus, ChevronRight, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PeoplePage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-sky-500 p-2 rounded-xl text-white">
                            <Users size={20} />
                        </div>
                        <span className="text-[10px] font-black tracking-[0.3em] text-sky-500 uppercase">People Management</span>
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none">
                        STAFF <br />
                        <span className="text-gray-400">DIRECTORY.</span>
                    </h1>
                </div>
                <Button className="bg-sky-500 hover:bg-sky-600 text-white rounded-2xl px-8 font-black h-14 shadow-lg shadow-sky-100">
                    ADD NEW STAFF MEMBER
                </Button>
            </div>

            {/* Search/Filter Bar */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Active Workforce</h2>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, role or dept..."
                            className="pl-9 pr-4 py-2 bg-gray-50 border-transparent focus:bg-white focus:border-sky-200 rounded-xl text-sm outline-none transition-all w-64"
                        />
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* Placeholder / Empty State */}
            <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                <div className="bg-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="text-gray-400" size={40} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Personnel data coming soon</h3>
                <p className="text-gray-500 mt-2 max-w-sm mx-auto font-medium">
                    We are currently synchronizing your school's MIS data to populate the directory.
                </p>
            </div>
        </div>
    )
}
