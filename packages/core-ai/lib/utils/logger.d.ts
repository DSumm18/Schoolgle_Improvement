export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
declare class Logger {
    private currentLevel;
    constructor();
    private shouldLog;
    private formatLog;
    private log;
    debug(message: string, context?: any, provider?: string, agent?: string): void;
    info(message: string, context?: any, provider?: string, agent?: string): void;
    warn(message: string, context?: any, provider?: string, agent?: string): void;
    error(message: string, context?: any, provider?: string, agent?: string): void;
    aiRequest(provider: string, model: string, prompt: string, context?: any): void;
    aiResponse(provider: string, model: string, latency: number, usage?: any): void;
    voiceSynthesis(provider: string, voice: string, text: string, latency: number): void;
    agentHandover(from: string, to: string, reason: string): void;
    actionExecution(action: string, success: boolean, details?: any): void;
    voicePreload(voice: string, provider: string, success: boolean): void;
}
export declare const logger: Logger;
export {};
