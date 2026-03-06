"use client";

import { useEffect, useState, useRef } from "react";
import Script from "next/script";

/**
 * Demo 2: Absence Request Form with Ed
 * Shows Ed helping a parent fill a school form in any language
 * Ed flags attendance risks and translates between languages
 * Access: /demo/form
 */
export default function FormDemoPage() {
  const [edLoaded, setEdLoaded] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [panelVisible, setPanelVisible] = useState(true);
  const [logVisible, setLogVisible] = useState(false);
  const [logEntries, setLogEntries] = useState<string[]>([
    "Absence request form loaded",
    "Toggle Ed ON — try speaking in any language",
  ]);
  const logRef = useRef<HTMLDivElement>(null);

  function log(msg: string) {
    const time = new Date().toLocaleTimeString("en-GB");
    setLogEntries((prev) => [...prev, `[${time}] ${msg}`]);
  }

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logEntries]);

  useEffect(() => {
    const handler = (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (form.id === "absence-form") {
        e.preventDefault();
        log("SUBMIT: absence-form -- BLOCKED (demo mode)");
        alert(
          "Form submission blocked (demo mode).\n\nIn production, this would submit to the school's Microsoft Forms backend and the school office would receive the request.",
        );
      }
    };
    document.addEventListener("submit", handler, true);
    return () => document.removeEventListener("submit", handler, true);
  }, []);

  function toggleEd() {
    if (!edLoaded) loadEd();
    else unloadEd();
  }

  // Auto-load Ed when script is ready
  useEffect(() => {
    if (scriptReady && !edLoaded) {
      loadEd();
    }
  }, [scriptReady]);

  function loadEd() {
    if (edLoaded || !scriptReady) return;
    const EdWidget = (window as any).EdWidget;
    if (!EdWidget) {
      log("ERROR: EdWidget not found");
      return;
    }
    try {
      // Clear any stub instance from root layout's EdWidgetWrapper
      if ((window as any).__ED_INSTANCE__) {
        try {
          (window as any).__ED_INSTANCE__.destroy?.();
        } catch {}
        delete (window as any).__ED_INSTANCE__;
      }
      log("Initialising Ed...");
      const ed = EdWidget.init({
        schoolId: "aurora-primary",
        schoolName: "Aurora Primary School",
        theme: "standard",
        position: "bottom-right",
        language: "en-GB",
        mode: "website",
        provider: "api",
        apiBaseUrl: "/api/ed/demo-chat",
        enableTTS: true,
        ttsProvider: "fish",
        fishAudioApiKey: "proxy",
        fishAudioVoiceIds: {
          ed: "400b2a2c4aa44afc87b6d14adf0dd13c",
          edwina: "72e3a3135204461ba041df787dc5c834",
        },
        features: {
          admissions: true,
          policies: true,
          calendar: true,
          staffDirectory: false,
          formFill: true,
          voice: true,
        },
      });
      // Auto-open Ed so he's visible immediately
      if (ed && typeof ed.open === "function") {
        setTimeout(() => ed.open(), 500);
      }
      setEdLoaded(true);
      log("Ed is live! Try: 'Help me fill this form'");
      if (!logVisible) setLogVisible(true);
    } catch (err: any) {
      log("ERROR: " + err.message);
    }
  }

  function unloadEd() {
    if (!edLoaded) return;
    if ((window as any).EdWidget) {
      (window as any).EdWidget.destroy();
      log("Ed removed");
    }
    document
      .querySelectorAll(
        "#ed-widget-container, .ed-widget, .ed-field-active, .ed-field-label, #ed-submit-confirm, #ed-progress-overlay",
      )
      .forEach((el) => el.remove());
    document.querySelectorAll("style").forEach((style) => {
      if (
        style.textContent?.includes("ed-field-pulse") ||
        style.textContent?.includes("ed-widget")
      ) {
        style.remove();
      }
    });
    setEdLoaded(false);
  }

  return (
    <>
      <Script
        src="/js/ed-widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          setScriptReady(true);
        }}
      />
      <link rel="stylesheet" href="/js/ed-widget.css" />
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .form-demo * { box-sizing: border-box; margin: 0; padding: 0; }
        .form-demo { font-family: 'Montserrat', -apple-system, sans-serif; color: #1a1a2e; line-height: 1.6; background: #f4f6f9; min-height: 100vh; }
        .form-demo a { color: inherit; text-decoration: none; }

        :root {
          --f-blue: #0F6BBE;
          --f-blue-dark: #0a4f8c;
          --f-gold: #CE983E;
          --f-red: #dc2626;
          --f-orange: #f59e0b;
          --f-green: #10b981;
          --f-bg: #f4f6f9;
          --f-text: #1a1a2e;
          --f-text-muted: #5a5a7a;
          --f-border: #d1d5db;
        }

        /* Header bar */
        .form-header { background: var(--f-blue); color: #fff; padding: 16px 24px; display: flex; align-items: center; gap: 16px; }
        .form-header-crest { width: 44px; height: 44px; border-radius: 50%; background: var(--f-gold); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: var(--f-blue-dark); }
        .form-header h1 { font-size: 18px; font-weight: 700; color: #fff; }
        .form-header p { font-size: 12px; opacity: 0.8; color: #fff; }
        .form-header-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
        .form-header-link { font-size: 13px; color: rgba(255,255,255,0.8); }
        .form-header-link:hover { color: #fff; }

        /* Form container */
        .form-page { max-width: 720px; margin: 0 auto; padding: 32px 24px 80px; }

        /* Info banner */
        .form-info-banner { background: #fff; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid var(--f-border); border-left: 4px solid var(--f-blue); }
        .form-info-banner h2 { font-size: 22px; font-weight: 700; color: var(--f-blue); margin-bottom: 8px; }
        .form-info-banner p { font-size: 14px; color: var(--f-text-muted); line-height: 1.7; }

        /* Attendance warning */
        .attendance-warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px; display: flex; gap: 14px; align-items: flex-start; }
        .attendance-warning .warn-icon { font-size: 24px; flex-shrink: 0; }
        .attendance-warning h3 { font-size: 14px; font-weight: 700; color: #92400e; margin-bottom: 4px; }
        .attendance-warning p { font-size: 13px; color: #78350f; line-height: 1.6; }
        .attendance-warning .stat { font-weight: 700; color: var(--f-red); }

        /* Language banner */
        .lang-banner { background: linear-gradient(135deg, var(--f-blue) 0%, #1a7fd4 100%); border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; color: #fff; display: flex; align-items: center; gap: 16px; }
        .lang-banner .lang-icon { font-size: 32px; }
        .lang-banner h3 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
        .lang-banner p { font-size: 13px; opacity: 0.9; }

        /* Form card */
        .form-card { background: #fff; border-radius: 12px; padding: 32px; border: 1px solid var(--f-border); }
        .form-section-title { font-size: 16px; font-weight: 700; color: var(--f-blue); margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid var(--f-bg); }

        .fg { margin-bottom: 22px; }
        .fg label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px; color: var(--f-text); }
        .fg .req { color: var(--f-red); }
        .fg .help-text { font-size: 12px; color: var(--f-text-muted); margin-top: 4px; }
        .fg input, .fg select, .fg textarea { width: 100%; padding: 12px 14px; border: 1px solid var(--f-border); border-radius: 8px; font-size: 14px; font-family: 'Montserrat', sans-serif; transition: border-color 0.2s; background: #fff; color: var(--f-text); }
        .fg input:focus, .fg select:focus, .fg textarea:focus { outline: none; border-color: var(--f-blue); box-shadow: 0 0 0 3px rgba(15,107,190,0.1); }
        .fg textarea { resize: vertical; min-height: 100px; }
        .fg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .fg-radio { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 6px; }
        .fg-radio label { display: flex; align-items: center; gap: 8px; font-weight: 400; font-size: 14px; cursor: pointer; padding: 8px 16px; border: 1px solid var(--f-border); border-radius: 8px; transition: all 0.2s; }
        .fg-radio label:hover { border-color: var(--f-blue); background: rgba(15,107,190,0.04); }
        .fg-radio input:checked + span { color: var(--f-blue); font-weight: 600; }
        .fg-radio input { width: auto; }

        .fg-cb { display: flex; align-items: flex-start; gap: 10px; padding: 14px; background: var(--f-bg); border-radius: 8px; border: 1px solid var(--f-border); }
        .fg-cb input { width: auto; margin-top: 3px; }
        .fg-cb label { font-weight: 400; font-size: 13px; color: var(--f-text-muted); line-height: 1.6; }

        .form-submit { background: var(--f-blue); color: #fff; padding: 14px 36px; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.2s; font-family: 'Montserrat', sans-serif; }
        .form-submit:hover { background: var(--f-blue-dark); }

        /* Legal notice */
        .legal-notice { background: var(--f-bg); border-radius: 10px; padding: 18px 20px; margin-top: 24px; border: 1px solid var(--f-border); }
        .legal-notice h4 { font-size: 13px; font-weight: 700; color: var(--f-text); margin-bottom: 6px; }
        .legal-notice p { font-size: 12px; color: var(--f-text-muted); line-height: 1.7; }
        .legal-notice ul { font-size: 12px; color: var(--f-text-muted); line-height: 1.7; padding-left: 18px; margin-top: 6px; }

        /* Demo panel */
        .demo-panel { position: fixed; top: 16px; right: 16px; z-index: 100000; background: #111; color: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 8px 40px rgba(0,0,0,0.3); width: 280px; font-size: 13px; transition: transform 0.3s; font-family: 'Montserrat', sans-serif; }
        .demo-panel.collapsed { transform: translateX(calc(100% + 32px)); }
        .demo-panel h4 { font-size: 14px; margin-bottom: 12px; color: var(--f-gold); }
        .demo-toggle-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .demo-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .demo-badge.on { background: #10b981; color: #fff; }
        .demo-badge.off { background: #374151; color: #9ca3af; }
        .demo-switch { width: 44px; height: 24px; background: #374151; border-radius: 12px; position: relative; cursor: pointer; transition: background 0.3s; flex-shrink: 0; }
        .demo-switch.on { background: #10b981; }
        .demo-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: transform 0.3s; }
        .demo-switch.on::after { transform: translateX(20px); }
        .demo-note { color: #9ca3af; font-size: 11px; margin-top: 12px; line-height: 1.6; }
        .demo-panel-btn { position: fixed; top: 16px; right: 16px; z-index: 100001; background: #111; color: var(--f-gold); border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; font-family: 'Montserrat', sans-serif; }

        /* Demo scenario boxes */
        .demo-scenario { background: #1f2937; border-radius: 8px; padding: 12px; margin-top: 10px; }
        .demo-scenario h5 { font-size: 11px; font-weight: 700; color: var(--f-gold); margin-bottom: 6px; }
        .demo-scenario p { font-size: 11px; color: #d1d5db; line-height: 1.5; }
        .demo-scenario .demo-lang { font-style: italic; color: #93c5fd; }

        /* Event log */
        .demo-log { position: fixed; bottom: 0; left: 0; right: 0; height: 0; background: #111; color: #0f0; font-family: "Courier New", monospace; font-size: 11px; overflow-y: auto; transition: height 0.3s; z-index: 99999; padding: 0; }
        .demo-log.open { height: 180px; padding: 12px; }
        .demo-log-btn { position: fixed; bottom: 8px; left: 8px; z-index: 100000; background: #111; color: #0f0; border: 1px solid #333; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-family: monospace; }

        @media (max-width: 768px) {
          .fg-row { grid-template-columns: 1fr; }
          .fg-radio { flex-direction: column; }
        }
      `,
        }}
      />

      <div className="form-demo">
        {/* Header */}
        <header className="form-header">
          <div className="form-header-crest">AP</div>
          <div>
            <h1>Aurora Primary School</h1>
            <p>Parent Forms Portal</p>
          </div>
          <div className="form-header-right">
            <a href="/demo/school" className="form-header-link">
              &larr; Back to School Website
            </a>
          </div>
        </header>

        <div className="form-page">
          {/* Info Banner */}
          <div className="form-info-banner">
            <h2>Request for Leave of Absence</h2>
            <p>
              Please complete this form if you wish to request authorised
              absence for your child during term time. All requests must be
              submitted at least <strong>4 weeks in advance</strong>. The
              Headteacher will consider each request individually and respond
              within 5 working days.
            </p>
          </div>

          {/* Attendance Warning */}
          <div className="attendance-warning">
            <div className="warn-icon">&#9888;&#65039;</div>
            <div>
              <h3>Important: Attendance &amp; the Law</h3>
              <p>
                Regular attendance is vital for your child&apos;s education. The
                Department for Education states that children with attendance
                below <span className="stat">90%</span> are classified as
                &quot;persistently absent&quot;. Unauthorised absence may result
                in a{" "}
                <strong>
                  fixed penalty notice of &pound;80&ndash;&pound;160 per parent,
                  per child
                </strong>
                . The school cannot authorise holidays during term time except
                in exceptional circumstances.
              </p>
            </div>
          </div>

          {/* Language Support Banner */}
          <div className="lang-banner">
            <div className="lang-icon">🌍</div>
            <div>
              <h3>Need help in your language?</h3>
              <p>
                Ed can help you complete this form in Urdu, Polish, Punjabi,
                Arabic, Bengali, or any other language. Just click Ed and speak
                naturally — he&apos;ll translate and fill the form for you.
              </p>
            </div>
          </div>

          {/* The Form */}
          <div className="form-card">
            <form id="absence-form" action="#" method="post">
              <input
                type="hidden"
                name="csrf_token"
                defaultValue="demo-csrf-absence"
              />

              {/* Section 1: Parent/Carer Details */}
              <h3 className="form-section-title">
                Your Details (Parent/Carer)
              </h3>

              <div className="fg-row">
                <div className="fg">
                  <label htmlFor="parent_name">
                    Full Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="parent_name"
                    name="parent_name"
                    required
                    placeholder="e.g. Sarah Johnson"
                  />
                </div>
                <div className="fg">
                  <label htmlFor="relationship">
                    Relationship to Child <span className="req">*</span>
                  </label>
                  <select id="relationship" name="relationship" required>
                    <option value="">-- Please select --</option>
                    <option value="mother">Mother</option>
                    <option value="father">Father</option>
                    <option value="guardian">Legal Guardian</option>
                    <option value="carer">Foster Carer</option>
                    <option value="grandparent">Grandparent</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="fg-row">
                <div className="fg">
                  <label htmlFor="parent_email">
                    Email Address <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    id="parent_email"
                    name="parent_email"
                    required
                    placeholder="e.g. parent@example.com"
                  />
                </div>
                <div className="fg">
                  <label htmlFor="parent_phone">
                    Phone Number <span className="req">*</span>
                  </label>
                  <input
                    type="tel"
                    id="parent_phone"
                    name="parent_phone"
                    required
                    placeholder="e.g. 07700 900123"
                  />
                </div>
              </div>

              {/* Section 2: Child Details */}
              <h3 className="form-section-title" style={{ marginTop: 32 }}>
                Child&apos;s Details
              </h3>

              <div className="fg-row">
                <div className="fg">
                  <label htmlFor="child_name">
                    Child&apos;s Full Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="child_name"
                    name="child_name"
                    required
                    placeholder="e.g. James Johnson"
                  />
                </div>
                <div className="fg">
                  <label htmlFor="child_class">
                    Class <span className="req">*</span>
                  </label>
                  <select id="child_class" name="child_class" required>
                    <option value="">-- Please select --</option>
                    <option value="reception">Reception (Mrs Davies)</option>
                    <option value="year1">Year 1 (Miss Thompson)</option>
                    <option value="year2">Year 2 (Mr Ahmed)</option>
                    <option value="year3">Year 3 (Mrs Patel)</option>
                    <option value="year4">Year 4 (Miss Clarke)</option>
                    <option value="year5">Year 5 (Mr Wilson)</option>
                    <option value="year6">Year 6 (Mrs Bennett)</option>
                  </select>
                </div>
              </div>

              <div className="fg">
                <label htmlFor="child_dob">
                  Date of Birth <span className="req">*</span>
                </label>
                <input type="date" id="child_dob" name="child_dob" required />
              </div>

              {/* Section 3: Absence Details */}
              <h3 className="form-section-title" style={{ marginTop: 32 }}>
                Absence Details
              </h3>

              <div className="fg-row">
                <div className="fg">
                  <label htmlFor="absence_from">
                    Date From <span className="req">*</span>
                  </label>
                  <input
                    type="date"
                    id="absence_from"
                    name="absence_from"
                    required
                  />
                </div>
                <div className="fg">
                  <label htmlFor="absence_to">
                    Date To <span className="req">*</span>
                  </label>
                  <input
                    type="date"
                    id="absence_to"
                    name="absence_to"
                    required
                  />
                </div>
              </div>

              <div className="fg">
                <label htmlFor="total_days">
                  Total School Days Missed <span className="req">*</span>
                </label>
                <input
                  type="number"
                  id="total_days"
                  name="total_days"
                  required
                  min="1"
                  max="20"
                  placeholder="e.g. 5"
                />
                <p className="help-text">
                  Only count weekdays (Monday to Friday) during term time
                </p>
              </div>

              <div className="fg">
                <label>
                  Reason for Absence <span className="req">*</span>
                </label>
                <div className="fg-radio">
                  <label>
                    <input
                      type="radio"
                      name="absence_reason"
                      value="family_event"
                    />
                    <span>Family event (wedding, funeral)</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="absence_reason"
                      value="religious"
                    />
                    <span>Religious observance</span>
                  </label>
                  <label>
                    <input type="radio" name="absence_reason" value="medical" />
                    <span>Medical appointment/treatment</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="absence_reason"
                      value="bereavement"
                    />
                    <span>Bereavement</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="absence_reason"
                      value="exceptional"
                    />
                    <span>Exceptional circumstances</span>
                  </label>
                  <label>
                    <input type="radio" name="absence_reason" value="holiday" />
                    <span>Family holiday</span>
                  </label>
                </div>
              </div>

              <div className="fg">
                <label htmlFor="absence_details">
                  Please explain the circumstances{" "}
                  <span className="req">*</span>
                </label>
                <textarea
                  id="absence_details"
                  name="absence_details"
                  required
                  placeholder="Please provide full details of why this absence is being requested, including any supporting information..."
                />
                <p className="help-text">
                  The more detail you provide, the easier it is for the
                  Headteacher to consider your request
                </p>
              </div>

              <div className="fg">
                <label>
                  Has your child had any previous authorised absences this
                  academic year?
                </label>
                <div className="fg-radio">
                  <label>
                    <input type="radio" name="previous_absence" value="yes" />
                    <span>Yes</span>
                  </label>
                  <label>
                    <input type="radio" name="previous_absence" value="no" />
                    <span>No</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="previous_absence"
                      value="unsure"
                    />
                    <span>Not sure</span>
                  </label>
                </div>
              </div>

              {/* Section 4: Declaration */}
              <h3 className="form-section-title" style={{ marginTop: 32 }}>
                Declaration
              </h3>

              <div className="fg">
                <div className="fg-cb">
                  <input
                    type="checkbox"
                    id="declare_understand"
                    name="declare_understand"
                    required
                  />
                  <label htmlFor="declare_understand">
                    I understand that the Headteacher is not obliged to grant
                    leave of absence and that if the absence is taken without
                    authorisation, a fixed penalty notice may be issued by the
                    Local Authority. <span className="req">*</span>
                  </label>
                </div>
              </div>

              <div className="fg">
                <div className="fg-cb">
                  <input
                    type="checkbox"
                    id="declare_accurate"
                    name="declare_accurate"
                    required
                  />
                  <label htmlFor="declare_accurate">
                    I confirm that the information provided above is accurate
                    and complete. <span className="req">*</span>
                  </label>
                </div>
              </div>

              <div className="fg">
                <div className="fg-cb">
                  <input
                    type="checkbox"
                    id="declare_gdpr"
                    name="declare_gdpr"
                    required
                  />
                  <label htmlFor="declare_gdpr">
                    I consent to Aurora Primary School processing this data for
                    attendance management purposes in line with the
                    school&apos;s{" "}
                    <a
                      href="#"
                      style={{
                        color: "var(--f-blue)",
                        textDecoration: "underline",
                      }}
                    >
                      Privacy Notice
                    </a>
                    . <span className="req">*</span>
                  </label>
                </div>
              </div>

              <div className="fg" style={{ marginTop: 8 }}>
                <label htmlFor="signature">
                  Digital Signature (type your full name){" "}
                  <span className="req">*</span>
                </label>
                <input
                  type="text"
                  id="signature"
                  name="signature"
                  required
                  placeholder="Type your full name as signature"
                  style={{ fontStyle: "italic" }}
                />
              </div>

              <div className="fg">
                <label htmlFor="sign_date">
                  Date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  id="sign_date"
                  name="sign_date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>

              <button type="submit" className="form-submit">
                Submit Absence Request
              </button>
            </form>
          </div>

          {/* Legal Notice */}
          <div className="legal-notice">
            <h4>Legal Framework</h4>
            <p>
              This form is processed under the Education Act 1996 (Section 444)
              and the Education (Pupil Registration) (England) Regulations 2006
              (as amended 2013).
            </p>
            <ul>
              <li>
                Only the Headteacher can authorise leave of absence in term time
              </li>
              <li>
                Leave can only be granted in &quot;exceptional
                circumstances&quot;
              </li>
              <li>
                Holidays are NOT normally considered exceptional circumstances
              </li>
              <li>
                Penalty notices: &pound;80 per parent per child (rising to
                &pound;160 if unpaid within 21 days)
              </li>
              <li>Persistent unauthorised absence may result in prosecution</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Demo Panel */}
      <button
        className="demo-panel-btn"
        onClick={() => setPanelVisible(!panelVisible)}
      >
        {panelVisible ? "Ed Demo" : "Show Panel"}
      </button>

      <div className={`demo-panel ${panelVisible ? "" : "collapsed"}`}>
        <h4>Demo 2: Form Helper</h4>

        <div className="demo-toggle-row">
          <span>Ed Assistant</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={`demo-badge ${edLoaded ? "on" : "off"}`}>
              {edLoaded ? "ON" : "OFF"}
            </span>
            <div
              className={`demo-switch ${edLoaded ? "on" : ""}`}
              onClick={toggleEd}
            />
          </div>
        </div>

        <div className="demo-scenario">
          <h5>Scenario A: English Speaker</h5>
          <p>
            &quot;My name is Sarah Johnson, my daughter Amara is in Year 3. We
            need 3 days off from March 24th for my sister&apos;s wedding in
            Birmingham.&quot;
          </p>
        </div>

        <div className="demo-scenario">
          <h5>Scenario B: Urdu Speaker</h5>
          <p>
            Press the mic button and say:
            <br />
            <span className="demo-lang">
              &quot;Mera naam Fatima hai, meri beti Aisha Year 2 mein hai.
              Humein 20 March se 5 din ki chutti chahiye kyunki Pakistan mein
              family wedding hai.&quot;
            </span>
          </p>
        </div>

        <div className="demo-scenario">
          <h5>Scenario C: Polish Speaker</h5>
          <p>
            <span className="demo-lang">
              &quot;Nazywam sie Anna Kowalska, m&oacute;j syn Jakub jest w Year
              4. Potrzebujemy 4 dni wolnego od 15 kwietnia na pogrzeb w
              Polsce.&quot;
            </span>
          </p>
        </div>

        <p className="demo-note">
          Ed will translate, fill the form, flag attendance risks, and explain
          consequences in the parent&apos;s language.
        </p>
      </div>

      {/* Event Log */}
      <div className={`demo-log ${logVisible ? "open" : ""}`} ref={logRef}>
        {logEntries.map((entry, i) => (
          <div key={i}>{entry}</div>
        ))}
      </div>
      <button
        className="demo-log-btn"
        style={logVisible ? { bottom: 188 } : undefined}
        onClick={() => setLogVisible(!logVisible)}
      >
        Event Log
      </button>
    </>
  );
}
