"use client";

interface Props { onSuggest: (s: string) => void; hasFiles: boolean; isMobile?: boolean; }

const suggestions = [
  "Summarize the key concepts",
  "What are the main topics covered?",
  "List all important definitions",
  "What are the key takeaways?",
  "Explain the most complex section",
  "Give me a brief overview",
];

export default function EmptyState({ onSuggest, hasFiles, isMobile }: Props) {
  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: isMobile ? "24px 16px" : "40px 48px",
      maxWidth: 600, margin: "0 auto", width: "100%",
    }}>
      <div style={{
        width: isMobile ? 44 : 52, height: isMobile ? 44 : 52,
        background: "var(--bg2)", border: "1px solid var(--line2)",
        borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: isMobile ? 16 : 24,
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="var(--text2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h2 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.4px", marginBottom: 8, textAlign: "center" }}>
        {hasFiles ? "What do you want to know?" : "Upload a document to begin"}
      </h2>

      <p style={{ fontSize: isMobile ? 13 : 13.5, color: "var(--text2)", lineHeight: 1.7, textAlign: "center", maxWidth: 340, marginBottom: hasFiles ? (isMobile ? 20 : 32) : 16 }}>
        {hasFiles
          ? "Ask any question about your document. The AI searches through the content and answers based on what it finds."
          : "Tap the menu to upload a PDF. The AI will index it and answer your questions — everything runs locally."}
      </p>

      {hasFiles && (
        <div style={{ width: "100%" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>
            Try asking
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 6 : 8 }}>
            {(isMobile ? suggestions.slice(0, 4) : suggestions).map((s, i) => (
              <button key={i} onClick={() => onSuggest(s)} style={{
                padding: isMobile ? "10px 12px" : "11px 14px",
                borderRadius: 9, background: "var(--bg2)", border: "1px solid var(--line)",
                color: "var(--text2)", fontSize: isMobile ? 12 : 12.5,
                cursor: "pointer", textAlign: "left", lineHeight: 1.5,
                transition: "all 0.15s", fontFamily: "inherit",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--bg3)"; e.currentTarget.style.borderColor = "var(--line2)"; e.currentTarget.style.color = "var(--text)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--text2)"; }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {!hasFiles && !isMobile && (
        <div style={{ display: "flex", gap: 20, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {["FAISS vector search", "Flan-T5 model", "Runs 100% locally"].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text3)" }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--bg4)" }} />
              {t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
