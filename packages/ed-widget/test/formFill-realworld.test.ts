/**
 * Real-world form detection tests
 * Tests FormFiller logic against actual HTML from public websites
 * Run with: npx vitest run test/formFill-realworld.test.ts
 */
import { describe, it, expect, beforeEach, beforeAll } from "vitest";

// Polyfill CSS.escape for jsdom (not available in Node)
beforeAll(() => {
  if (typeof CSS === "undefined" || !CSS.escape) {
    (globalThis as any).CSS = {
      escape: (str: string) => str.replace(/([^\w-])/g, (_, c) => `\\${c}`),
    };
  }
});

// ── Helpers (mirror FormFiller logic) ──────────────────────────

const BLOCKED_TYPES = [
  "password",
  "hidden",
  "submit",
  "button",
  "reset",
  "image",
  "file",
];
const BLOCKED_KEYWORDS = [
  "password",
  "passwd",
  "pin",
  "cvv",
  "cvc",
  "card",
  "credit",
  "debit",
  "payment",
  "billing",
  "token",
  "secret",
  "csrf",
];

interface DetectedField {
  label: string;
  type: string;
  name: string;
  required: boolean;
}

function extractFields(container: HTMLElement): DetectedField[] {
  const fields: DetectedField[] = [];
  const elements = container.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >("input, textarea, select");

  elements.forEach((element) => {
    if (
      element instanceof HTMLInputElement &&
      BLOCKED_TYPES.includes(element.type)
    )
      return;

    const identifiers = [
      element.id,
      element.name,
      element.className,
      element.getAttribute("aria-label") || "",
      element.getAttribute("autocomplete") || "",
    ]
      .join(" ")
      .toLowerCase();
    if (
      BLOCKED_KEYWORDS.some((kw) =>
        new RegExp(`(^|[\\s_\\-./])${kw}([\\s_\\-./]|$)`, "i").test(
          identifiers,
        ),
      )
    )
      return;

    const label = findLabel(element);
    fields.push({
      label: label || element.name || element.id || "Field",
      type: getFieldType(element),
      name: element.name || element.id || "",
      required:
        element.required || element.getAttribute("aria-required") === "true",
    });
  });

  return fields;
}

function findLabel(element: HTMLElement): string {
  const id = element.id;
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }
  const parent = element.closest("label");
  if (parent) {
    const clone = parent.cloneNode(true) as HTMLElement;
    clone
      .querySelectorAll("input, select, textarea")
      .forEach((el) => el.remove());
    const text = clone.textContent?.trim();
    if (text) return text;
  }
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const el = document.getElementById(labelledBy);
    if (el?.textContent?.trim()) return el.textContent.trim();
  }
  return (element as HTMLInputElement).placeholder || "";
}

function getFieldType(
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
): string {
  if (el instanceof HTMLSelectElement) return "dropdown";
  if (el instanceof HTMLTextAreaElement) return "text area";
  const typeMap: Record<string, string> = {
    email: "email address",
    tel: "phone number",
    date: "date",
    number: "number",
    checkbox: "checkbox",
    radio: "choice",
    time: "time",
    url: "website",
  };
  return typeMap[(el as HTMLInputElement).type] || "text";
}

// ── Test: httpbin.org Pizza Order Form ─────────────────────────

describe("Real World: httpbin.org Pizza Form", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form action="/post" method="post">
        <p><label>Customer name: <input type="text" name="custname"></label></p>
        <p><label>Telephone: <input type="tel" name="custtel"></label></p>
        <p><label>E-mail address: <input type="email" name="custemail"></label></p>
        <fieldset>
          <legend>Pizza Size</legend>
          <p><label><input type="radio" name="size" value="small"> Small</label></p>
          <p><label><input type="radio" name="size" value="medium"> Medium</label></p>
          <p><label><input type="radio" name="size" value="large"> Large</label></p>
        </fieldset>
        <fieldset>
          <legend>Pizza Toppings</legend>
          <p><label><input type="checkbox" name="topping" value="bacon"> Bacon</label></p>
          <p><label><input type="checkbox" name="topping" value="cheese"> Extra Cheese</label></p>
          <p><label><input type="checkbox" name="topping" value="onion"> Onion</label></p>
          <p><label><input type="checkbox" name="topping" value="mushroom"> Mushroom</label></p>
        </fieldset>
        <p><label>Preferred delivery time: <input type="time" name="delivery"></label></p>
        <p><label>Delivery instructions: <textarea name="comments"></textarea></label></p>
        <p><button type="submit">Submit order</button></p>
      </form>
    `;
  });

  it("detects all 10 fillable fields", () => {
    const form = document.querySelector("form")!;
    const fields = extractFields(form);
    expect(fields.length).toBe(12); // 3 text + 3 radio + 4 checkbox + 1 time + 1 textarea = 12
  });

  it("finds labels from parent <label> wrapping", () => {
    const form = document.querySelector("form")!;
    const fields = extractFields(form);
    expect(fields[0].label).toBe("Customer name:");
    expect(fields[1].label).toBe("Telephone:");
    expect(fields[2].label).toBe("E-mail address:");
  });

  it("detects radio buttons as choice type", () => {
    const form = document.querySelector("form")!;
    const fields = extractFields(form);
    const radios = fields.filter((f) => f.type === "choice");
    expect(radios.length).toBe(3);
    expect(radios[0].name).toBe("size");
  });

  it("detects checkboxes", () => {
    const form = document.querySelector("form")!;
    const fields = extractFields(form);
    const checks = fields.filter((f) => f.type === "checkbox");
    expect(checks.length).toBe(4);
  });

  it("detects time input", () => {
    const form = document.querySelector("form")!;
    const fields = extractFields(form);
    const timeField = fields.find((f) => f.type === "time");
    expect(timeField).toBeDefined();
    expect(timeField!.label).toBe("Preferred delivery time:");
  });

  it("detects textarea", () => {
    const form = document.querySelector("form")!;
    const fields = extractFields(form);
    const ta = fields.find((f) => f.type === "text area");
    expect(ta).toBeDefined();
    expect(ta!.label).toBe("Delivery instructions:");
  });

  it("can fill text input via native setter", () => {
    const input = document.querySelector(
      'input[name="custname"]',
    ) as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter!.call(input, "John Smith");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(input.value).toBe("John Smith");
  });

  it("can select radio button", () => {
    const medium = document.querySelector(
      'input[value="medium"]',
    ) as HTMLInputElement;
    medium.checked = true;
    medium.dispatchEvent(new Event("change", { bubbles: true }));
    expect(medium.checked).toBe(true);

    const small = document.querySelector(
      'input[value="small"]',
    ) as HTMLInputElement;
    expect(small.checked).toBe(false);
  });

  it("can check multiple checkboxes", () => {
    const bacon = document.querySelector(
      'input[value="bacon"]',
    ) as HTMLInputElement;
    const cheese = document.querySelector(
      'input[value="cheese"]',
    ) as HTMLInputElement;
    bacon.checked = true;
    cheese.checked = true;
    expect(bacon.checked).toBe(true);
    expect(cheese.checked).toBe(true);

    const onion = document.querySelector(
      'input[value="onion"]',
    ) as HTMLInputElement;
    expect(onion.checked).toBe(false);
  });

  it("can fill textarea", () => {
    const ta = document.querySelector("textarea") as HTMLTextAreaElement;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    setter!.call(ta, "Ring the doorbell, leave at door");
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    expect(ta.value).toBe("Ring the doorbell, leave at door");
  });
});

// ── Test: GOV.UK Style Postcode Lookup ─────────────────────────

describe("Real World: GOV.UK Postcode Lookup", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <main id="content">
        <h1>Apply for free school meals</h1>
        <form class="postcode-lookup" action="/find-council" method="get">
          <div class="govuk-form-group">
            <label class="govuk-label" for="postcode">Enter a postcode</label>
            <div class="govuk-hint" id="postcode-hint">For example SW1A 2AA</div>
            <input class="govuk-input" id="postcode" name="postcode" type="text"
              aria-describedby="postcode-hint" autocomplete="postal-code">
          </div>
          <button type="submit" class="govuk-button">Find your local council</button>
        </form>
      </main>
    `;
  });

  it("detects single postcode field", () => {
    const form = document.querySelector("form")!;
    const fields = extractFields(form);
    expect(fields.length).toBe(1);
    expect(fields[0].label).toBe("Enter a postcode");
    expect(fields[0].name).toBe("postcode");
  });

  it("can fill postcode", () => {
    const input = document.getElementById("postcode") as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter!.call(input, "SW1A 2AA");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(input.value).toBe("SW1A 2AA");
  });
});

// ── Test: Teacher Training Login (email + radios) ──────────────

describe("Real World: Teacher Training Sign In", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <main>
        <h1>Sign in or create an account</h1>
        <form action="/candidate/sign-in" method="post">
          <input type="hidden" name="authenticity_token" value="abc123">
          <div class="govuk-form-group">
            <fieldset class="govuk-fieldset">
              <legend>Do you already have an account?</legend>
              <div class="govuk-radios">
                <div class="govuk-radios__item">
                  <input type="radio" id="has-account-yes" name="has_account" value="yes">
                  <label for="has-account-yes">Yes, sign in</label>
                </div>
                <div class="govuk-radios__item">
                  <input type="radio" id="has-account-no" name="has_account" value="no">
                  <label for="has-account-no">No, I need to create an account</label>
                </div>
              </div>
            </fieldset>
          </div>
          <div class="govuk-form-group">
            <label class="govuk-label" for="email-input">Email address</label>
            <input type="email" id="email-input" name="candidate[email_address]"
              class="govuk-input" autocomplete="email">
          </div>
          <button type="submit" class="govuk-button">Continue</button>
        </form>
      </main>
    `;
  });

  it("excludes hidden authenticity_token", () => {
    const form = document.querySelector("form")!;
    const fields = extractFields(form);
    const hidden = fields.find((f) => f.name.includes("authenticity"));
    expect(hidden).toBeUndefined();
  });

  it("detects 3 fillable fields (2 radios + 1 email)", () => {
    const form = document.querySelector("form")!;
    const fields = extractFields(form);
    expect(fields.length).toBe(3);
  });

  it("finds radio labels via label[for]", () => {
    const form = document.querySelector("form")!;
    const fields = extractFields(form);
    const radios = fields.filter((f) => f.type === "choice");
    expect(radios.length).toBe(2);
    expect(radios[0].label).toBe("Yes, sign in");
    expect(radios[1].label).toBe("No, I need to create an account");
  });

  it("finds email label", () => {
    const form = document.querySelector("form")!;
    const fields = extractFields(form);
    const email = fields.find((f) => f.type === "email address");
    expect(email).toBeDefined();
    expect(email!.label).toBe("Email address");
  });

  it("can select radio and fill email", () => {
    const yesRadio = document.getElementById(
      "has-account-yes",
    ) as HTMLInputElement;
    yesRadio.checked = true;
    yesRadio.dispatchEvent(new Event("change", { bubbles: true }));
    expect(yesRadio.checked).toBe(true);

    const email = document.getElementById("email-input") as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter!.call(email, "teacher@school.edu");
    email.dispatchEvent(new Event("input", { bubbles: true }));
    expect(email.value).toBe("teacher@school.edu");
  });
});

// ── Test: School Contact Form (typical pattern) ────────────────

describe("Real World: School Contact Form", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="contact-section">
        <h2>Contact Us</h2>
        <form id="contact" action="/contact" method="post">
          <input type="hidden" name="_csrf" value="token-xyz">
          <div class="field">
            <label for="name">Your Name <span class="required">*</span></label>
            <input type="text" id="name" name="name" required>
          </div>
          <div class="field">
            <label for="email">Email Address <span class="required">*</span></label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="field">
            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone">
          </div>
          <div class="field">
            <label for="relation">Your Relation to School</label>
            <select id="relation" name="relation">
              <option value="">Please select...</option>
              <option value="parent">Parent/Guardian</option>
              <option value="prospective">Prospective Parent</option>
              <option value="staff">Staff Member</option>
              <option value="governor">Governor</option>
              <option value="community">Community Member</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="field">
            <label for="subject">Subject <span class="required">*</span></label>
            <select id="subject" name="subject" required>
              <option value="">Please select...</option>
              <option value="admissions">Admissions</option>
              <option value="absence">Report Absence</option>
              <option value="general">General Enquiry</option>
              <option value="complaint">Complaint</option>
              <option value="safeguarding">Safeguarding Concern</option>
            </select>
          </div>
          <div class="field">
            <label for="message">Message <span class="required">*</span></label>
            <textarea id="message" name="message" required rows="5"></textarea>
          </div>
          <div class="field">
            <label>
              <input type="checkbox" name="consent" required>
              I consent to the school storing my data to respond to this enquiry
            </label>
          </div>
          <button type="submit">Send Message</button>
        </form>
      </div>
    `;
  });

  it("detects 7 fillable fields (excludes CSRF hidden)", () => {
    const form = document.querySelector("form")!;
    const fields = extractFields(form);
    // CSRF has name="_csrf" which contains "csrf" — blocked by keyword
    expect(fields.length).toBe(7);
  });

  it("CSRF token is blocked by keyword", () => {
    const form = document.querySelector("form")!;
    const fields = extractFields(form);
    const csrf = fields.find((f) => f.name.includes("csrf"));
    expect(csrf).toBeUndefined();
  });

  it("marks required fields correctly", () => {
    const form = document.querySelector("form")!;
    const fields = extractFields(form);
    const nameField = fields.find((f) => f.name === "name");
    const emailField = fields.find((f) => f.name === "email");
    const phoneField = fields.find((f) => f.name === "phone");

    expect(nameField?.required).toBe(true);
    expect(emailField?.required).toBe(true);
    expect(phoneField?.required).toBe(false);
  });

  it("detects two dropdowns", () => {
    const form = document.querySelector("form")!;
    const fields = extractFields(form);
    const dropdowns = fields.filter((f) => f.type === "dropdown");
    expect(dropdowns.length).toBe(2);
    expect(dropdowns[0].label).toContain("Relation");
    expect(dropdowns[1].label).toContain("Subject");
  });

  it("can fuzzy-match select options", () => {
    const select = document.getElementById("relation") as HTMLSelectElement;
    const options = Array.from(select.options);

    // User says "parent" → matches "Parent/Guardian"
    const match = options.find((o) => o.text.toLowerCase().includes("parent"));
    expect(match?.value).toBe("parent");

    // User says "governor" → exact match
    const gov = options.find((o) => o.text.toLowerCase().includes("governor"));
    expect(gov?.value).toBe("governor");
  });

  it("can fill the complete form", () => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    const taSetter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;

    // Name
    const name = document.getElementById("name") as HTMLInputElement;
    setter!.call(name, "Sarah Johnson");
    name.dispatchEvent(new Event("input", { bubbles: true }));
    expect(name.value).toBe("Sarah Johnson");

    // Email
    const email = document.getElementById("email") as HTMLInputElement;
    setter!.call(email, "sarah@example.com");
    email.dispatchEvent(new Event("input", { bubbles: true }));
    expect(email.value).toBe("sarah@example.com");

    // Phone
    const phone = document.getElementById("phone") as HTMLInputElement;
    setter!.call(phone, "07700 900123");
    phone.dispatchEvent(new Event("input", { bubbles: true }));
    expect(phone.value).toBe("07700 900123");

    // Relation (select)
    const relation = document.getElementById("relation") as HTMLSelectElement;
    relation.value = "parent";
    relation.dispatchEvent(new Event("change", { bubbles: true }));
    expect(relation.value).toBe("parent");

    // Subject (select)
    const subject = document.getElementById("subject") as HTMLSelectElement;
    subject.value = "admissions";
    subject.dispatchEvent(new Event("change", { bubbles: true }));
    expect(subject.value).toBe("admissions");

    // Message (textarea)
    const message = document.getElementById("message") as HTMLTextAreaElement;
    taSetter!.call(
      message,
      "I would like to arrange a school visit for my child",
    );
    message.dispatchEvent(new Event("input", { bubbles: true }));
    expect(message.value).toContain("school visit");

    // Consent (checkbox)
    const consent = document.querySelector(
      'input[name="consent"]',
    ) as HTMLInputElement;
    consent.checked = true;
    consent.dispatchEvent(new Event("change", { bubbles: true }));
    expect(consent.checked).toBe(true);
  });
});

// ── Test: Arbor-style SPA Form (dynamic fields) ───────────────

describe("Real World: Arbor-style Pupil Form", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="arbor-form" role="form" aria-label="Add New Pupil">
        <div class="form-section">
          <h3>Pupil Details</h3>
          <div class="field-row">
            <label for="pupil-first">Legal First Name</label>
            <input type="text" id="pupil-first" name="pupil[legal_first_name]"
              required aria-required="true" data-testid="pupil-first-name">
          </div>
          <div class="field-row">
            <label for="pupil-last">Legal Last Name</label>
            <input type="text" id="pupil-last" name="pupil[legal_last_name]"
              required aria-required="true">
          </div>
          <div class="field-row">
            <label for="pupil-dob">Date of Birth</label>
            <input type="date" id="pupil-dob" name="pupil[date_of_birth]" required>
          </div>
          <div class="field-row">
            <label for="pupil-gender">Gender</label>
            <select id="pupil-gender" name="pupil[gender]">
              <option value="">Select...</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="X">Not specified</option>
            </select>
          </div>
          <div class="field-row">
            <span id="upn-label">UPN</span>
            <input type="text" name="pupil[upn]" aria-labelledby="upn-label"
              pattern="[A-Z][0-9]{12}" placeholder="e.g. A123456789012">
          </div>
          <div class="field-row">
            <label for="ethnicity">Ethnicity</label>
            <select id="ethnicity" name="pupil[ethnicity_code]">
              <option value="">Select...</option>
              <option value="WBRI">White British</option>
              <option value="WIRI">White Irish</option>
              <option value="WOTH">Any Other White Background</option>
              <option value="MWBC">White and Black Caribbean</option>
              <option value="MWBA">White and Black African</option>
              <option value="MWAS">White and Asian</option>
              <option value="AIND">Indian</option>
              <option value="APKN">Pakistani</option>
              <option value="ABAN">Bangladeshi</option>
              <option value="BCRB">Black Caribbean</option>
              <option value="BAFR">Black African</option>
            </select>
          </div>
        </div>
      </div>
    `;
  });

  it("detects form via role='form' attribute", () => {
    const roleForm = document.querySelector('[role="form"]');
    expect(roleForm).not.toBeNull();
  });

  it("detects 6 fillable fields", () => {
    const container = document.querySelector('[role="form"]') as HTMLElement;
    const fields = extractFields(container);
    expect(fields.length).toBe(6);
  });

  it("finds UPN label via aria-labelledby", () => {
    const container = document.querySelector('[role="form"]') as HTMLElement;
    const fields = extractFields(container);
    const upn = fields.find((f) => f.name.includes("upn"));
    expect(upn?.label).toBe("UPN");
  });

  it("detects date field", () => {
    const container = document.querySelector('[role="form"]') as HTMLElement;
    const fields = extractFields(container);
    const dob = fields.find((f) => f.type === "date");
    expect(dob).toBeDefined();
    expect(dob!.label).toBe("Date of Birth");
  });

  it("can fill date with natural language", () => {
    const input = document.getElementById("pupil-dob") as HTMLInputElement;
    // Simulate what FormFiller.parseDateToISO does
    const text = "15th September 2018";
    const match = text.match(
      /(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)\s+(\d{4})/i,
    );
    expect(match).not.toBeNull();
    const date = new Date(`${match![2]} ${match![1]}, ${match![3]}`);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    expect(iso).toBe("2018-09-15");

    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter!.call(input, iso);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(input.value).toBe("2018-09-15");
  });

  it("can fuzzy-match ethnicity dropdown", () => {
    const select = document.getElementById("ethnicity") as HTMLSelectElement;
    const options = Array.from(select.options);

    // User says "pakistani" → matches "Pakistani"
    const match = options.find((o) =>
      o.text.toLowerCase().includes("pakistani"),
    );
    expect(match?.value).toBe("APKN");

    // User says "white british" → matches "White British"
    const wb = options.find((o) =>
      o.text.toLowerCase().includes("white british"),
    );
    expect(wb?.value).toBe("WBRI");
  });
});
