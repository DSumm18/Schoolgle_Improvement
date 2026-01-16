"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import LoginButton from "@/components/LoginButton";
import MicrosoftLoginButton from "@/components/MicrosoftLoginButton";
import SchoolgleAnimatedLogo from "@/components/SchoolgleAnimatedLogo";
import { Sparkles, ShieldCheck, Brain, Rocket } from "lucide-react";

export default function LoginPage() {
    const { user, loading, session } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (user || session)) {
            router.push("/dashboard");
        }
    }, [user, session, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center animated-mesh">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center animated-mesh p-6 font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 glass-card rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
                {/* Left Side: Branding & Features */}
                <div className="p-12 bg-slate-900 dark:bg-black/40 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Rocket size={300} strokeWidth={0.5} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <SchoolgleAnimatedLogo size={48} showText={false} />
                            <span className="text-2xl font-black tracking-tight font-display">Schoolgle</span>
                        </div>

                        <h1 className="text-4xl font-black leading-tight mb-6 font-display">
                            Empowering Schools with <span className="text-blue-400">AI-Driven</span> Intelligence.
                        </h1>

                        <div className="space-y-6">
                            <FeatureItem
                                icon={<ShieldCheck className="text-emerald-400" />}
                                title="Always-On Readiness"
                                description="Automated Ofsted and SIAMS evidence mapping."
                            />
                            <FeatureItem
                                icon={<Brain className="text-purple-400" />}
                                title="Strategic Analysis"
                                description="Real-time intervention modeling and risk assessment."
                            />
                        </div>
                    </div>

                    <div className="mt-12 text-slate-400 text-sm font-medium">
                        © 2025 Schoolgle. Educational Excellence, Automated.
                    </div>
                </div>

                {/* Right Side: Login Actions */}
                <div className="p-12 bg-white/10 dark:bg-slate-900/10 backdrop-blur-md flex flex-col justify-center items-center text-center space-y-10">
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-bold uppercase tracking-widest border border-blue-500/20"
                        >
                            <Sparkles size={12} />
                            Secured for Educators
                        </motion.div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display">Welcome Back</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
                            Sign in to access your school's improvement intelligence engine.
                        </p>
                    </div>

                    <div className="w-full max-w-sm space-y-6">
                        <div className="space-y-3">
                            <LoginButton />
                            <MicrosoftLoginButton />
                        </div>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] font-bold uppercase">
                                <span className="bg-transparent px-4 text-slate-400 tracking-widest leading-none">Access Restricted</span>
                            </div>
                        </div>

                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-wider">
                            By continuing, you agree to our Terms of Service <br /> and Privacy Policy specific to DfE guidelines.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

const FeatureItem = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="flex gap-4">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-lg shrink-0">
            {React.cloneElement(icon as React.ReactElement, { size: 24 })}
        </div>
        <div>
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </div>
    </div>
);
