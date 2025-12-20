"use client";

import { useAuth } from "@/context/SupabaseAuthContext";
import { LogIn } from "lucide-react";

export default function LoginButton() {
    const { signInWithGoogle } = useAuth();

    return (
        <button
            onClick={signInWithGoogle}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 ease-in-out transform hover:scale-105"
        >
            <LogIn size={20} />
            <span>Sign in with Google</span>
        </button>
    );
}
