/**
 * ProactiveService - Handles user engagement nudges
 */

export interface ProactiveConfig {
    idleTimeout: number; // ms
    pageRules: Record<string, string>; // URL keyword -> Message
}

export class ProactiveService {
    private idleTimer: number | null = null;
    private config: ProactiveConfig;
    private onNudge: (message: string) => void;
    private isActive = true;

    constructor(
        onNudge: (message: string) => void,
        config: Partial<ProactiveConfig> = {}
    ) {
        this.onNudge = onNudge;
        this.config = {
            idleTimeout: 30000, // 30 seconds default
            pageRules: {
                'fees': 'I know school fees can be confusing. Would you like to see our bursary options?',
                'bursary': 'We offer several financial support packages. Shall I guide you through the application?',
                'transport': 'Do you need help finding the nearest school bus stop to your home?',
                'apply': 'Starting an application is the first step! I can help you fill out this form if you like.',
                'admissions': 'Admissions are open for next year. Would you like to know about the deadlines?',
            },
            ...config,
        };

        this.init();
    }

    private init(): void {
        // Reset timer on user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach((event) => {
            document.addEventListener(event, () => this.resetTimer(), true);
        });

        // Start initial timer
        this.resetTimer();
    }

    private resetTimer(): void {
        if (!this.isActive) return;

        if (this.idleTimer) {
            window.clearTimeout(this.idleTimer);
        }

        this.idleTimer = window.setTimeout(() => {
            this.triggerNudge();
        }, this.config.idleTimeout);
    }

    private triggerNudge(): void {
        if (!this.isActive) return;

        // Check current URL against rules
        const path = window.location.pathname.toLowerCase();
        const rule = Object.entries(this.config.pageRules).find(([keyword]) =>
            path.includes(keyword)
        );

        if (rule) {
            this.onNudge(rule[1]);
        } else {
            // Generic nudge if no specific rule matches
            // Only show if we haven't shown one recently (simple check)
            if (Math.random() > 0.7) { // Don't be too annoying
                this.onNudge("I'm here if you need any help! Just ask.");
            }
        }

        // Stop nudging after triggering once per idle period to avoid spam
        this.stop();
    }

    public stop(): void {
        this.isActive = false;
        if (this.idleTimer) {
            window.clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    public start(): void {
        this.isActive = true;
        this.resetTimer();
    }
}
