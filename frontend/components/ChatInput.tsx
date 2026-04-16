"use client";

import { useState, useRef, KeyboardEvent, useEffect } from "react";

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
  hasContext: boolean;
  prefill?: string;
  isMobile?: boolean;
  onOpenSidebar?: () => void;
}

export default function ChatInput({ onSend, disabled, hasContext, prefill, isMobile, onOpenSidebar }: Props) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prefill) { setValue(prefill); ref.current?.focus(); }
  }, [prefill]);

  const send = () => {
    const t = value.trim();
    if (!t || disabled || !hasContext) return;
    onSend(t);
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, isMobile ? 100 : 120) + "px";
  };

  const canSend = !disabled && !!value.trim() && hasContext;

  return (
    <div style={{
      padding: isMobile ? "10px 12px 14px" : "14px 24px 18px",
      borderTop: "1px solid var(--line)",
      background: "var(--bg1)",
    }}>
      <div style={{
        display: "flex", alignItems: "flex-end", gap: 8,
        background: "var(--bg)",
        border: `1px solid ${focused ? "var(--line2)" : "var(--line)"}`,
        borderRadius: 12,
        padding: isMobile ? "8px 10px 8px 12px" : "10px 12px 10px 16px",
        transition: "border-color 0.15s",
      }}>
        {/* Mobile upload button */}
        {isMobile && (
          <button onClick={onOpenSidebar} style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: "var(--bg3)", border: "1px solid var(--line)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--text3)",
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 10V3M8 3L5 6M8 3l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 11v1.5A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5V11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        <textarea
          ref={ref}
          value={value}
          onChange={e => { setValue(e.target.value); resize(); }}
          onKeyDown={onKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled || !hasContext}
          placeholder={hasContext ? "Ask a question…" : "Upload a PDF to start"}
          rows={1}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "var(--text)", fontSize: isMobile ? 14 : 13.5,
            lineHeight: 1.6, resize: "none", fontFamily: "inherit",
            maxHeight: isMobile ? 100 : 120, overflowY: "auto", paddingTop: 2,
          }}
        />

        <button onClick={send} disabled={!canSend} style={{
          width: isMobile ? 36 : 34, height: isMobile ? 36 : 34,
          borderRadius: 8,
          background: canSend ? "var(--white)" : "var(--bg3)",
          border: `1px solid ${canSend ? "transparent" : "var(--line)"}`,
          cursor: canSend ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "all 0.15s",
        }}
          onMouseEnter={e => { if (canSend) e.currentTarget.style.background = "#e8e8e8"; }}
          onMouseLeave={e => { if (canSend) e.currentTarget.style.background = "var(--white)"; }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M14.5 1.5L1.5 6.5l5.5 2 2 5.5 5.5-12.5z" fill={canSend ? "#141414" : "var(--text3)"} />
          </svg>
        </button>
      </div>

      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, padding: "0 2px" }}>
          <span style={{ fontSize: 10, color: "var(--text3)" }}>Enter to send · Shift+Enter for new line</span>
          <span style={{ fontSize: 10, color: "var(--text3)" }}>Flan-T5 · FAISS · Local</span>
        </div>
      )}
    </div>
  );
}
