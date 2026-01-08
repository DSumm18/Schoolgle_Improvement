"use client";

import React from 'react';
import { useAuth } from "@/context/SupabaseAuthContext";
import { LogIn } from "lucide-react";

export default function MicrosoftLoginButton() {
    const { signInWithMicrosoft } = useAuth();

    return (
        <button
            onClick={signInWithMicrosoft}
            className="w-full flex items-center justify-center gap-3 bg-[#2F2F2F] hover:bg-[#1F1F1F] text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/5 hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/5"
        >
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                <div className="bg-[#F25022] w-full h-full"></div>
                <div className="bg-[#7FBA00] w-full h-full"></div>
                <div className="bg-[#00A4EF] w-full h-full"></div>
                <div className="bg-[#FFB900] w-full h-full"></div>
            </div>
            <span>Continue with Microsoft</span>
        </button>
    );
}
