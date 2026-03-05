// /lib/ai/utils/logger.ts
// Structured logging utility for the Schoolgle Assistant

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  provider?: string;
  agent?: string;
}

class Logger {
  private currentLevel: LogLevel;

  constructor() {
    this.currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level] >= levels[this.currentLevel];
  }

  private formatLog(level: LogLevel, message: string, context?: any, provider?: string, agent?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      provider,
      agent
    };
  }

  private log(level: LogLevel, message: string, context?: any, provider?: string, agent?: string): void {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatLog(level, message, context, provider, agent);
    
    // In development, use console with colours
    if (process.env.NODE_ENV === 'development') {
      const colours = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m'  // Red
      };
      const reset = '\x1b[0m';
      
      console.log(
        `${colours[level]}[${level.toUpperCase()}]${reset} ` +
        `${logEntry.timestamp} ` +
        `${provider ? `[${provider}] ` : ''}` +
        `${agent ? `[${agent}] ` : ''}` +
        `${message}`,
        context ? context : ''
      );
    } else {
      // In production, use structured JSON logging
      console.log(JSON.stringify(logEntry));
    }
  }

  debug(message: string, context?: any, provider?: string, agent?: string): void {
    this.log('debug', message, context, provider, agent);
  }

  info(message: string, context?: any, provider?: string, agent?: string): void {
    this.log('info', message, context, provider, agent);
  }

  warn(message: string, context?: any, provider?: string, agent?: string): void {
    this.log('warn', message, context, provider, agent);
  }

  error(message: string, context?: any, provider?: string, agent?: string): void {
    this.log('error', message, context, provider, agent);
  }

  // Specialised logging methods for common scenarios
  aiRequest(provider: string, model: string, prompt: string, context?: any): void {
    this.info(`AI Request: ${model}`, { prompt: prompt.substring(0, 100) + '...', model }, provider);
  }

  aiResponse(provider: string, model: string, latency: number, usage?: any): void {
    this.info(`AI Response: ${latency}ms`, { model, latency, usage }, provider);
  }

  voiceSynthesis(provider: string, voice: string, text: string, latency: number): void {
    this.info(`Voice Synthesis: ${voice}`, { text: text.substring(0, 50) + '...', latency }, provider);
  }

  agentHandover(from: string, to: string, reason: string): void {
    this.info(`Agent Handover: ${from} → ${to}`, { reason }, undefined, from);
  }

  actionExecution(action: string, success: boolean, details?: any): void {
    const level = success ? 'info' : 'error';
    this.log(level, `Action: ${action}`, { success, details });
  }

  voicePreload(voice: string, provider: string, success: boolean): void {
    const level = success ? 'info' : 'error';
    this.log(level, `🔊 Voice preloaded: ${voice}`, { provider }, provider);
  }
}

// Export singleton instance
export const logger = new Logger();
