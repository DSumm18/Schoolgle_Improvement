"use strict";
// /lib/ai/utils/logger.ts
// Structured logging utility for the Schoolgle Assistant
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    constructor() {
        this.currentLevel = process.env.LOG_LEVEL || 'info';
    }
    shouldLog(level) {
        const levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        return levels[level] >= levels[this.currentLevel];
    }
    formatLog(level, message, context, provider, agent) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            provider,
            agent
        };
    }
    log(level, message, context, provider, agent) {
        if (!this.shouldLog(level))
            return;
        const logEntry = this.formatLog(level, message, context, provider, agent);
        // In development, use console with colours
        if (process.env.NODE_ENV === 'development') {
            const colours = {
                debug: '\x1b[36m', // Cyan
                info: '\x1b[32m', // Green
                warn: '\x1b[33m', // Yellow
                error: '\x1b[31m' // Red
            };
            const reset = '\x1b[0m';
            console.log(`${colours[level]}[${level.toUpperCase()}]${reset} ` +
                `${logEntry.timestamp} ` +
                `${provider ? `[${provider}] ` : ''}` +
                `${agent ? `[${agent}] ` : ''}` +
                `${message}`, context ? context : '');
        }
        else {
            // In production, use structured JSON logging
            console.log(JSON.stringify(logEntry));
        }
    }
    debug(message, context, provider, agent) {
        this.log('debug', message, context, provider, agent);
    }
    info(message, context, provider, agent) {
        this.log('info', message, context, provider, agent);
    }
    warn(message, context, provider, agent) {
        this.log('warn', message, context, provider, agent);
    }
    error(message, context, provider, agent) {
        this.log('error', message, context, provider, agent);
    }
    // Specialised logging methods for common scenarios
    aiRequest(provider, model, prompt, context) {
        this.info(`AI Request: ${model}`, { prompt: prompt.substring(0, 100) + '...', model }, provider);
    }
    aiResponse(provider, model, latency, usage) {
        this.info(`AI Response: ${latency}ms`, { model, latency, usage }, provider);
    }
    voiceSynthesis(provider, voice, text, latency) {
        this.info(`Voice Synthesis: ${voice}`, { text: text.substring(0, 50) + '...', latency }, provider);
    }
    agentHandover(from, to, reason) {
        this.info(`Agent Handover: ${from} → ${to}`, { reason }, undefined, from);
    }
    actionExecution(action, success, details) {
        const level = success ? 'info' : 'error';
        this.log(level, `Action: ${action}`, { success, details });
    }
    voicePreload(voice, provider, success) {
        const level = success ? 'info' : 'error';
        this.log(level, `🔊 Voice preloaded: ${voice}`, { provider }, provider);
    }
}
// Export singleton instance
exports.logger = new Logger();
