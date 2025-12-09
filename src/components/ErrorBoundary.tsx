"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    showDetails?: boolean;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    showStack: boolean;
}

/**
 * Error Boundary component to catch and handle React component errors
 * Provides user-friendly error messages and logging
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            showStack: false
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to our logging service
        logger.error('React component error caught by ErrorBoundary', {
            component: errorInfo.componentStack?.split('\n')[1]?.trim()
        }, error, {
            componentStack: errorInfo.componentStack
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Update state with error details
        this.setState({
            error,
            errorInfo
        });
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            showStack: false
        });
    };

    handleReload = (): void => {
        window.location.reload();
    };

    handleGoHome = (): void => {
        window.location.href = '/';
    };

    toggleStack = (): void => {
        this.setState(prev => ({ showStack: !prev.showStack }));
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const { error, errorInfo, showStack } = this.state;
            const isDevelopment = process.env.NODE_ENV === 'development';
            const showDetails = this.props.showDetails || isDevelopment;

            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                                    <AlertTriangle size={28} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">Something went wrong</h1>
                                    <p className="text-white/90 text-sm mt-1">
                                        We encountered an unexpected error
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-red-800 font-medium mb-2">
                                    Error Message:
                                </p>
                                <p className="text-sm text-red-700 font-mono bg-white p-3 rounded border border-red-100">
                                    {error?.message || 'Unknown error occurred'}
                                </p>
                            </div>

                            {showDetails && (
                                <>
                                    {/* Error Details Toggle */}
                                    <button
                                        onClick={this.toggleStack}
                                        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium text-gray-700"
                                    >
                                        <span>Technical Details</span>
                                        {showStack ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>

                                    {showStack && (
                                        <div className="space-y-3">
                                            {/* Stack Trace */}
                                            {error?.stack && (
                                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                    <p className="text-xs font-semibold text-gray-600 mb-2">
                                                        Stack Trace:
                                                    </p>
                                                    <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono bg-white p-3 rounded border border-gray-200 max-h-48 overflow-y-auto">
                                                        {error.stack}
                                                    </pre>
                                                </div>
                                            )}

                                            {/* Component Stack */}
                                            {errorInfo?.componentStack && (
                                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                    <p className="text-xs font-semibold text-gray-600 mb-2">
                                                        Component Stack:
                                                    </p>
                                                    <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono bg-white p-3 rounded border border-gray-200 max-h-48 overflow-y-auto">
                                                        {errorInfo.componentStack}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Recovery Suggestions */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm font-semibold text-blue-900 mb-2">
                                    What you can try:
                                </p>
                                <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                                    <li>Refresh the page to try again</li>
                                    <li>Return to the homepage and start over</li>
                                    <li>If the problem persists, contact support</li>
                                </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <button
                                    onClick={this.handleReset}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                                >
                                    <RefreshCw size={18} />
                                    Try Again
                                </button>
                                <button
                                    onClick={this.handleReload}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                                >
                                    <RefreshCw size={18} />
                                    Reload Page
                                </button>
                                <button
                                    onClick={this.handleGoHome}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                                >
                                    <Home size={18} />
                                    Go Home
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                            <p className="text-xs text-gray-500 text-center">
                                This error has been logged and our team will investigate.
                                {isDevelopment && ' (Development Mode)'}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<Props, 'children'>
): React.FC<P> {
    const WrappedComponent: React.FC<P> = (props) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

    return WrappedComponent;
}

export default ErrorBoundary;
