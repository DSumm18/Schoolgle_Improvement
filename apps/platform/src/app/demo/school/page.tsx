"use client";

import { useEffect, useState, useRef } from "react";
import Script from "next/script";

/**
 * Demo: Aurora Primary School with Ed Widget
 * Design inspired by Rawdon St Peter's CE Primary — renamed for demo purposes
 * Access: /demo/school
 */
export default function SchoolDemoPage() {
  const [edLoaded, setEdLoaded] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [panelVisible, setPanelVisible] = useState(true);
  const [logVisible, setLogVisible] = useState(false);
  const [logEntries, setLogEntries] = useState<string[]>([
    "Aurora Primary School website loaded",
    "Toggle Ed ON to add the assistant",
  ]);
  const logRef = useRef<HTMLDivElement>(null);

  function log(msg: string) {
    const time = new Date().toLocaleTimeString("en-GB");
    setLogEntries((prev) => [...prev, `[${time}] ${msg}`]);
  }

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logEntries]);

  // Prevent form submissions in demo
  useEffect(() => {
    const handler = (e: Event) => {
      const form = e.target as HTMLFormElement;
      if (form.id === "contact-form" || form.id === "admissions-form") {
        e.preventDefault();
        log(`SUBMIT: ${form.id} -- BLOCKED (demo mode)`);
        alert(
          "Form submission blocked (demo mode).\n\nIn production, this would submit to the school's backend.",
        );
      }
    };
    document.addEventListener("submit", handler, true);
    return () => document.removeEventListener("submit", handler, true);
  }, []);

  function toggleEd() {
    if (!edLoaded) {
      loadEd();
    } else {
      unloadEd();
    }
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
      log("ERROR: EdWidget not found. Script may not have loaded.");
      return;
    }

    const mode =
      (document.getElementById("ed-mode") as HTMLSelectElement)?.value ||
      "website";

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
        mode,
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
      log("Ed is live! Mode: " + mode);
      if (!logVisible) setLogVisible(true);
    } catch (err: any) {
      log("ERROR: " + err.message);
      console.error("[Demo] EdWidget.init() failed:", err);
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
          console.log("[Demo] Ed widget script loaded");
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
        /* ═══ Aurora Primary School - CSS Reset & Theme ═══ */
        .aurora-site * { box-sizing: border-box; margin: 0; padding: 0; }
        .aurora-site { font-family: 'Montserrat', -apple-system, sans-serif; color: #1a1a2e; line-height: 1.6; background: #fff; }
        .aurora-site a { color: inherit; text-decoration: none; }

        :root {
          --a-blue: #0F6BBE;
          --a-blue-dark: #0a4f8c;
          --a-gold: #CE983E;
          --a-gold-light: #e8c97a;
          --a-cream: #faf8f3;
          --a-text: #1a1a2e;
          --a-text-muted: #5a5a7a;
          --a-border: #e0dcd4;
        }

        /* ═══ Header ═══ */
        .aurora-header { background: var(--a-blue); color: #fff; }
        .aurora-header-top { display: flex; align-items: center; justify-content: space-between; max-width: 1200px; margin: 0 auto; padding: 18px 24px; }
        .aurora-crest { width: 70px; height: 70px; border-radius: 50%; background: var(--a-gold); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: var(--a-blue); border: 3px solid rgba(255,255,255,0.3); }
        .aurora-name { flex: 1; margin-left: 18px; }
        .aurora-name h1 { font-size: 24px; font-weight: 700; letter-spacing: 0.5px; color: #fff; line-height: 1.3; }
        .aurora-name p { font-size: 13px; opacity: 0.85; color: #fff; font-weight: 500; letter-spacing: 1px; }
        .aurora-header-cta { background: var(--a-gold); color: var(--a-blue-dark); padding: 10px 22px; border-radius: 6px; font-weight: 600; font-size: 14px; transition: background 0.2s; }
        .aurora-header-cta:hover { background: var(--a-gold-light); }

        .aurora-nav { background: rgba(0,0,0,0.15); }
        .aurora-nav-inner { max-width: 1200px; margin: 0 auto; display: flex; gap: 0; overflow-x: auto; }
        .aurora-nav-inner a { padding: 13px 22px; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85); transition: background 0.2s; white-space: nowrap; }
        .aurora-nav-inner a:hover, .aurora-nav-inner a.active { background: rgba(255,255,255,0.12); color: #fff; }

        /* ═══ Hero Banner ═══ */
        .aurora-hero { background: linear-gradient(135deg, var(--a-blue) 0%, #1a7fd4 60%, var(--a-gold) 100%); color: #fff; padding: 90px 24px 80px; text-align: center; position: relative; }
        .aurora-hero::after { content: ""; position: absolute; bottom: 0; left: 0; right: 0; height: 80px; background: linear-gradient(transparent, var(--a-cream)); }
        .aurora-hero-motto { font-size: 16px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--a-gold-light); margin-bottom: 16px; }
        .aurora-hero h2 { font-size: 44px; font-weight: 800; margin-bottom: 16px; color: #fff; }
        .aurora-hero p { font-size: 18px; opacity: 0.92; max-width: 650px; margin: 0 auto 36px; color: #fff; line-height: 1.7; }
        .aurora-hero-buttons { display: flex; gap: 16px; justify-content: center; position: relative; z-index: 2; }
        .aurora-btn { padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 15px; cursor: pointer; border: none; transition: transform 0.2s, box-shadow 0.2s; font-family: 'Montserrat', sans-serif; }
        .aurora-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
        .aurora-btn-gold { background: var(--a-gold); color: var(--a-blue-dark); }
        .aurora-btn-outline { background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.5); }

        /* ═══ Values Section ═══ */
        .aurora-values { background: var(--a-cream); padding: 60px 24px; border-bottom: 1px solid var(--a-border); }
        .aurora-values-inner { max-width: 1200px; margin: 0 auto; text-align: center; }
        .aurora-values h2 { font-size: 28px; font-weight: 700; color: var(--a-blue); margin-bottom: 8px; }
        .aurora-values .subtitle { color: var(--a-text-muted); font-size: 16px; margin-bottom: 40px; }
        .aurora-values-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 20px; }
        .aurora-value-card { background: #fff; border-radius: 12px; padding: 28px 16px; text-align: center; border: 1px solid var(--a-border); transition: transform 0.3s, box-shadow 0.3s; }
        .aurora-value-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
        .aurora-value-icon { font-size: 36px; margin-bottom: 12px; }
        .aurora-value-card h3 { font-size: 14px; font-weight: 700; color: var(--a-blue); letter-spacing: 0.5px; }

        /* ═══ Info Strip ═══ */
        .aurora-info-strip { background: var(--a-blue); color: #fff; }
        .aurora-info-grid { display: grid; grid-template-columns: repeat(4, 1fr); max-width: 1200px; margin: 0 auto; }
        .aurora-info-item { padding: 28px 24px; text-align: center; border-right: 1px solid rgba(255,255,255,0.15); }
        .aurora-info-item:last-child { border-right: none; }
        .aurora-info-item .number { font-size: 32px; font-weight: 800; color: var(--a-gold); }
        .aurora-info-item .label { font-size: 13px; color: rgba(255,255,255,0.75); margin-top: 4px; font-weight: 500; }

        /* ═══ Quick Links ═══ */
        .aurora-quicklinks { max-width: 1200px; margin: 0 auto; padding: 60px 24px; }
        .aurora-quicklinks h2 { font-size: 28px; font-weight: 700; color: var(--a-blue); margin-bottom: 8px; text-align: center; }
        .aurora-quicklinks .subtitle { color: var(--a-text-muted); font-size: 16px; margin-bottom: 40px; text-align: center; }
        .aurora-ql-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .aurora-ql-card { background: var(--a-cream); border-radius: 12px; padding: 32px 24px; text-align: center; border: 1px solid var(--a-border); transition: transform 0.3s, box-shadow 0.3s; cursor: pointer; }
        .aurora-ql-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(15,107,190,0.1); border-color: var(--a-blue); }
        .aurora-ql-card .ql-icon { font-size: 40px; margin-bottom: 14px; }
        .aurora-ql-card h3 { font-size: 16px; font-weight: 700; color: var(--a-blue); margin-bottom: 6px; }
        .aurora-ql-card p { font-size: 13px; color: var(--a-text-muted); }

        /* ═══ About / Welcome ═══ */
        .aurora-about { background: #fff; padding: 60px 24px; }
        .aurora-about-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .aurora-about h2 { font-size: 28px; font-weight: 700; color: var(--a-blue); margin-bottom: 16px; }
        .aurora-about p { color: var(--a-text-muted); font-size: 15px; line-height: 1.8; margin-bottom: 16px; }
        .aurora-about-image { background: linear-gradient(135deg, var(--a-blue) 0%, #1a7fd4 100%); border-radius: 16px; height: 320px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 64px; position: relative; overflow: hidden; }
        .aurora-about-image::after { content: "Founded 1710"; position: absolute; bottom: 16px; right: 20px; font-size: 13px; opacity: 0.6; font-weight: 500; }

        /* ═══ Contact Section ═══ */
        .aurora-contact { background: var(--a-cream); padding: 60px 24px; }
        .aurora-contact-inner { max-width: 1200px; margin: 0 auto; }
        .aurora-contact h2 { font-size: 28px; font-weight: 700; color: var(--a-blue); margin-bottom: 8px; }
        .aurora-contact .subtitle { color: var(--a-text-muted); font-size: 16px; margin-bottom: 40px; }
        .aurora-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .aurora-form-box { background: #fff; border-radius: 12px; padding: 32px; border: 1px solid var(--a-border); }
        .aurora-fg { margin-bottom: 20px; }
        .aurora-fg label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px; color: var(--a-text); }
        .aurora-fg .req { color: #e74c3c; }
        .aurora-fg input, .aurora-fg select, .aurora-fg textarea { width: 100%; padding: 12px 14px; border: 1px solid var(--a-border); border-radius: 8px; font-size: 14px; font-family: 'Montserrat', sans-serif; transition: border-color 0.2s; background: #fff; color: var(--a-text); }
        .aurora-fg input:focus, .aurora-fg select:focus, .aurora-fg textarea:focus { outline: none; border-color: var(--a-blue); box-shadow: 0 0 0 3px rgba(15,107,190,0.1); }
        .aurora-fg textarea { resize: vertical; min-height: 120px; }
        .aurora-cb { display: flex; align-items: flex-start; gap: 10px; }
        .aurora-cb input { width: auto; margin-top: 3px; }
        .aurora-cb label { font-weight: 400; font-size: 13px; color: var(--a-text-muted); }
        .aurora-submit { background: var(--a-blue); color: #fff; padding: 14px 32px; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.2s; font-family: 'Montserrat', sans-serif; }
        .aurora-submit:hover { background: var(--a-blue-dark); }

        .aurora-contact-info h3 { font-size: 20px; margin-bottom: 20px; color: var(--a-blue); }
        .aurora-cd { display: flex; gap: 14px; margin-bottom: 16px; padding: 18px; background: #fff; border-radius: 10px; border: 1px solid var(--a-border); }
        .aurora-cd .icon { font-size: 22px; flex-shrink: 0; }
        .aurora-cd .text { font-size: 14px; color: var(--a-text); }
        .aurora-cd .text strong { display: block; font-size: 12px; color: var(--a-text-muted); margin-bottom: 2px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }

        /* ═══ Admissions ═══ */
        .aurora-admissions { background: #fff; padding: 60px 24px; }
        .aurora-admissions-inner { max-width: 700px; margin: 0 auto; }
        .aurora-admissions h2 { font-size: 28px; font-weight: 700; color: var(--a-blue); margin-bottom: 8px; text-align: center; }
        .aurora-admissions .subtitle { color: var(--a-text-muted); font-size: 16px; margin-bottom: 40px; text-align: center; }
        .aurora-admissions-form { background: var(--a-cream); border-radius: 12px; padding: 32px; border: 1px solid var(--a-border); }
        .aurora-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        /* ═══ Footer ═══ */
        .aurora-footer { background: #0a2a47; color: rgba(255,255,255,0.7); padding: 48px 24px 24px; }
        .aurora-footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 40px; }
        .aurora-footer h4 { color: var(--a-gold); margin-bottom: 14px; font-size: 15px; font-weight: 600; }
        .aurora-footer p, .aurora-footer a { font-size: 13px; line-height: 1.9; color: rgba(255,255,255,0.65); }
        .aurora-footer a:hover { color: var(--a-gold); }
        .aurora-footer-bottom { max-width: 1200px; margin: 24px auto 0; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; text-align: center; color: rgba(255,255,255,0.4); }

        /* ═══ Demo Panel ═══ */
        .demo-panel { position: fixed; top: 16px; right: 16px; z-index: 100000; background: #111; color: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 8px 40px rgba(0,0,0,0.3); width: 280px; font-size: 13px; transition: transform 0.3s; font-family: 'Montserrat', sans-serif; }
        .demo-panel.collapsed { transform: translateX(calc(100% + 32px)); }
        .demo-panel h4 { font-size: 14px; margin-bottom: 12px; color: var(--a-gold); }
        .demo-toggle-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .demo-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .demo-badge.on { background: #10b981; color: #fff; }
        .demo-badge.off { background: #374151; color: #9ca3af; }
        .demo-switch { width: 44px; height: 24px; background: #374151; border-radius: 12px; position: relative; cursor: pointer; transition: background 0.3s; flex-shrink: 0; }
        .demo-switch.on { background: #10b981; }
        .demo-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: transform 0.3s; }
        .demo-switch.on::after { transform: translateX(20px); }
        .demo-select { width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #fff; font-size: 13px; margin-top: 8px; font-family: 'Montserrat', sans-serif; }
        .demo-note { color: #9ca3af; font-size: 11px; margin-top: 12px; line-height: 1.6; }
        .demo-panel-btn { position: fixed; top: 16px; right: 16px; z-index: 100001; background: #111; color: var(--a-gold); border: none; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; font-family: 'Montserrat', sans-serif; }

        /* ═══ Event Log ═══ */
        .demo-log { position: fixed; bottom: 0; left: 0; right: 0; height: 0; background: #111; color: #0f0; font-family: "Courier New", monospace; font-size: 11px; overflow-y: auto; transition: height 0.3s; z-index: 99999; padding: 0; }
        .demo-log.open { height: 180px; padding: 12px; }
        .demo-log-btn { position: fixed; bottom: 8px; left: 8px; z-index: 100000; background: #111; color: #0f0; border: 1px solid #333; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; font-family: monospace; }

        @media (max-width: 768px) {
          .aurora-hero h2 { font-size: 28px; }
          .aurora-values-grid { grid-template-columns: repeat(3, 1fr); }
          .aurora-info-grid { grid-template-columns: repeat(2, 1fr); }
          .aurora-ql-grid { grid-template-columns: repeat(2, 1fr); }
          .aurora-form-grid, .aurora-form-row, .aurora-about-inner { grid-template-columns: 1fr; }
          .aurora-footer-inner { grid-template-columns: 1fr; }
        }
      `,
        }}
      />

      <div className="aurora-site">
        {/* ═══ Header ═══ */}
        <header className="aurora-header">
          <div className="aurora-header-top">
            <div className="aurora-crest">AP</div>
            <div className="aurora-name">
              <h1>Aurora Primary School</h1>
              <p>LEARN &middot; LOVE &middot; GROW</p>
            </div>
            <a href="#admissions" className="aurora-header-cta">
              Book a Visit
            </a>
          </div>
          <nav className="aurora-nav">
            <div className="aurora-nav-inner">
              <a href="#" className="active">
                Home
              </a>
              <a href="#about">Our School</a>
              <a href="#admissions">Admissions</a>
              <a href="#values">Our Values</a>
              <a href="#contact">Parents</a>
              <a href="#contact">Contact Us</a>
              <a href="#admissions" style={{ color: "var(--a-gold)" }}>
                Open Days
              </a>
            </div>
          </nav>
        </header>

        {/* ═══ Hero ═══ */}
        <section className="aurora-hero">
          <div className="aurora-hero-motto">
            Learn &middot; Love &middot; Grow
          </div>
          <h2>Welcome to Aurora Primary</h2>
          <p>
            A warm, inclusive Church of England primary school in the heart of
            our community — where every child is known, valued, and inspired to
            flourish.
          </p>
          <div className="aurora-hero-buttons">
            <a href="#admissions" className="aurora-btn aurora-btn-gold">
              Arrange a Visit
            </a>
            <a href="#about" className="aurora-btn aurora-btn-outline">
              Discover Our School
            </a>
          </div>
        </section>

        {/* ═══ Key Info Strip ═══ */}
        <section className="aurora-info-strip">
          <div className="aurora-info-grid">
            <div className="aurora-info-item">
              <div className="number">Good</div>
              <div className="label">Ofsted Rating</div>
            </div>
            <div className="aurora-info-item">
              <div className="number">210</div>
              <div className="label">Pupils on Roll</div>
            </div>
            <div className="aurora-info-item">
              <div className="number">Est. 1710</div>
              <div className="label">Over 300 Years of Learning</div>
            </div>
            <div className="aurora-info-item">
              <div className="number">97%</div>
              <div className="label">Parent Satisfaction</div>
            </div>
          </div>
        </section>

        {/* ═══ Values ═══ */}
        <section className="aurora-values" id="values">
          <div className="aurora-values-inner">
            <h2>Our Christian Values</h2>
            <p className="subtitle">At the heart of everything we do</p>
            <div className="aurora-values-grid">
              <div className="aurora-value-card">
                <div className="aurora-value-icon">🙏</div>
                <h3>Thankfulness</h3>
              </div>
              <div className="aurora-value-card">
                <div className="aurora-value-icon">💎</div>
                <h3>Honesty</h3>
              </div>
              <div className="aurora-value-card">
                <div className="aurora-value-icon">⚖️</div>
                <h3>Fairness</h3>
              </div>
              <div className="aurora-value-card">
                <div className="aurora-value-icon">💪</div>
                <h3>Endurance</h3>
              </div>
              <div className="aurora-value-card">
                <div className="aurora-value-icon">❤️</div>
                <h3>Love &amp; Friendship</h3>
              </div>
              <div className="aurora-value-card">
                <div className="aurora-value-icon">🤝</div>
                <h3>Respect</h3>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Quick Links ═══ */}
        <section className="aurora-quicklinks">
          <h2>For Parents</h2>
          <p className="subtitle">Everything you need in one place</p>
          <div className="aurora-ql-grid">
            <div className="aurora-ql-card">
              <div className="ql-icon">📅</div>
              <h3>Diary Dates</h3>
              <p>Term dates, events, and key school dates</p>
            </div>
            <div className="aurora-ql-card">
              <div className="ql-icon">📋</div>
              <h3>Useful Forms</h3>
              <p>Permission slips, absence forms, and more</p>
            </div>
            <div className="aurora-ql-card">
              <div className="ql-icon">📰</div>
              <h3>Newsletters</h3>
              <p>Weekly updates from the headteacher</p>
            </div>
            <div className="aurora-ql-card">
              <div className="ql-icon">📚</div>
              <h3>Homework</h3>
              <p>Homework schedules and resources</p>
            </div>
          </div>
        </section>

        {/* ═══ About ═══ */}
        <section className="aurora-about" id="about">
          <div className="aurora-about-inner">
            <div>
              <h2>Discover Aurora Primary</h2>
              <p>
                Aurora Primary School has been at the heart of our village
                community for over 300 years. Originally founded as the
                &apos;Old Town School&apos; in 1710, our school has grown into a
                thriving Church of England primary where children learn, love,
                and grow together.
              </p>
              <p>
                We maintain close links with our local parish church, and our
                Christian values of thankfulness, honesty, fairness, endurance,
                love and friendship, and respect are woven into every aspect of
                school life.
              </p>
              <p>
                With a broad curriculum covering EYFS through to Year 6,
                specialist outdoor learning provision, and over 15 after-school
                clubs, every child has the opportunity to discover their
                passions and develop their God-given potential.
              </p>
            </div>
            <div className="aurora-about-image">⛪</div>
          </div>
        </section>

        {/* ═══ Contact Form ═══ */}
        <section className="aurora-contact" id="contact">
          <div className="aurora-contact-inner">
            <h2>Get in Touch</h2>
            <p className="subtitle">
              We&apos;d love to hear from you — contact the school office or
              send us a message
            </p>
            <div className="aurora-form-grid">
              <div className="aurora-form-box">
                <form id="contact-form" action="#" method="post">
                  <input
                    type="hidden"
                    name="csrf_token"
                    defaultValue="demo-csrf-token"
                  />
                  <div className="aurora-fg">
                    <label htmlFor="contact_name">
                      Your Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="contact_name"
                      name="contact_name"
                      required
                      placeholder="e.g. Sarah Johnson"
                    />
                  </div>
                  <div className="aurora-fg">
                    <label htmlFor="contact_email">
                      Email Address <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      id="contact_email"
                      name="contact_email"
                      required
                      placeholder="e.g. parent@example.com"
                    />
                  </div>
                  <div className="aurora-fg">
                    <label htmlFor="contact_phone">Phone Number</label>
                    <input
                      type="tel"
                      id="contact_phone"
                      name="contact_phone"
                      placeholder="e.g. 0113 250 4201"
                    />
                  </div>
                  <div className="aurora-fg">
                    <label htmlFor="contact_subject">
                      Subject <span className="req">*</span>
                    </label>
                    <select
                      id="contact_subject"
                      name="contact_subject"
                      required
                    >
                      <option value="">-- Please select --</option>
                      <option value="general">General Enquiry</option>
                      <option value="admissions">Admissions</option>
                      <option value="absence">Reporting an Absence</option>
                      <option value="sen">SEND Support</option>
                      <option value="clubs">After School Clubs</option>
                      <option value="pta">PTA</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="aurora-fg">
                    <label htmlFor="contact_message">
                      Your Message <span className="req">*</span>
                    </label>
                    <textarea
                      id="contact_message"
                      name="contact_message"
                      required
                      placeholder="How can we help?"
                    />
                  </div>
                  <div className="aurora-fg">
                    <div className="aurora-cb">
                      <input
                        type="checkbox"
                        id="contact_gdpr"
                        name="contact_gdpr"
                      />
                      <label htmlFor="contact_gdpr">
                        I consent to Aurora Primary processing my data to
                        respond to this enquiry.{" "}
                        <a
                          href="#"
                          style={{
                            color: "var(--a-blue)",
                            textDecoration: "underline",
                          }}
                        >
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                  </div>
                  <button type="submit" className="aurora-submit">
                    Send Message
                  </button>
                </form>
              </div>

              <div className="aurora-contact-info">
                <h3>Contact Details</h3>
                <div className="aurora-cd">
                  <span className="icon">📍</span>
                  <div className="text">
                    <strong>Address</strong>
                    Aurora Primary School
                    <br />
                    Town Street, Leeds
                    <br />
                    West Yorkshire, LS19 6PP
                  </div>
                </div>
                <div className="aurora-cd">
                  <span className="icon">📞</span>
                  <div className="text">
                    <strong>Telephone</strong>
                    0113 250 4201
                  </div>
                </div>
                <div className="aurora-cd">
                  <span className="icon">✉️</span>
                  <div className="text">
                    <strong>Email</strong>
                    office@auroraprimary.org.uk
                  </div>
                </div>
                <div className="aurora-cd">
                  <span className="icon">🕒</span>
                  <div className="text">
                    <strong>Office Hours</strong>
                    Monday - Friday: 8:00am - 4:00pm
                    <br />
                    Term time only
                  </div>
                </div>
                <div className="aurora-cd">
                  <span className="icon">📅</span>
                  <div className="text">
                    <strong>Next Open Day</strong>
                    Thursday 20th March 2026, 9:30am
                    <br />
                    <a
                      href="#admissions"
                      style={{
                        color: "var(--a-blue)",
                        textDecoration: "underline",
                      }}
                    >
                      Book your place
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Admissions ═══ */}
        <section className="aurora-admissions" id="admissions">
          <div className="aurora-admissions-inner">
            <h2>Admissions Enquiry</h2>
            <p className="subtitle">
              Start your child&apos;s journey at Aurora Primary
            </p>
            <div className="aurora-admissions-form">
              <form id="admissions-form" action="#" method="post">
                <input
                  type="hidden"
                  name="csrf_token"
                  defaultValue="demo-csrf-admissions"
                />
                <div className="aurora-form-row">
                  <div className="aurora-fg">
                    <label htmlFor="parent_name">
                      Parent/Carer Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="parent_name"
                      name="parent_name"
                      required
                    />
                  </div>
                  <div className="aurora-fg">
                    <label htmlFor="parent_email">
                      Email <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      id="parent_email"
                      name="parent_email"
                      required
                    />
                  </div>
                </div>
                <div className="aurora-form-row">
                  <div className="aurora-fg">
                    <label htmlFor="parent_phone">
                      Phone Number <span className="req">*</span>
                    </label>
                    <input
                      type="tel"
                      id="parent_phone"
                      name="parent_phone"
                      required
                    />
                  </div>
                  <div className="aurora-fg">
                    <label htmlFor="child_dob">
                      Child&apos;s Date of Birth <span className="req">*</span>
                    </label>
                    <input
                      type="date"
                      id="child_dob"
                      name="child_dob"
                      required
                    />
                  </div>
                </div>
                <div className="aurora-form-row">
                  <div className="aurora-fg">
                    <label htmlFor="child_name">
                      Child&apos;s Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="child_name"
                      name="child_name"
                      required
                    />
                  </div>
                  <div className="aurora-fg">
                    <label htmlFor="entry_year">Preferred Entry Year</label>
                    <select id="entry_year" name="entry_year">
                      <option value="">-- Please select --</option>
                      <option value="reception">
                        Reception (September 2026)
                      </option>
                      <option value="year1">Year 1</option>
                      <option value="year2">Year 2</option>
                      <option value="year3">Year 3</option>
                      <option value="year4">Year 4</option>
                      <option value="year5">Year 5</option>
                      <option value="year6">Year 6</option>
                    </select>
                  </div>
                </div>
                <div className="aurora-fg">
                  <label htmlFor="siblings">Siblings at Aurora Primary?</label>
                  <select id="siblings" name="siblings">
                    <option value="">-- Please select --</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="aurora-fg">
                  <label htmlFor="faith">Faith Background</label>
                  <select id="faith" name="faith">
                    <option value="">-- Prefer not to say --</option>
                    <option value="coe">Church of England</option>
                    <option value="catholic">Roman Catholic</option>
                    <option value="other_christian">Other Christian</option>
                    <option value="other_faith">Other Faith</option>
                    <option value="none">No Faith</option>
                  </select>
                </div>
                <div className="aurora-fg">
                  <label htmlFor="additional_info">
                    Anything else we should know?
                  </label>
                  <textarea
                    id="additional_info"
                    name="additional_info"
                    placeholder="e.g. SEND needs, medical conditions, specific questions..."
                  />
                </div>
                <div className="aurora-fg">
                  <div className="aurora-cb">
                    <input
                      type="checkbox"
                      id="visit_request"
                      name="visit_request"
                    />
                    <label htmlFor="visit_request">
                      I would like to book a school visit
                    </label>
                  </div>
                </div>
                <div className="aurora-fg">
                  <div className="aurora-cb">
                    <input
                      type="checkbox"
                      id="admissions_gdpr"
                      name="admissions_gdpr"
                      required
                    />
                    <label htmlFor="admissions_gdpr">
                      I consent to my data being processed for admissions
                      purposes. <span className="req">*</span>
                    </label>
                  </div>
                </div>
                <button type="submit" className="aurora-submit">
                  Submit Enquiry
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ═══ Footer ═══ */}
        <footer className="aurora-footer">
          <div className="aurora-footer-inner">
            <div>
              <h4>Aurora Primary School</h4>
              <p>Town Street, Leeds, West Yorkshire, LS19 6PP</p>
              <p>Tel: 0113 250 4201</p>
              <p>Email: office@auroraprimary.org.uk</p>
              <p style={{ marginTop: 12, fontSize: 11, opacity: 0.5 }}>
                A Church of England primary school
              </p>
            </div>
            <div>
              <h4>Quick Links</h4>
              <p>
                <a href="#">Term Dates</a>
              </p>
              <p>
                <a href="#">School Uniform</a>
              </p>
              <p>
                <a href="#">School Meals</a>
              </p>
              <p>
                <a href="#">After School Clubs</a>
              </p>
              <p>
                <a href="#">PTA</a>
              </p>
            </div>
            <div>
              <h4>Policies</h4>
              <p>
                <a href="#">Safeguarding</a>
              </p>
              <p>
                <a href="#">SEND Policy</a>
              </p>
              <p>
                <a href="#">Behaviour Policy</a>
              </p>
              <p>
                <a href="#">Privacy Notice</a>
              </p>
              <p>
                <a href="#">Accessibility</a>
              </p>
            </div>
          </div>
          <div className="aurora-footer-bottom">
            &copy; 2026 Aurora Primary School. All rights reserved. | Powered by{" "}
            <strong style={{ color: "var(--a-gold)" }}>Schoolgle</strong>
          </div>
        </footer>
      </div>

      {/* ═══ Demo Panel ═══ */}
      <button
        className="demo-panel-btn"
        onClick={() => setPanelVisible(!panelVisible)}
      >
        {panelVisible ? "Ed Demo" : "Show Panel"}
      </button>

      <div className={`demo-panel ${panelVisible ? "" : "collapsed"}`}>
        <h4>Ed Widget Demo</h4>

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

        <div>
          <label style={{ fontSize: 12, color: "#9ca3af" }}>Ed Mode:</label>
          <select className="demo-select" id="ed-mode">
            <option value="website">Website (Public Visitors)</option>
            <option value="support">Support (Pre-Login)</option>
            <option value="school">School (Logged-In Staff)</option>
          </select>
        </div>

        <p className="demo-note">
          <strong>Try asking Ed:</strong>
          <br />
          &bull; &quot;What are the school values?&quot;
          <br />
          &bull; &quot;How do I apply for a place?&quot;
          <br />
          &bull; &quot;What time does school start?&quot;
          <br />
          &bull; &quot;Help me fill the contact form&quot;
          <br />
          &bull; &quot;What clubs do you offer?&quot;
          <br />
          <br />
          Toggle OFF to remove Ed completely.
        </p>
      </div>

      {/* ═══ Event Log ═══ */}
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
