"use client";

import Link from "next/link";

/**
 * Demo Hub — links to all Ed demo scenarios
 * Access: /demo
 */
export default function DemoHubPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a14",
        color: "#fff",
        fontFamily: "'Montserrat', -apple-system, sans-serif",
        padding: "60px 24px",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(206,152,62,0.1)",
              border: "1px solid rgba(206,152,62,0.3)",
              borderRadius: 40,
              padding: "8px 20px",
              marginBottom: 24,
              fontSize: 13,
              fontWeight: 600,
              color: "#CE983E",
              letterSpacing: 1,
            }}
          >
            INTERNAL DEMO
          </div>
          <h1
            style={{
              fontSize: 42,
              fontWeight: 800,
              marginBottom: 16,
              background: "linear-gradient(135deg, #0F6BBE, #CE983E)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Ed Assistant Demos
          </h1>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.6)",
              maxWidth: 600,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Three scenarios showing how Ed transforms school communication —
            from website visitors to form filling in any language.
          </p>
        </div>

        {/* Demo Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
          }}
        >
          {/* Demo 1: School Website */}
          <Link href="/demo/school" style={{ textDecoration: "none" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #0F6BBE22, #0F6BBE08)",
                border: "1px solid rgba(15,107,190,0.3)",
                borderRadius: 16,
                padding: 32,
                transition: "transform 0.3s, box-shadow 0.3s",
                cursor: "pointer",
                height: "100%",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 40px rgba(15,107,190,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>🏫</div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0F6BBE",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                DEMO 1
              </div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 10,
                }}
              >
                School Website
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1.7,
                }}
              >
                Aurora Primary School website with Ed embedded. Parents can ask
                about admissions, values, term dates, and Ed helps fill contact
                forms with voice.
              </p>
              <div
                style={{
                  marginTop: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0F6BBE",
                }}
              >
                Launch Demo &rarr;
              </div>
            </div>
          </Link>

          {/* Demo 2: Form Filler */}
          <Link href="/demo/form" style={{ textDecoration: "none" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #CE983E22, #CE983E08)",
                border: "1px solid rgba(206,152,62,0.3)",
                borderRadius: 16,
                padding: 32,
                transition: "transform 0.3s, box-shadow 0.3s",
                cursor: "pointer",
                height: "100%",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 40px rgba(206,152,62,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>🌍</div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#CE983E",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                DEMO 2
              </div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 10,
                }}
              >
                Multilingual Form Filler
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1.7,
                }}
              >
                Absence request form. Ed fills it via natural language in
                English, Urdu, Polish, or any language — translating and
                flagging attendance risks.
              </p>
              <div
                style={{
                  marginTop: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#CE983E",
                }}
              >
                Launch Demo &rarr;
              </div>
            </div>
          </Link>

          {/* Demo 3: In-App (links to dashboard where Ed is already live) */}
          <Link href="/login" style={{ textDecoration: "none" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #10b98122, #10b98108)",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 16,
                padding: 32,
                transition: "transform 0.3s, box-shadow 0.3s",
                cursor: "pointer",
                height: "100%",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 40px rgba(16,185,129,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#10b981",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                DEMO 3
              </div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: 10,
                }}
              >
                In-App Assistant
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1.7,
                }}
              >
                Ed inside the Schoolgle dashboard — helping staff with estates
                compliance, raising helpdesk tickets, and navigating modules
                with voice. Sign in to try it live.
              </p>
              <div
                style={{
                  marginTop: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#10b981",
                }}
              >
                Sign In to Try &rarr;
              </div>
            </div>
          </Link>
        </div>

        {/* Footer note */}
        <div
          style={{
            textAlign: "center",
            marginTop: 60,
            fontSize: 13,
            color: "rgba(255,255,255,0.3)",
          }}
        >
          <p>
            Aurora Primary School is a fictional demo school.
            <br />
            Built with{" "}
            <span style={{ color: "#CE983E", fontWeight: 600 }}>
              Schoolgle
            </span>{" "}
            &middot; Ed Assistant v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
