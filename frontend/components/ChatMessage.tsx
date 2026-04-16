"use client";

import { Message } from "@/types";

interface Props { message: Message; index: number; isMobile?: boolean; }

function renderContent(text: string) {
  const parts = text.split(/(\[Page \d+\])/g);
  return parts.map((part, i) => {
    const m = part.match(/\[Page (\d+)\]/);
    if (m) {
      return (
        <span key={i} style={{
          display: "inline-flex", alignItems: "center",
          background: "var(--bg3)", border: "1px solid var(--line2)",
          color: "var(--text2)", fontSize: 10, fontWeight: 600,
          padding: "1px 6px", borderRadius: 4, margin: "0 2px",
          letterSpacing: "0.02em", verticalAlign: "middle",
        }}>pg.{m[1]}</span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatMessage({ message, index, isMobile }: Props) {
  const isUser = message.role === "user";

  return (
    <div className="fade-up" style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-start",
      gap: isMobile ? 8 : 12,
      marginBottom: isMobile ? 16 : 24,
      animationDelay: `${Math.min(index * 0.03, 0.15)}s`,
      animationFillMode: "forwards",
    }}>
      {/* Avatar — hidden on mobile to save space */}
      {!isMobile && (
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: isUser ? "var(--bg3)" : "var(--bg2)",
          border: "1px solid var(--line2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginTop: 2,
        }}>
          {isUser ? (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5.5" r="2.5" stroke="var(--text2)" strokeWidth="1.3"/>
              <path d="M2.5 14c0-2.761 2.462-5 5.5-5s5.5 2.239 5.5 5" stroke="var(--text2)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="3" stroke="var(--text)" strokeWidth="1.3"/>
              <path d="M5 8h6M5 5.5h3.5M5 10.5h4.5" stroke="var(--text)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          )}
        </div>
      )}

      <div style={{ maxWidth: isMobile ? "85%" : "74%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text3)", marginBottom: 5 }}>
          {isUser ? "You" : "DocMind"}
          <span style={{ fontWeight: 400, marginLeft: 6 }}>
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </span>
        <div style={{
          padding: isMobile ? "9px 12px" : "11px 15px",
          borderRadius: isUser ? "12px 3px 12px 12px" : "3px 12px 12px 12px",
          background: isUser ? "var(--bg3)" : "var(--bg2)",
          border: "1px solid var(--line)",
          color: "var(--text)",
          fontSize: isMobile ? 13 : 13.5,
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {isUser ? message.text : renderContent(message.text)}
        </div>
      </div>
    </div>
  );
}
