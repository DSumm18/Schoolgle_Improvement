/**
 * FormFiller - Enhanced AI-assisted form filling for Ed widget
 *
 * Features:
 * - Detects all forms on page (including non-<form> containers)
 * - Smooth animated highlighting with field-by-field guidance
 * - Framework-compatible event dispatch (React, Vue, Angular)
 * - Progress overlay with field preview
 * - Conversational flow: Ed asks, user answers, Ed fills
 * - Edit/undo support
 * - Submit confirmation with summary
 * - GDPR: never fills password/payment fields
 */

import type { FormField } from "../types";

// ── Types ────────────────────────────────────────────────────────

export interface FormSession {
  id: string;
  form: HTMLFormElement | HTMLElement;
  fields: FormField[];
  currentIndex: number;
  values: Map<number, string>; // index → filled value
  status: "idle" | "detecting" | "filling" | "reviewing" | "complete";
  startedAt: Date;
}

export interface DetectedForm {
  element: HTMLFormElement | HTMLElement;
  fields: FormField[];
  title: string;
  fieldCount: number;
}

// Fields we NEVER touch
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

// ── Main Class ───────────────────────────────────────────────────

export class FormFiller {
  private session: FormSession | null = null;
  private highlightEl: HTMLElement | null = null;

  // ── Detection ────────────────────────────────────────────────

  /**
   * Detect all fillable forms on the page
   */
  public detectForms(): DetectedForm[] {
    const results: DetectedForm[] = [];

    // 1. Explicit <form> elements
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      const fields = this.extractFields(form);
      if (fields.length > 0) {
        results.push({
          element: form,
          fields,
          title: this.inferFormTitle(form),
          fieldCount: fields.length,
        });
      }
    });

    // 2. Containers with role="form" (accessibility-marked)
    const roleforms = document.querySelectorAll('[role="form"]');
    roleforms.forEach((el) => {
      if (el.tagName === "FORM") return; // Already handled
      const fields = this.extractFields(el as HTMLElement);
      if (fields.length > 0) {
        results.push({
          element: el as HTMLElement,
          fields,
          title: this.inferFormTitle(el as HTMLElement),
          fieldCount: fields.length,
        });
      }
    });

    // 3. Fieldsets or divs with multiple inputs (catch containerless forms)
    if (results.length === 0) {
      const allInputs = document.querySelectorAll(
        "input:not([type=hidden]):not([type=submit]), textarea, select",
      );
      if (allInputs.length > 0) {
        // Group by closest common ancestor
        const container = this.findCommonContainer(Array.from(allInputs));
        if (container) {
          const fields = this.extractFields(container);
          if (fields.length > 0) {
            results.push({
              element: container,
              fields,
              title: this.inferFormTitle(container),
              fieldCount: fields.length,
            });
          }
        }
      }
    }

    return results;
  }

  // ── Session Management ───────────────────────────────────────

  /**
   * Start filling a form — returns the first field to ask about
   */
  public startFilling(form: HTMLFormElement | HTMLElement): FormField | null {
    const fields =
      form instanceof HTMLFormElement
        ? this.extractFields(form)
        : this.extractFields(form);

    if (fields.length === 0) return null;

    this.session = {
      id: crypto.randomUUID(),
      form,
      fields,
      currentIndex: 0,
      values: new Map(),
      status: "filling",
      startedAt: new Date(),
    };

    this.injectStyles();
    this.showProgress();
    this.highlightCurrentField();

    return this.getCurrentField();
  }

  /**
   * Get current field being asked about
   */
  public getCurrentField(): FormField | null {
    if (
      !this.session ||
      this.session.currentIndex >= this.session.fields.length
    ) {
      return null;
    }
    return this.session.fields[this.session.currentIndex];
  }

  /**
   * Fill current field with the user's answer
   */
  public fillCurrentField(value: string): boolean {
    const field = this.getCurrentField();
    if (!field || !this.session) return false;

    this.session.values.set(this.session.currentIndex, value);
    this.fillFieldAnimated(field, value);
    return true;
  }

  /**
   * Fill current field via voice (with fuzzy matching for checkboxes, selects)
   */
  public fillFieldByVoice(text: string): boolean {
    const field = this.getCurrentField();
    if (!field || !this.session) return false;

    const cleanText = text.trim();
    let value = cleanText;

    // Checkbox: fuzzy yes/no
    if (field.type === "checkbox") {
      const yes = [
        "yes",
        "yeah",
        "yep",
        "true",
        "check",
        "agree",
        "correct",
        "tick",
      ];
      const no = [
        "no",
        "nah",
        "nope",
        "false",
        "uncheck",
        "disagree",
        "untick",
      ];
      if (yes.some((w) => cleanText.toLowerCase().includes(w))) value = "true";
      else if (no.some((w) => cleanText.toLowerCase().includes(w)))
        value = "false";
      else return false; // Ambiguous — ask again
    }

    // Select/dropdown: fuzzy option matching
    if (
      field.type === "dropdown" &&
      field.element instanceof HTMLSelectElement
    ) {
      const options = Array.from(field.element.options);
      const match = options.find(
        (opt) =>
          opt.text.toLowerCase().includes(cleanText.toLowerCase()) ||
          opt.value.toLowerCase() === cleanText.toLowerCase(),
      );
      if (match) value = match.value;
    }

    this.session.values.set(this.session.currentIndex, value);
    this.fillFieldAnimated(field, value);
    return true;
  }

  /**
   * Move to next field — returns it or null if done
   */
  public nextField(): FormField | null {
    if (!this.session) return null;
    this.session.currentIndex++;

    if (this.session.currentIndex >= this.session.fields.length) {
      this.session.status = "reviewing";
      this.clearHighlight();
      this.updateProgress();
      return null;
    }

    this.highlightCurrentField();
    this.updateProgress();
    return this.getCurrentField();
  }

  /**
   * Go back to a specific field (for editing)
   */
  public goToField(index: number): FormField | null {
    if (!this.session || index < 0 || index >= this.session.fields.length)
      return null;
    this.session.currentIndex = index;
    this.session.status = "filling";
    this.highlightCurrentField();
    this.updateProgress();
    return this.getCurrentField();
  }

  /**
   * Move to previous field
   */
  public previousField(): FormField | null {
    if (!this.session || this.session.currentIndex <= 0) return null;
    this.session.currentIndex--;
    this.highlightCurrentField();
    this.updateProgress();
    return this.getCurrentField();
  }

  /**
   * Get a summary of all filled fields (for review before submit)
   */
  public getSummary(): Array<{ label: string; value: string; index: number }> {
    if (!this.session) return [];
    return this.session.fields.map((field, i) => ({
      label: field.label,
      value: this.session!.values.get(i) || "(empty)",
      index: i,
    }));
  }

  /**
   * Get progress
   */
  public getProgress(): { current: number; total: number; percentage: number } {
    if (!this.session) return { current: 0, total: 0, percentage: 0 };
    const total = this.session.fields.length;
    const filled = this.session.values.size;
    return {
      current: filled,
      total,
      percentage: total > 0 ? Math.round((filled / total) * 100) : 0,
    };
  }

  /**
   * Submit the form — requires visual confirmation from user.
   * Ed NEVER submits silently. A confirmation overlay appears and
   * the user must click "Confirm & Submit" or "Cancel".
   * Returns a Promise that resolves true if user confirms.
   */
  public submitForm(): Promise<boolean> {
    if (!this.session) return Promise.resolve(false);

    const form = this.session.form;
    const summary = this.getSummary();

    return new Promise((resolve) => {
      // Build confirmation overlay
      const overlay = document.createElement("div");
      overlay.id = "ed-submit-confirm";
      overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 999999;
        background: rgba(0,0,0,0.5); display: flex;
        align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        animation: ed-field-pulse 0.3s ease-out;
      `;

      const card = document.createElement("div");
      card.style.cssText = `
        background: #fff; border-radius: 12px; padding: 24px;
        max-width: 420px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      `;

      const title = document.createElement("h3");
      title.textContent = "Review before submitting";
      title.style.cssText =
        "margin: 0 0 16px; color: #1a1a1a; font-size: 18px;";

      const list = document.createElement("ul");
      list.style.cssText = "list-style: none; padding: 0; margin: 0 0 20px;";
      for (const item of summary) {
        const li = document.createElement("li");
        li.style.cssText = `
          padding: 8px 0; border-bottom: 1px solid #eee;
          font-size: 14px; color: #333;
        `;
        const labelSpan = document.createElement("strong");
        labelSpan.textContent = item.label + ": ";
        li.appendChild(labelSpan);
        li.appendChild(
          document.createTextNode(
            item.value === "(empty)" ? "⚠️ empty" : item.value,
          ),
        );
        list.appendChild(li);
      }

      const warn = document.createElement("p");
      warn.style.cssText = "font-size: 12px; color: #666; margin: 0 0 16px;";
      warn.textContent =
        "Ed will submit this form on your behalf. You are in control — cancel if anything looks wrong.";

      const btnRow = document.createElement("div");
      btnRow.style.cssText =
        "display: flex; gap: 12px; justify-content: flex-end;";

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.style.cssText = `
        padding: 10px 20px; border-radius: 8px; border: 1px solid #ddd;
        background: #fff; color: #333; cursor: pointer; font-size: 14px;
      `;

      const confirmBtn = document.createElement("button");
      confirmBtn.textContent = "Confirm & Submit";
      confirmBtn.style.cssText = `
        padding: 10px 20px; border-radius: 8px; border: none;
        background: #0ea5e9; color: #fff; cursor: pointer; font-size: 14px;
        font-weight: 600;
      `;

      const cleanup = () => overlay.remove();

      cancelBtn.addEventListener("click", () => {
        cleanup();
        resolve(false);
      });

      confirmBtn.addEventListener("click", () => {
        cleanup();
        this.session!.status = "complete";
        this.cleanup();

        if (form instanceof HTMLFormElement) {
          const submitEvent = new Event("submit", {
            bubbles: true,
            cancelable: true,
          });
          const shouldSubmit = form.dispatchEvent(submitEvent);
          if (shouldSubmit) {
            form.submit();
          }
          resolve(shouldSubmit);
        } else {
          const submitBtn = form.querySelector<HTMLButtonElement>(
            'button[type="submit"], input[type="submit"], button:not([type])',
          );
          if (submitBtn) {
            submitBtn.click();
            resolve(true);
          } else {
            resolve(false);
          }
        }
      });

      // Escape key = cancel
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          cleanup();
          document.removeEventListener("keydown", onKey);
          resolve(false);
        }
      };
      document.addEventListener("keydown", onKey);

      btnRow.appendChild(cancelBtn);
      btnRow.appendChild(confirmBtn);
      card.appendChild(title);
      card.appendChild(list);
      card.appendChild(warn);
      card.appendChild(btnRow);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
    });
  }

  /**
   * Cancel and clean up
   */
  public stop(): void {
    if (this.session) {
      this.session.status = "idle";
    }
    this.session = null;
    this.cleanup();
  }

  /**
   * Is a form filling session active?
   */
  public get isActive(): boolean {
    return (
      this.session?.status === "filling" || this.session?.status === "reviewing"
    );
  }

  // ── Field Extraction ─────────────────────────────────────────

  private extractFields(container: HTMLElement): FormField[] {
    const fields: FormField[] = [];
    const elements = container.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >("input, textarea, select");

    elements.forEach((element) => {
      // Skip blocked types
      if (
        element instanceof HTMLInputElement &&
        BLOCKED_TYPES.includes(element.type)
      ) {
        return;
      }

      // Skip invisible
      if (!this.isVisible(element)) return;

      // Skip blocked keywords (password, payment, etc.)
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

      const label = this.findLabel(element);
      fields.push({
        element,
        label: label || element.name || element.id || "Field",
        type: this.getFieldType(element),
        required:
          element.required || element.getAttribute("aria-required") === "true",
        placeholder: (element as HTMLInputElement).placeholder,
      });
    });

    return fields;
  }

  private findLabel(element: HTMLElement): string {
    const id = element.id;

    // 1. Explicit label[for]
    if (id) {
      const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (label?.textContent?.trim()) return label.textContent.trim();
    }

    // 2. Parent label
    const parentLabel = element.closest("label");
    if (parentLabel) {
      // Get text content excluding the input itself
      const clone = parentLabel.cloneNode(true) as HTMLElement;
      clone
        .querySelectorAll("input, select, textarea")
        .forEach((el) => el.remove());
      const text = clone.textContent?.trim();
      if (text) return text;
    }

    // 3. aria-labelledby
    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const labelEl = document.getElementById(labelledBy);
      if (labelEl?.textContent?.trim()) return labelEl.textContent.trim();
    }

    // 4. aria-label
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel;

    // 5. Previous sibling text (common pattern)
    const prevSibling = element.previousElementSibling;
    if (prevSibling?.tagName === "SPAN" || prevSibling?.tagName === "LABEL") {
      const text = prevSibling.textContent?.trim();
      if (text) return text;
    }

    // 6. Placeholder fallback
    return (element as HTMLInputElement).placeholder || "";
  }

  private getFieldType(
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  ): string {
    if (element instanceof HTMLSelectElement) return "dropdown";
    if (element instanceof HTMLTextAreaElement) return "text area";

    const type = (element as HTMLInputElement).type;
    const typeMap: Record<string, string> = {
      email: "email address",
      tel: "phone number",
      date: "date",
      "datetime-local": "date and time",
      number: "number",
      checkbox: "checkbox",
      radio: "choice",
      url: "website",
      color: "colour",
      range: "slider",
      time: "time",
    };
    return typeMap[type] || "text";
  }

  // ── Fill Logic (Framework-Compatible) ────────────────────────

  private fillFieldAnimated(field: FormField, value: string): void {
    const el = field.element;

    // Scroll into view smoothly
    el.scrollIntoView?.({ behavior: "smooth", block: "center" });

    // Focus
    el.focus();
    el.dispatchEvent(new Event("focus", { bubbles: true }));

    if (el instanceof HTMLSelectElement) {
      this.fillSelect(el, value);
    } else if (el instanceof HTMLInputElement && el.type === "checkbox") {
      this.fillCheckbox(el, value);
    } else if (el instanceof HTMLInputElement && el.type === "radio") {
      this.fillRadio(el, value);
    } else if (el instanceof HTMLInputElement && el.type === "date") {
      this.fillDate(el, value);
    } else {
      // Text / textarea / email / tel / etc.
      this.fillTextAnimated(
        el as HTMLInputElement | HTMLTextAreaElement,
        value,
      );
    }

    // Flash green on the field
    this.flashField(el, "success");
  }

  private fillTextAnimated(
    el: HTMLInputElement | HTMLTextAreaElement,
    value: string,
  ): void {
    // Use native input setter to trigger React/Vue/Angular change detection
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype,
      "value",
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, value);
    } else {
      el.value = value;
    }

    // Dispatch events in the correct order for all frameworks
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  private fillSelect(el: HTMLSelectElement, value: string): void {
    const options = Array.from(el.options);
    const match =
      options.find((o) => o.value.toLowerCase() === value.toLowerCase()) ||
      options.find((o) => o.text.toLowerCase().includes(value.toLowerCase()));

    if (match) {
      el.value = match.value;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  private fillCheckbox(el: HTMLInputElement, value: string): void {
    const shouldCheck = ["yes", "true", "1", "check", "tick"].includes(
      value.toLowerCase(),
    );
    if (el.checked !== shouldCheck) {
      el.checked = shouldCheck;
      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.dispatchEvent(new Event("click", { bubbles: true }));
    }
  }

  private fillRadio(el: HTMLInputElement, value: string): void {
    const name = el.name;
    const radios = document.querySelectorAll<HTMLInputElement>(
      `input[type="radio"][name="${CSS.escape(name)}"]`,
    );
    radios.forEach((radio) => {
      const radioLabel = this.findLabel(radio).toLowerCase();
      if (
        radio.value.toLowerCase() === value.toLowerCase() ||
        radioLabel.includes(value.toLowerCase())
      ) {
        radio.checked = true;
        radio.dispatchEvent(new Event("change", { bubbles: true }));
        radio.dispatchEvent(new Event("click", { bubbles: true }));
      }
    });
  }

  private fillDate(el: HTMLInputElement, value: string): void {
    const iso = this.parseDateToISO(value);
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    if (nativeSetter) {
      nativeSetter.call(el, iso || value);
    } else {
      el.value = iso || value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // ── Visual Feedback ──────────────────────────────────────────

  private injectStyles(): void {
    if (document.getElementById("ed-formfill-styles")) return;

    const style = document.createElement("style");
    style.id = "ed-formfill-styles";
    style.textContent = `
      @keyframes ed-field-pulse {
        0%, 100% { box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.6); }
        50% { box-shadow: 0 0 0 6px rgba(45, 212, 191, 0.2), 0 0 20px rgba(45, 212, 191, 0.15); }
      }
      @keyframes ed-field-flash-success {
        0% { box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.8); }
        100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
      }
      @keyframes ed-progress-slide {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes ed-field-label-in {
        from { transform: translateY(8px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .ed-field-active {
        outline: 2px solid #2dd4bf !important;
        outline-offset: 2px !important;
        animation: ed-field-pulse 2s ease-in-out infinite !important;
        transition: outline 0.3s ease !important;
        position: relative !important;
        z-index: 10000 !important;
      }
      .ed-field-filled {
        outline: 2px solid #22c55e !important;
        outline-offset: 2px !important;
        animation: ed-field-flash-success 0.6s ease-out forwards !important;
      }
      .ed-field-label {
        position: absolute;
        background: #0f172a;
        color: #2dd4bf;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-weight: 600;
        white-space: nowrap;
        z-index: 10001;
        pointer-events: none;
        animation: ed-field-label-in 0.3s ease-out;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      .ed-field-label::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 16px;
        width: 8px;
        height: 8px;
        background: #0f172a;
        transform: rotate(45deg);
      }
      .ed-progress-bar {
        position: fixed;
        bottom: 100px;
        right: 20px;
        background: rgba(15, 23, 42, 0.95);
        color: white;
        padding: 12px 16px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px;
        z-index: 2147483646;
        min-width: 220px;
        animation: ed-progress-slide 0.3s ease-out;
        box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        border: 1px solid rgba(45, 212, 191, 0.2);
        backdrop-filter: blur(10px);
      }
      .ed-progress-track {
        height: 4px;
        background: rgba(255,255,255,0.1);
        border-radius: 2px;
        margin-top: 8px;
        overflow: hidden;
      }
      .ed-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #2dd4bf, #06b6d4);
        border-radius: 2px;
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .ed-progress-field-name {
        color: #2dd4bf;
        font-weight: 600;
      }
      .ed-progress-count {
        color: rgba(255,255,255,0.5);
        font-size: 11px;
        margin-top: 4px;
      }
    `;
    document.head.appendChild(style);
  }

  private highlightCurrentField(): void {
    this.clearHighlight();
    const field = this.getCurrentField();
    if (!field) return;

    const el = field.element;

    // Add active class
    el.classList.add("ed-field-active");

    // Scroll to field (guard for headless/jsdom environments)
    el.scrollIntoView?.({ behavior: "smooth", block: "center" });

    // Add floating label above the field
    const rect = el.getBoundingClientRect();
    const label = document.createElement("div");
    label.className = "ed-field-label";
    label.id = "ed-field-label-overlay";

    const progress = this.getProgress();
    const fieldNum = (this.session?.currentIndex || 0) + 1;
    const required = field.required ? " *" : "";
    label.textContent = `${fieldNum}/${progress.total} ${field.label}${required}`;

    label.style.top = `${rect.top + window.scrollY - 32}px`;
    label.style.left = `${rect.left + window.scrollX}px`;
    document.body.appendChild(label);

    this.highlightEl = label;
  }

  private clearHighlight(): void {
    // Remove active classes from all fields
    document.querySelectorAll(".ed-field-active").forEach((el) => {
      el.classList.remove("ed-field-active");
    });

    // Remove label overlay
    if (this.highlightEl) {
      this.highlightEl.remove();
      this.highlightEl = null;
    }
    document.getElementById("ed-field-label-overlay")?.remove();
  }

  private flashField(el: HTMLElement, _type: "success" | "error"): void {
    el.classList.remove("ed-field-active");
    el.classList.add("ed-field-filled");
    setTimeout(() => el.classList.remove("ed-field-filled"), 600);
  }

  private showProgress(): void {
    this.removeProgress();
    const progress = this.getProgress();

    const el = document.createElement("div");
    el.className = "ed-progress-bar";
    el.id = "ed-formfill-progress";
    el.innerHTML = `
      <div>
        Ed is helping you fill this form
      </div>
      <div class="ed-progress-count">
        Field <span class="ed-progress-field-name">${this.getCurrentField()?.label || ""}</span>
      </div>
      <div class="ed-progress-track">
        <div class="ed-progress-fill" style="width: ${progress.percentage}%"></div>
      </div>
      <div class="ed-progress-count">${progress.current} of ${progress.total} fields</div>
    `;
    document.body.appendChild(el);
    // el is findable via getElementById("ed-formfill-progress")
  }

  private updateProgress(): void {
    const el = document.getElementById("ed-formfill-progress");
    if (!el || !this.session) return;

    const progress = this.getProgress();
    const field = this.getCurrentField();

    const fieldName = el.querySelector(".ed-progress-field-name");
    if (fieldName) fieldName.textContent = field?.label || "Review";

    const fill = el.querySelector<HTMLElement>(".ed-progress-fill");
    if (fill) fill.style.width = `${progress.percentage}%`;

    const count = el.querySelectorAll(".ed-progress-count");
    if (count[1])
      count[1].textContent = `${progress.current} of ${progress.total} fields`;
  }

  private removeProgress(): void {
    document.getElementById("ed-formfill-progress")?.remove();
    // Progress element removed from DOM
  }

  // ── Utilities ────────────────────────────────────────────────

  private parseDateToISO(dateText: string): string | null {
    if (!dateText?.trim()) return null;
    const text = dateText.trim();

    // Already ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

    try {
      let date: Date | null = null;

      // "18th of June 1972" / "18th June 1972"
      const ordinal = text.match(
        /(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]+)\s+(\d{4})/i,
      );
      if (ordinal) {
        date = new Date(`${ordinal[2]} ${ordinal[1]}, ${ordinal[3]}`);
      }

      // "June 18, 1972"
      if (!date || isNaN(date.getTime())) {
        const mdy = text.match(/([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/i);
        if (mdy) date = new Date(`${mdy[1]} ${mdy[2]}, ${mdy[3]}`);
      }

      // DD/MM/YYYY or DD-MM-YYYY (UK format)
      if (!date || isNaN(date.getTime())) {
        const slash = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (slash) {
          date = new Date(
            parseInt(slash[3]),
            parseInt(slash[2]) - 1,
            parseInt(slash[1]),
          );
        }
      }

      // Last resort: native parse
      if (!date || isNaN(date.getTime())) {
        date = new Date(text);
      }

      if (!date || isNaN(date.getTime())) return null;

      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    } catch {
      return null;
    }
  }

  private isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    if (style.display === "none") return false;
    if (style.visibility === "hidden") return false;
    if (style.opacity === "0") return false;
    // offsetParent and getBoundingClientRect return null/zero in jsdom/headless.
    // Only apply layout checks when the browser actually computes layout.
    if (typeof element.offsetParent !== "undefined") {
      if (
        element.offsetParent === null &&
        style.position !== "fixed" &&
        element.offsetWidth > 0
      ) {
        return false;
      }
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0) return true;
    }
    // Fallback: if layout info is unavailable (jsdom), trust CSS properties
    return true;
  }

  private inferFormTitle(container: HTMLElement): string {
    // Look for a heading near or inside the form
    const heading = container.querySelector("h1, h2, h3, h4, legend");
    if (heading?.textContent?.trim()) return heading.textContent.trim();

    // Check aria-label on form
    const ariaLabel = container.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel;

    // Check form action for hints
    if (container instanceof HTMLFormElement && container.action) {
      try {
        const url = new URL(container.action);
        const path = url.pathname.split("/").pop();
        if (path) return path.replace(/[-_]/g, " ");
      } catch {
        // ignore
      }
    }

    return "Form";
  }

  private findCommonContainer(elements: Element[]): HTMLElement | null {
    if (elements.length === 0) return null;
    if (elements.length === 1) return elements[0].parentElement;

    let ancestor: HTMLElement | null = elements[0].parentElement;
    while (ancestor && ancestor !== document.body) {
      const containsAll = elements.every((el) => ancestor!.contains(el));
      if (containsAll) return ancestor;
      ancestor = ancestor.parentElement;
    }

    return document.body;
  }

  private cleanup(): void {
    this.clearHighlight();
    this.removeProgress();
    // Remove injected styles
    document.getElementById("ed-formfill-styles")?.remove();
  }
}
