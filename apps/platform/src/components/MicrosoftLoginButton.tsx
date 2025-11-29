"use client";

import { useAuth } from "@/context/AuthContext";
import { LogIn } from "lucide-react";

export default function MicrosoftLoginButton() {
    const { signInWithMicrosoft } = useAuth();

    return (
        <button
            onClick={signInWithMicrosoft}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 ease-in-out transform hover:scale-105"
        >
            <LogIn size={20} />
            <span>Sign in with Microsoft</span>
        </button>
    );
}
