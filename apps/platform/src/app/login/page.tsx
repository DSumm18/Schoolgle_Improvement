"use client";

import LoginButton from "@/components/LoginButton";
import MicrosoftLoginButton from "@/components/MicrosoftLoginButton";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SchoolgleAnimatedLogo from "@/components/SchoolgleAnimatedLogo";

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push("/");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">Schoolgle Improvement</h1>
                    <p className="text-gray-500">Always-On Inspection Readiness</p>
                </div>

                <div className="flex justify-center py-8 relative" style={{ minHeight: '200px' }}>
                    <div className="relative" style={{ width: '200px', height: '200px' }}>
                        <SchoolgleAnimatedLogo size={200} showText={true} />
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Sign in with your school account to access the dashboard and evidence engine.
                    </p>

                    <div className="flex flex-col gap-4">
                        <div className="flex justify-center">
                            <LoginButton />
                        </div>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-gray-300"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
                            <div className="flex-grow border-t border-gray-300"></div>
                        </div>

                        <div className="flex justify-center">
                            <MicrosoftLoginButton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
