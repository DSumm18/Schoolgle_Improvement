/**
 * Guardrails End-to-End Test
 *
 * Simulates Ed filling a real school contact form with fake data.
 * Validates every protection layer:
 *   1. Sensitive fields are never detected
 *   2. Blocked keywords rejected (word-boundary, no false positives)
 *   3. User controls every value before it hits the DOM
 *   4. Submit requires visual confirmation overlay (Promise-based)
 *   5. Cancel stops everything immediately
 *   6. No data stored after session ends
 *
 * Run with: npx vitest run test/guardrails-e2e.test.ts
 */
import { describe, it, expect, beforeEach, beforeAll } from "vitest";

// Polyfill CSS.escape for jsdom
beforeAll(() => {
  if (typeof CSS === "undefined" || !CSS.escape) {
    (globalThis as any).CSS = {
      escape: (str: string) => str.replace(/([^\w-])/g, (_, c) => `\\${c}`),
    };
  }
});

// ── Import FormFiller (the real class) ─────────────────────────
import { FormFiller } from "../src/features/formFill";

// ── Fake data Ed might suggest for a school staff member ────────
const FAKE_PERSON = {
  name: "Sarah Johnson",
  email: "s.johnson@example-school.sch.uk",
  phone: "01onal 555 0199",
  role: "teacher",
  subject: "English",
  message: "I would like to enquire about the Year 7 curriculum.",
  dob: "15th March 1988",
};

// ── Test HTML: Realistic school contact form ────────────────────
const SCHOOL_CONTACT_FORM = `
  <form id="contact-form" action="/enquiry" method="post">
    <input type="hidden" name="csrf_token" value="abc123secretXYZ">
    <input type="hidden" name="form_id" value="contact-v2">

    <label for="full_name">Full Name *</label>
    <input type="text" id="full_name" name="full_name" required>

    <label for="email_address">Email Address *</label>
    <input type="email" id="email_address" name="email_address" required>

    <label for="phone">Phone Number</label>
    <input type="tel" id="phone" name="phone">

    <label for="role">Your Role</label>
    <select id="role" name="role">
      <option value="">-- Please select --</option>
      <option value="parent">Parent/Carer</option>
      <option value="teacher">Teacher</option>
      <option value="governor">Governor</option>
      <option value="other">Other</option>
    </select>

    <label for="subject">Subject</label>
    <input type="text" id="subject" name="subject">

    <label for="message">Your Message *</label>
    <textarea id="message" name="message" required></textarea>

    <label>
      <input type="checkbox" name="gdpr_consent" id="gdpr_consent">
      I consent to my data being processed for this enquiry
    </label>

    <button type="submit">Send Enquiry</button>
  </form>
`;

// ── Also test a form with payment fields mixed in ───────────────
const FORM_WITH_PAYMENT_TRAP = `
  <form id="donation-form">
    <label for="donor_name">Your Name</label>
    <input type="text" id="donor_name" name="donor_name">

    <label for="donor_email">Email</label>
    <input type="email" id="donor_email" name="donor_email">

    <label for="amount">Donation Amount</label>
    <input type="number" id="amount" name="amount">

    <label for="card_number">Card Number</label>
    <input type="text" id="card_number" name="card_number">

    <label for="cvv_code">CVV</label>
    <input type="text" id="cvv_code" name="cvv_code">

    <label for="billing_postcode">Billing Postcode</label>
    <input type="text" id="billing_postcode" name="billing_postcode">

    <input type="hidden" name="payment_token" value="tok_xxx">

    <input type="password" name="pin_verify" id="pin_verify">

    <label for="gift_aid">
      <input type="checkbox" id="gift_aid" name="gift_aid">
      Add Gift Aid
    </label>

    <button type="submit">Donate</button>
  </form>
`;

// ── Form with innocent words that contain blocked substrings ────
const FORM_WITH_FALSE_POSITIVE_RISK = `
  <form id="catering-form">
    <label for="topping">Pizza Topping</label>
    <input type="text" id="topping" name="topping">

    <label for="shopping_list">Shopping List</label>
    <textarea id="shopping_list" name="shopping_list"></textarea>

    <label for="appointment_date">Appointment Date</label>
    <input type="date" id="appointment_date" name="appointment_date">

    <label for="description">Description</label>
    <input type="text" id="description" name="description">

    <label for="opinion">Your Opinion</label>
    <textarea id="opinion" name="opinion"></textarea>

    <button type="submit">Order</button>
  </form>
`;

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

describe("Guardrail: Sensitive Field Blocking", () => {
  let filler: FormFiller;

  beforeEach(() => {
    document.body.innerHTML = "";
    filler = new FormFiller();
  });

  it("never detects hidden CSRF tokens", () => {
    document.body.innerHTML = SCHOOL_CONTACT_FORM;
    const forms = filler.detectForms();
    expect(forms.length).toBe(1);
    const fieldNames = forms[0].fields.map((f) => f.label);
    expect(fieldNames).not.toContain("csrf_token");
    expect(fieldNames).not.toContain("form_id");
  });

  it("never detects password fields", () => {
    document.body.innerHTML = FORM_WITH_PAYMENT_TRAP;
    const forms = filler.detectForms();
    const fieldNames = forms[0].fields.map(
      (f) => (f.element as HTMLInputElement).name,
    );
    expect(fieldNames).not.toContain("pin_verify");
  });

  it("blocks card_number, cvv_code, billing_postcode, payment_token", () => {
    document.body.innerHTML = FORM_WITH_PAYMENT_TRAP;
    const forms = filler.detectForms();
    const fieldNames = forms[0].fields.map(
      (f) => (f.element as HTMLInputElement).name,
    );
    expect(fieldNames).not.toContain("card_number");
    expect(fieldNames).not.toContain("cvv_code");
    expect(fieldNames).not.toContain("billing_postcode");
    expect(fieldNames).not.toContain("payment_token");
  });

  it("only allows safe fields through on donation form", () => {
    document.body.innerHTML = FORM_WITH_PAYMENT_TRAP;
    const forms = filler.detectForms();
    const fieldNames = forms[0].fields.map(
      (f) => (f.element as HTMLInputElement).name,
    );
    // Only donor_name, donor_email, amount, and gift_aid should pass
    expect(fieldNames).toEqual(
      expect.arrayContaining([
        "donor_name",
        "donor_email",
        "amount",
        "gift_aid",
      ]),
    );
    expect(fieldNames.length).toBe(4);
  });
});

describe("Guardrail: No False Positives on Innocent Words", () => {
  let filler: FormFiller;

  beforeEach(() => {
    document.body.innerHTML = "";
    filler = new FormFiller();
  });

  it("allows 'topping' (not blocked by 'pin' or 'token')", () => {
    document.body.innerHTML = FORM_WITH_FALSE_POSITIVE_RISK;
    const forms = filler.detectForms();
    const names = forms[0].fields.map(
      (f) =>
        (f.element as HTMLInputElement).name ||
        (f.element as HTMLTextAreaElement).name,
    );
    expect(names).toContain("topping");
  });

  it("allows 'shopping_list' (not blocked by 'pin')", () => {
    document.body.innerHTML = FORM_WITH_FALSE_POSITIVE_RISK;
    const forms = filler.detectForms();
    const names = forms[0].fields.map(
      (f) =>
        (f.element as HTMLInputElement).name ||
        (f.element as HTMLTextAreaElement).name,
    );
    expect(names).toContain("shopping_list");
  });

  it("allows 'appointment_date' (not blocked by 'pin')", () => {
    document.body.innerHTML = FORM_WITH_FALSE_POSITIVE_RISK;
    const forms = filler.detectForms();
    const names = forms[0].fields.map(
      (f) =>
        (f.element as HTMLInputElement).name ||
        (f.element as HTMLTextAreaElement).name,
    );
    expect(names).toContain("appointment_date");
  });

  it("allows 'description' (not blocked by 'secret')", () => {
    document.body.innerHTML = FORM_WITH_FALSE_POSITIVE_RISK;
    const forms = filler.detectForms();
    const names = forms[0].fields.map(
      (f) =>
        (f.element as HTMLInputElement).name ||
        (f.element as HTMLTextAreaElement).name,
    );
    expect(names).toContain("description");
  });

  it("allows 'opinion' (not blocked by 'pin')", () => {
    document.body.innerHTML = FORM_WITH_FALSE_POSITIVE_RISK;
    const forms = filler.detectForms();
    const names = forms[0].fields.map(
      (f) =>
        (f.element as HTMLInputElement).name ||
        (f.element as HTMLTextAreaElement).name,
    );
    expect(names).toContain("opinion");
  });

  it("detects all 5 fields in the catering form", () => {
    document.body.innerHTML = FORM_WITH_FALSE_POSITIVE_RISK;
    const forms = filler.detectForms();
    expect(forms[0].fields.length).toBe(5);
  });
});

describe("Guardrail: Full Form Fill with Fake Data", () => {
  let filler: FormFiller;

  beforeEach(() => {
    document.body.innerHTML = SCHOOL_CONTACT_FORM;
    filler = new FormFiller();
  });

  it("detects the contact form with correct fillable fields", () => {
    const forms = filler.detectForms();
    expect(forms.length).toBe(1);
    // 5 visible inputs + 1 select + 1 textarea + 1 checkbox = 8
    // minus 2 hidden fields (csrf_token, form_id) = should not be counted
    const labels = forms[0].fields.map((f) => f.label);
    expect(labels).toContain("Full Name *");
    expect(labels).toContain("Email Address *");
    expect(labels).toContain("Phone Number");
    expect(labels).toContain("Your Role");
    expect(labels).toContain("Subject");
    expect(labels).toContain("Your Message *");
  });

  it("fills each field step by step (user provides each value)", () => {
    const forms = filler.detectForms();
    const firstField = filler.startFilling(forms[0].element);

    // Field 1: Full Name
    expect(firstField?.label).toContain("Full Name");
    filler.fillCurrentField(FAKE_PERSON.name);
    expect(
      (document.getElementById("full_name") as HTMLInputElement).value,
    ).toBe("Sarah Johnson");

    // Field 2: Email
    const f2 = filler.nextField();
    expect(f2?.label).toContain("Email");
    filler.fillCurrentField(FAKE_PERSON.email);
    expect(
      (document.getElementById("email_address") as HTMLInputElement).value,
    ).toBe("s.johnson@example-school.sch.uk");

    // Field 3: Phone
    const f3 = filler.nextField();
    expect(f3?.label).toContain("Phone");
    filler.fillCurrentField(FAKE_PERSON.phone);

    // Field 4: Role (dropdown — fuzzy match)
    const f4 = filler.nextField();
    expect(f4?.label).toContain("Role");
    filler.fillFieldByVoice("teacher");
    expect((document.getElementById("role") as HTMLSelectElement).value).toBe(
      "teacher",
    );

    // Field 5: Subject
    const f5 = filler.nextField();
    expect(f5?.label).toContain("Subject");
    filler.fillCurrentField(FAKE_PERSON.subject);

    // Field 6: Message (textarea)
    const f6 = filler.nextField();
    expect(f6?.label).toContain("Message");
    filler.fillCurrentField(FAKE_PERSON.message);
    expect(
      (document.getElementById("message") as HTMLTextAreaElement).value,
    ).toBe("I would like to enquire about the Year 7 curriculum.");

    // Field 7: GDPR Consent checkbox
    const f7 = filler.nextField();
    filler.fillFieldByVoice("yes I agree");
  });

  it("user can go back and edit a previous field", () => {
    const forms = filler.detectForms();
    filler.startFilling(forms[0].element);
    filler.fillCurrentField("Wrong Name");
    filler.nextField();
    filler.fillCurrentField(FAKE_PERSON.email);

    // Go back to field 0 and fix it
    const backField = filler.goToField(0);
    expect(backField?.label).toContain("Full Name");
    filler.fillCurrentField("Sarah Johnson");
    expect(
      (document.getElementById("full_name") as HTMLInputElement).value,
    ).toBe("Sarah Johnson");
  });

  it("provides a summary for user review before submit", () => {
    const forms = filler.detectForms();
    filler.startFilling(forms[0].element);

    filler.fillCurrentField(FAKE_PERSON.name);
    filler.nextField();
    filler.fillCurrentField(FAKE_PERSON.email);
    filler.nextField();
    filler.fillCurrentField(FAKE_PERSON.phone);
    filler.nextField();
    filler.fillFieldByVoice("teacher");
    filler.nextField();
    filler.fillCurrentField(FAKE_PERSON.subject);
    filler.nextField();
    filler.fillCurrentField(FAKE_PERSON.message);
    filler.nextField();
    filler.fillFieldByVoice("yes");

    const summary = filler.getSummary();
    expect(summary.length).toBeGreaterThanOrEqual(6);
    expect(summary[0].label).toContain("Full Name");
    expect(summary[0].value).toBe("Sarah Johnson");
    expect(summary[1].value).toBe("s.johnson@example-school.sch.uk");

    // Empty check: all fields should be filled
    const empties = summary.filter((s) => s.value === "(empty)");
    expect(empties.length).toBe(0);
  });

  it("warns user about empty fields before submit", () => {
    const forms = filler.detectForms();
    filler.startFilling(forms[0].element);

    // Only fill name, skip everything else
    filler.fillCurrentField(FAKE_PERSON.name);

    const summary = filler.getSummary();
    const empties = summary.filter((s) => s.value === "(empty)");
    expect(empties.length).toBeGreaterThan(0);
  });
});

describe("Guardrail: Submit Requires Visual Confirmation", () => {
  let filler: FormFiller;

  beforeEach(() => {
    document.body.innerHTML = SCHOOL_CONTACT_FORM;
    filler = new FormFiller();
  });

  it("submitForm() returns a Promise (not a boolean)", () => {
    const forms = filler.detectForms();
    filler.startFilling(forms[0].element);
    filler.fillCurrentField(FAKE_PERSON.name);

    const result = filler.submitForm();
    expect(result).toBeInstanceOf(Promise);
  });

  it("shows confirmation overlay in the DOM", async () => {
    const forms = filler.detectForms();
    filler.startFilling(forms[0].element);
    filler.fillCurrentField(FAKE_PERSON.name);

    // Start the submit — don't await, just trigger the overlay
    const submitPromise = filler.submitForm();

    // Overlay should now be in the DOM
    const overlay = document.getElementById("ed-submit-confirm");
    expect(overlay).not.toBeNull();
    expect(overlay!.textContent).toContain("Review before submitting");
    expect(overlay!.textContent).toContain("Confirm & Submit");
    expect(overlay!.textContent).toContain("Cancel");
    expect(overlay!.textContent).toContain("You are in control");

    // Clean up by clicking cancel
    const cancelBtn = overlay!.querySelector("button") as HTMLButtonElement;
    cancelBtn.click();

    const result = await submitPromise;
    expect(result).toBe(false);
  });

  it("cancel button prevents submission", async () => {
    const forms = filler.detectForms();
    filler.startFilling(forms[0].element);
    filler.fillCurrentField(FAKE_PERSON.name);

    const submitPromise = filler.submitForm();
    const overlay = document.getElementById("ed-submit-confirm")!;
    const buttons = overlay.querySelectorAll("button");
    const cancelBtn = Array.from(buttons).find(
      (b) => b.textContent === "Cancel",
    )!;

    let formSubmitted = false;
    const form = document.getElementById("contact-form") as HTMLFormElement;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      formSubmitted = true;
    });

    cancelBtn.click();
    const result = await submitPromise;

    expect(result).toBe(false);
    expect(formSubmitted).toBe(false);
    // Overlay should be removed
    expect(document.getElementById("ed-submit-confirm")).toBeNull();
  });

  it("confirm button dispatches submit event on the form", async () => {
    const forms = filler.detectForms();
    filler.startFilling(forms[0].element);
    filler.fillCurrentField(FAKE_PERSON.name);

    let submitEventFired = false;
    const form = document.getElementById("contact-form") as HTMLFormElement;
    form.addEventListener("submit", (e) => {
      e.preventDefault(); // Prevent jsdom navigation error
      submitEventFired = true;
    });

    const submitPromise = filler.submitForm();
    const overlay = document.getElementById("ed-submit-confirm")!;
    const buttons = overlay.querySelectorAll("button");
    const confirmBtn = Array.from(buttons).find(
      (b) => b.textContent === "Confirm & Submit",
    )!;

    confirmBtn.click();
    await submitPromise;

    // The submit event was dispatched (preventDefault stops actual nav in jsdom)
    expect(submitEventFired).toBe(true);
    // Overlay cleaned up
    expect(document.getElementById("ed-submit-confirm")).toBeNull();
  });

  it("summary in overlay shows all field values", async () => {
    const forms = filler.detectForms();
    filler.startFilling(forms[0].element);
    filler.fillCurrentField(FAKE_PERSON.name);
    filler.nextField();
    filler.fillCurrentField(FAKE_PERSON.email);

    filler.submitForm();
    const overlay = document.getElementById("ed-submit-confirm")!;
    const text = overlay.textContent!;

    expect(text).toContain("Sarah Johnson");
    expect(text).toContain("s.johnson@example-school.sch.uk");
    // Unfilled fields should show warning
    expect(text).toContain("empty");

    // Clean up
    const cancelBtn = overlay.querySelector("button") as HTMLButtonElement;
    cancelBtn.click();
  });
});

describe("Guardrail: Cancel Stops Everything", () => {
  let filler: FormFiller;

  beforeEach(() => {
    document.body.innerHTML = SCHOOL_CONTACT_FORM;
    filler = new FormFiller();
  });

  it("stop() clears the session immediately", () => {
    const forms = filler.detectForms();
    filler.startFilling(forms[0].element);
    expect(filler.isActive).toBe(true);

    filler.stop();
    expect(filler.isActive).toBe(false);
    expect(filler.getCurrentField()).toBeNull();
    expect(filler.getSummary()).toEqual([]);
  });

  it("stop() mid-fill leaves no session data", () => {
    const forms = filler.detectForms();
    filler.startFilling(forms[0].element);
    filler.fillCurrentField(FAKE_PERSON.name);
    filler.nextField();
    filler.fillCurrentField(FAKE_PERSON.email);

    filler.stop();

    // No session data retained
    expect(filler.isActive).toBe(false);
    expect(filler.getSummary()).toEqual([]);
    expect(filler.getProgress()).toEqual({
      current: 0,
      total: 0,
      percentage: 0,
    });
  });
});

describe("Guardrail: Data Never Persisted", () => {
  it("values exist only in DOM and session memory, nothing stored", () => {
    document.body.innerHTML = SCHOOL_CONTACT_FORM;
    const filler = new FormFiller();
    const forms = filler.detectForms();
    filler.startFilling(forms[0].element);
    filler.fillCurrentField(FAKE_PERSON.name);

    // Value is in the DOM
    expect(
      (document.getElementById("full_name") as HTMLInputElement).value,
    ).toBe("Sarah Johnson");

    // Stop the session
    filler.stop();

    // DOM still has the value (user can see what was filled)
    // but the FormFiller has no memory of it
    expect(filler.getSummary()).toEqual([]);

    // FormFiller never writes to storage — verify no cookies set
    expect(document.cookie).toBe("");
    // Verify window.localStorage was not used (may not exist in jsdom)
    if (typeof window.localStorage?.getItem === "function") {
      expect(window.localStorage.getItem("ed-form-data")).toBeNull();
    }
  });
});
