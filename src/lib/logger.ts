/**
 * Structured logging utility for the Schoolgle application
 * Provides different log levels and structured output for better debugging and monitoring
 */

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    FATAL = 'FATAL'
}

export interface LogContext {
    userId?: string;
    component?: string;
    function?: string;
    file?: string;
    provider?: string;
    requestId?: string;
    [key: string]: any;
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: LogContext;
    error?: {
        name: string;
        message: string;
        stack?: string;
        code?: string;
    };
    duration?: number;
    metadata?: Record<string, any>;
}

class Logger {
    private minLevel: LogLevel;
    private isDevelopment: boolean;
    private enableConsole: boolean;

    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.enableConsole = process.env.NEXT_PUBLIC_ENABLE_CONSOLE_LOGS !== 'false';

        // Set minimum log level based on environment
        const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel;
        this.minLevel = envLevel || (this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO);
    }

    private shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
        const currentLevelIndex = levels.indexOf(this.minLevel);
        const requestedLevelIndex = levels.indexOf(level);
        return requestedLevelIndex >= currentLevelIndex;
    }

    private formatLogEntry(entry: LogEntry): string {
        const { timestamp, level, message, context, error, duration, metadata } = entry;

        if (this.isDevelopment) {
            // Pretty format for development
            let output = `[${timestamp}] ${level}: ${message}`;

            if (context) {
                const contextStr = Object.entries(context)
                    .filter(([_, v]) => v !== undefined)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(', ');
                if (contextStr) output += ` | ${contextStr}`;
            }

            if (duration !== undefined) {
                output += ` | duration=${duration}ms`;
            }

            if (metadata) {
                output += ` | ${JSON.stringify(metadata)}`;
            }

            return output;
        } else {
            // JSON format for production (better for log aggregation)
            return JSON.stringify(entry);
        }
    }

    private log(level: LogLevel, message: string, context?: LogContext, error?: Error | unknown, metadata?: Record<string, any>): void {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            metadata
        };

        // Add error details if present
        if (error) {
            if (error instanceof Error) {
                entry.error = {
                    name: error.name,
                    message: error.message,
                    stack: this.isDevelopment ? error.stack : undefined,
                    code: (error as any).code
                };
            } else {
                entry.error = {
                    name: 'Unknown Error',
                    message: String(error)
                };
            }
        }

        const formattedLog = this.formatLogEntry(entry);

        // Output to console based on level
        if (this.enableConsole) {
            switch (level) {
                case LogLevel.DEBUG:
                    console.debug(formattedLog);
                    if (error && this.isDevelopment) console.debug(error);
                    break;
                case LogLevel.INFO:
                    console.info(formattedLog);
                    break;
                case LogLevel.WARN:
                    console.warn(formattedLog);
                    if (error && this.isDevelopment) console.warn(error);
                    break;
                case LogLevel.ERROR:
                case LogLevel.FATAL:
                    console.error(formattedLog);
                    if (error) console.error(error);
                    break;
            }
        }

        // In production, you would also send logs to a logging service here
        // e.g., Sentry, LogRocket, CloudWatch, etc.
        if (!this.isDevelopment && (level === LogLevel.ERROR || level === LogLevel.FATAL)) {
            this.sendToMonitoring(entry);
        }
    }

    private sendToMonitoring(entry: LogEntry): void {
        // TODO: Integrate with monitoring service (Sentry, etc.)
        // For now, we'll just ensure it's logged
        try {
            // Example: Send to Sentry
            // Sentry.captureException(entry.error, { extra: entry });
        } catch (err) {
            // Don't let monitoring failures break the application
            console.error('Failed to send log to monitoring service:', err);
        }
    }

    debug(message: string, context?: LogContext, metadata?: Record<string, any>): void {
        this.log(LogLevel.DEBUG, message, context, undefined, metadata);
    }

    info(message: string, context?: LogContext, metadata?: Record<string, any>): void {
        this.log(LogLevel.INFO, message, context, undefined, metadata);
    }

    warn(message: string, context?: LogContext, error?: Error | unknown, metadata?: Record<string, any>): void {
        this.log(LogLevel.WARN, message, context, error, metadata);
    }

    error(message: string, context?: LogContext, error?: Error | unknown, metadata?: Record<string, any>): void {
        this.log(LogLevel.ERROR, message, context, error, metadata);
    }

    fatal(message: string, context?: LogContext, error?: Error | unknown, metadata?: Record<string, any>): void {
        this.log(LogLevel.FATAL, message, context, error, metadata);
    }

    /**
     * Measure execution time of a function
     */
    async measureTime<T>(
        operationName: string,
        fn: () => Promise<T> | T,
        context?: LogContext
    ): Promise<T> {
        const startTime = Date.now();
        this.debug(`Starting ${operationName}`, context);

        try {
            const result = await fn();
            const duration = Date.now() - startTime;
            this.info(`Completed ${operationName}`, context, { duration });
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.error(`Failed ${operationName}`, context, error, { duration });
            throw error;
        }
    }

    /**
     * Create a child logger with additional context
     */
    child(context: LogContext): ChildLogger {
        return new ChildLogger(this, context);
    }
}

/**
 * Child logger that inherits parent context
 */
class ChildLogger {
    constructor(
        private parent: Logger,
        private context: LogContext
    ) {}

    private mergeContext(additionalContext?: LogContext): LogContext {
        return { ...this.context, ...additionalContext };
    }

    debug(message: string, context?: LogContext, metadata?: Record<string, any>): void {
        this.parent.debug(message, this.mergeContext(context), metadata);
    }

    info(message: string, context?: LogContext, metadata?: Record<string, any>): void {
        this.parent.info(message, this.mergeContext(context), metadata);
    }

    warn(message: string, context?: LogContext, error?: Error | unknown, metadata?: Record<string, any>): void {
        this.parent.warn(message, this.mergeContext(context), error, metadata);
    }

    error(message: string, context?: LogContext, error?: Error | unknown, metadata?: Record<string, any>): void {
        this.parent.error(message, this.mergeContext(context), error, metadata);
    }

    fatal(message: string, context?: LogContext, error?: Error | unknown, metadata?: Record<string, any>): void {
        this.parent.fatal(message, this.mergeContext(context), error, metadata);
    }

    async measureTime<T>(
        operationName: string,
        fn: () => Promise<T> | T,
        context?: LogContext
    ): Promise<T> {
        return this.parent.measureTime(operationName, fn, this.mergeContext(context));
    }

    child(context: LogContext): ChildLogger {
        return new ChildLogger(this.parent, this.mergeContext(context));
    }
}

// Export singleton instance
export const logger = new Logger();

// Export type for child logger
export type { ChildLogger };

// Utility function to create operation-specific loggers
export function createOperationLogger(operation: string, context?: LogContext): ChildLogger {
    return logger.child({ operation, ...context });
}
