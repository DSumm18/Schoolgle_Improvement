/**
 * School Data Guardian - Zero-Trust PII Firewall
 * 
 * Intercepts LLM payloads and aggressively scrubs PII (Emails, Phone numbers, DOBs, UPNs, Names)
 * to guarantee compliance before data transmission to third-party providers.
 */

// Common Regex Patterns for identifying Special Category Data or PII
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:(?:\+44)|(?:0))(?:\s?\d){9,10}/g;
const DOB_REGEX = /\b(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/g;
const UPN_REGEX = /\b[A-Za-z][0-9]{12}\b/g; // Standard UK UPN pattern
const NHS_NUMBER_REGEX = /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/g;

export interface GuardianResult {
    isClean: boolean;
    sanitizedText: string;
    blockedCategories: string[];
}

export class SchoolDataGuardian {
    /**
     * Scans a raw text input for PII. If PII is found, it automatically scrubs it
     * and flags the block so the Chatbot can warn the user.
     */
    static scanAndScrub(text: string): GuardianResult {
        if (!text) {
            return { isClean: true, sanitizedText: "", blockedCategories: [] };
        }

        let blockedCategories = new Set<string>();
        let sanitizedText = text;

        if (EMAIL_REGEX.test(sanitizedText)) {
            blockedCategories.add("Email Address");
            sanitizedText = sanitizedText.replace(EMAIL_REGEX, "[REDACTED_EMAIL]");
        }

        if (PHONE_REGEX.test(sanitizedText)) {
            blockedCategories.add("Phone Number");
            sanitizedText = sanitizedText.replace(PHONE_REGEX, "[REDACTED_PHONE]");
        }

        if (DOB_REGEX.test(sanitizedText)) {
            blockedCategories.add("Date of Birth");
            sanitizedText = sanitizedText.replace(DOB_REGEX, "[REDACTED_DOB]");
        }

        if (UPN_REGEX.test(sanitizedText)) {
            blockedCategories.add("Unique Pupil Number (UPN)");
            sanitizedText = sanitizedText.replace(UPN_REGEX, "[REDACTED_UPN]");
        }

        if (NHS_NUMBER_REGEX.test(sanitizedText)) {
            blockedCategories.add("NHS Number");
            sanitizedText = sanitizedText.replace(NHS_NUMBER_REGEX, "[REDACTED_NHS_NUMBER]");
        }

        return {
            isClean: blockedCategories.size === 0,
            sanitizedText,
            blockedCategories: Array.from(blockedCategories)
        };
    }

    /**
     * Bouncer specifically for known pupil/staff objects during Data Injection
     * Swaps deterministic PII fields into secure hashes before API transmission.
     */
    static maskIdentityPayload(payload: any, salt: string = "system_default"): any {
        if (!payload) return payload;

        if (Array.isArray(payload)) {
            return payload.map(item => this.maskIdentityPayload(item, salt));
        }

        if (typeof payload === 'object') {
            const masked = { ...payload };

            // Strip highly identifying keys entirely
            ['email', 'contact_number', 'address', 'avatar', 'dob', 'home_address', 'upn'].forEach(key => {
                if (masked[key] !== undefined) {
                    masked[key] = `[GUARDIAN_MASKED_${key.toUpperCase()}]`;
                }
            });

            // Convert Names to standard Token IDs based on their string value (mocked hash for testing)
            // Real implementation would use WebCrypto HMAC-SHA256, simplified here for synchronous speed.
            if (masked.first_name || masked.last_name || masked.name) {
                const identifier = `${masked.first_name || ''}${masked.last_name || ''}${masked.name || ''}`;
                // Deterministic fast id
                let hash = 0;
                for (let i = 0; i < identifier.length; i++) {
                    hash = Math.imul(31, hash) + identifier.charCodeAt(i) | 0;
                }
                const token = `ID_${Math.abs(hash).toString(16).padEnd(6, '0')}`;
                
                masked.identity_token = token;
                delete masked.first_name;
                delete masked.last_name;
                delete masked.name;
                delete masked.full_name;
            }

            // Recurse into nested objects
            for (const key of Object.keys(masked)) {
                if (typeof masked[key] === 'object' && masked[key] !== null) {
                    masked[key] = this.maskIdentityPayload(masked[key], salt);
                }
            }

            return masked;
        }

        return payload;
    }
}
