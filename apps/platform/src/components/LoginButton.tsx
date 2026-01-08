"use client";

import Image from 'next/image';
import { useAuth } from "@/context/SupabaseAuthContext";
import { LogIn } from "lucide-react";

export default function LoginButton() {
    const { signInWithGoogle } = useAuth();

    return (
        <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/5 hover:scale-[1.02] active:scale-[0.98] transition-all border border-slate-200 dark:border-slate-700"
        >
            <Image
                src="https://www.google.com/favicon.ico"
                alt="Google"
                width={20}
                height={20}
                className="w-5 h-5"
            />
            <span>Continue with Google</span>
        </button>
    );
}
