import { describe, it, expect } from 'vitest';
import { SchoolDataGuardian } from '../src/lib/school-data-guardian';

describe('School Data Guardian - Zero-Trust PII Firewall', () => {

    describe('scanAndScrub() - Text Content', () => {
        it('should confidently allow clean text without raising alarms', () => {
            const input = "The lesson today covered the circulatory system and its function in the human body.";
            const result = SchoolDataGuardian.scanAndScrub(input);
            expect(result.isClean).toBe(true);
            expect(result.sanitizedText).toBe(input);
            expect(result.blockedCategories.length).toBe(0);
        });

        it('should detect and scrub explicit email addresses', () => {
            const input = "Please contact headteacher@my-school.co.uk immediately regarding the incident.";
            const result = SchoolDataGuardian.scanAndScrub(input);
            expect(result.isClean).toBe(false);
            expect(result.sanitizedText).toContain("[REDACTED_EMAIL]");
            expect(result.sanitizedText).not.toContain("headteacher@my-school.co.uk");
            expect(result.blockedCategories).toContain("Email Address");
        });

        it('should detect and scrub Dates of Birth', () => {
            const input = "Pupil born on 12/04/2012 has a severe allergy.";
            const result = SchoolDataGuardian.scanAndScrub(input);
            expect(result.isClean).toBe(false);
            expect(result.sanitizedText).toContain("[REDACTED_DOB]");
            expect(result.sanitizedText).not.toContain("12/04/2012");
            expect(result.blockedCategories).toContain("Date of Birth");
        });

        it('should detect and scrub strict UK UPN numbers', () => {
            const input = "Transfer UPN Y123456789012 from previous school.";
            const result = SchoolDataGuardian.scanAndScrub(input);
            expect(result.isClean).toBe(false);
            expect(result.sanitizedText).toContain("[REDACTED_UPN]");
            expect(result.sanitizedText).not.toContain("Y123456789012");
            expect(result.blockedCategories).toContain("Unique Pupil Number (UPN)");
        });

        it('should aggressively catch multiple violations in a single teacher paste', () => {
            const paste = "Hey Ed, can you write a report? Jane was born on 15-05-2015. Her mum's phone is 07700 900 123. Email her at mum@google.com. Her NHS number is 123 456 7890.";
            const result = SchoolDataGuardian.scanAndScrub(paste);
            
            expect(result.isClean).toBe(false);
            expect(result.blockedCategories.length).toBe(4);
            expect(result.blockedCategories).toContain("Date of Birth");
            expect(result.blockedCategories).toContain("Phone Number");
            expect(result.blockedCategories).toContain("Email Address");
            expect(result.blockedCategories).toContain("NHS Number");

            // Verify NONE of the raw data survived
            expect(result.sanitizedText).not.toContain("15-05-2015");
            expect(result.sanitizedText).not.toContain("07700 900 123");
            expect(result.sanitizedText).not.toContain("mum@google.com");
            expect(result.sanitizedText).not.toContain("123 456 7890");
        });
    });

    describe('maskIdentityPayload() - JSON Data Masking', () => {
        it('should instantly strip raw identifying JSON columns from MIS database payloads', () => {
            const mockDbRecord = {
                id: "uuid-123",
                first_name: "Sarah",
                last_name: "Connor",
                dob: "1985-04-12",
                email: "sarah@skynet.com",
                send_status: "E",
                grades: [9, 8, 7]
            };

            const safePayload = SchoolDataGuardian.maskIdentityPayload(mockDbRecord);

            // Assert real names are gone
            expect(safePayload.first_name).toBeUndefined();
            expect(safePayload.last_name).toBeUndefined();
            
            // Assert identity token was generated instead
            expect(safePayload.identity_token).toBeDefined();

            // Assert other PII is explicitly masked
            expect(safePayload.dob).toBe("[GUARDIAN_MASKED_DOB]");
            expect(safePayload.email).toBe("[GUARDIAN_MASKED_EMAIL]");

            // Assert safe analytics data is completely untouched
            expect(safePayload.send_status).toBe("E");
            expect(safePayload.grades).toEqual([9, 8, 7]);
        });

        it('should cascade deeply into nested relational payloads', () => {
            const mockNested = {
                class_id: "class_1",
                pupils: [
                    { name: "John", dob: "11/11/2011", notes: "Good" },
                    { name: "Jane", dob: "12/12/2012", notes: "Excellent" }
                ]
            };

            const safePayload = SchoolDataGuardian.maskIdentityPayload(mockNested);

            expect(safePayload.pupils[0].name).toBeUndefined();
            expect(safePayload.pupils[0].identity_token).toBeDefined();
            expect(safePayload.pupils[0].dob).toBe("[GUARDIAN_MASKED_DOB]");
            expect(safePayload.pupils[0].notes).toBe("Good");

            expect(safePayload.pupils[1].name).toBeUndefined();
            expect(safePayload.pupils[1].identity_token).toBeDefined();
            expect(safePayload.pupils[1].dob).toBe("[GUARDIAN_MASKED_DOB]");
            expect(safePayload.pupils[1].notes).toBe("Excellent");
        });
    });
});
