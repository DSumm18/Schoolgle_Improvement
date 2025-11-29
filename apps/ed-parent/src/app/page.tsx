"use client";

import { useState } from 'react';
import ParentChat from '@/components/ParentChat';
import { GraduationCap, Phone, Mail, MapPin, Clock } from 'lucide-react';

export default function Home() {
  const [schoolSlug] = useState('demo'); // In production, get from URL subdomain

  // Demo school data - in production, fetch from API based on slug
  const schoolInfo = {
    name: "St. Mary's C of E Primary School",
    address: "123 School Lane, Cambridge, CB1 2AB",
    phone: "01223 123456",
    email: "office@stmarys-pri.cambs.sch.uk",
    hours: "8:30am - 3:30pm"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
              <GraduationCap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{schoolInfo.name}</h1>
              <p className="text-sm text-gray-600">Ask Ed - Your School AI Assistant</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chat Area (Main) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
                <h2 className="text-2xl font-bold mb-2">Chat with Ed</h2>
                <p className="text-white/90">
                  Get instant answers about term dates, policies, events, and more
                </p>
              </div>

              <ParentChat
                schoolSlug={schoolSlug}
                schoolName={schoolInfo.name}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Phone size={18} className="text-emerald-600" />
                Contact Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{schoolInfo.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-gray-400 flex-shrink-0" />
                  <a href={`tel:${schoolInfo.phone}`} className="text-emerald-600 hover:underline">
                    {schoolInfo.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${schoolInfo.email}`} className="text-emerald-600 hover:underline text-xs">
                    {schoolInfo.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">{schoolInfo.hours}</span>
                </div>
              </div>
            </div>

            {/* Quick Answers */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Popular Questions</h3>
              <div className="space-y-2 text-sm">
                {[
                  "When are the next term dates?",
                  "What's the uniform policy?",
                  "How do I report my child absent?",
                  "What time does school start?"
                ].map((q, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-emerald-50 rounded-lg text-gray-700 hover:text-emerald-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Powered By */}
            <div className="text-center text-xs text-gray-500">
              <p>Powered by Schoolgle Ed AI</p>
              <p className="mt-1">Instant, accurate school information</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
