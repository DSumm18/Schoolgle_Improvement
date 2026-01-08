"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
    name?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.name || 'Component'}:`, error, errorInfo);

        // Track error in analytics
        fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'client_error',
                properties: {
                    component: this.props.name || 'Unknown',
                    error: error.message,
                    stack: error.stack,
                    componentStack: errorInfo.componentStack
                },
                timestamp: new Date().toISOString()
            })
        }).catch(() => { });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card rounded-[2.5rem] p-12 max-w-lg w-full text-center border-rose-100 dark:border-rose-900/30"
                    >
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center text-rose-600 mx-auto mb-8 shadow-inner">
                            <AlertTriangle size={40} />
                        </div>

                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                            Something went wrong
                        </h2>

                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
                            We encountered an unexpected error while rendering this part of the platform. Our team has been notified.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                            >
                                <RefreshCw size={16} />
                                Try Again
                            </button>

                            <a
                                href="/dashboard"
                                className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                            >
                                <Home size={16} />
                                Back to Safety
                            </a>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-left overflow-auto max-h-40 border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400 break-words">
                                    {this.state.error?.toString()}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
