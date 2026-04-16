"use client";

export default function TypingIndicator() {
  return (
    <div className="fade-in" style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 24 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: "var(--bg2)", border: "1px solid var(--line2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: 2,
      }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="3" stroke="var(--text)" strokeWidth="1.3"/>
          <path d="M5 8h6M5 5.5h3.5M5 10.5h4.5" stroke="var(--text)" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </div>
      <div>
        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text3)", display: "block", marginBottom: 6 }}>DocMind</span>
        <div style={{
          padding: "13px 16px",
          borderRadius: "3px 12px 12px 12px",
          background: "var(--bg2)",
          border: "1px solid var(--line)",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </div>
    </div>
  );
}
