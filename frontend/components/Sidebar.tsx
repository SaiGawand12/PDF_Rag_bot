"use client";

import { useRef, useState, useEffect } from "react";
import { UploadedFile } from "@/types";

interface Props {
  files: UploadedFile[];
  onUpload: (f: File) => Promise<void>;
  onDelete: (name: string) => void;
  onClearChat: () => void;
  uploading: boolean;
  open: boolean;
  onClose: () => void;
}

function SidebarContent({ files, onUpload, onDelete, onClearChat, uploading, onClose }: Omit<Props, "open">) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handle = (f: File) => { if (f.type === "application/pdf") { onUpload(f); onClose(); } };
  const fmt = (b: number) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

  return (
    <>
      {/* Logo */}
      <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M4 5h12M4 8.5h8M4 12h10M4 15.5h6" stroke="#141414" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--white)", letterSpacing: "-0.3px", lineHeight: 1 }}>DocMind</div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>PDF AI Assistant</div>
          </div>
        </div>
        {/* Close button — visible on mobile */}
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4, display: "flex", alignItems: "center" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Upload zone */}
      <div style={{ padding: "12px 14px 10px", flexShrink: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>Upload</p>
        <div
          onClick={() => !uploading && ref.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
          style={{
            border: `1.5px dashed ${drag ? "rgba(255,255,255,0.3)" : "var(--line2)"}`,
            borderRadius: 10, padding: "18px 12px",
            cursor: uploading ? "default" : "pointer",
            background: drag ? "var(--bg2)" : "var(--bg)",
            transition: "all 0.15s",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          }}
        >
          {uploading ? (
            <>
              <div style={{ width: 20, height: 20, border: "2px solid var(--bg4)", borderTopColor: "var(--text2)", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
              <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500 }}>Processing PDF…</span>
            </>
          ) : (
            <>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: drag ? "var(--bg3)" : "var(--bg2)", border: "1px solid var(--line2)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M10 13V4M10 4L7 7M10 4l3 3" stroke={drag ? "var(--text)" : "var(--text2)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 14v1.5A1.5 1.5 0 004.5 17h11a1.5 1.5 0 001.5-1.5V14" stroke={drag ? "var(--text)" : "var(--text2)"} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: drag ? "var(--text)" : "var(--text2)" }}>{drag ? "Release to upload" : "Drop PDF here"}</p>
                <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>or click to browse</p>
              </div>
            </>
          )}
        </div>
        <input ref={ref} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handle(e.target.files[0])} />
      </div>

      <div style={{ height: 1, background: "var(--line)", margin: "0 14px", flexShrink: 0 }} />

      {/* Files list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>
          Documents {files.length > 0 && `— ${files.length}`}
        </p>
        {files.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--text3)", padding: "12px 0" }}>No documents yet</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {files.map((f, i) => (
              <div key={i} className="fade-up" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "var(--bg2)", border: "1px solid var(--line)", animationDelay: `${i * 0.05}s` }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: "var(--bg3)", border: "1px solid var(--line2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M9.5 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5.5L9.5 1z" stroke="var(--text2)" strokeWidth="1.2" strokeLinejoin="round"/>
                    <path d="M9.5 1v4.5H14" stroke="var(--text2)" strokeWidth="1.2" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                  <p style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>{fmt(f.size)}</p>
                </div>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
                <button onClick={() => onDelete(f.name)} title="Remove" style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0, background: "transparent", border: "1px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.1)"; e.currentTarget.style.color = "var(--red)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; }}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h12M5 4V2.5h6V4M6.5 7v5M9.5 7v5M3 4l.9 8.5a1 1 0 001 .9h6.2a1 1 0 001-.9L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "10px 14px 16px", borderTop: "1px solid var(--line)", flexShrink: 0 }}>
        <button onClick={onClearChat} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "transparent", border: "1px solid var(--line)", color: "var(--text3)", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s", fontFamily: "inherit" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(248,113,113,0.4)"; e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.background = "rgba(248,113,113,0.06)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.background = "transparent"; }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M5 4V2.5h6V4M6.5 7v5M9.5 7v5M3 4l.9 8.5a1 1 0 001 .9h6.2a1 1 0 001-.9L13 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Clear conversation
        </button>
      </div>
    </>
  );
}

export default function Sidebar(props: Props) {
  const { open, onClose } = props;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Desktop: always visible sidebar
  if (!isMobile) {
    return (
      <aside style={{ width: 252, minWidth: 252, display: "flex", flexDirection: "column", background: "var(--bg1)", borderRight: "1px solid var(--line)" }}>
        <SidebarContent {...props} onClose={() => {}} />
      </aside>
    );
  }

  // Mobile: bottom sheet with overlay
  return (
    <>
      {open && (
        <>
          <div className="overlay" onClick={onClose} />
          <div className="sheet">
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "var(--bg4)" }} />
            </div>
            <SidebarContent {...props} />
          </div>
        </>
      )}
    </>
  );
}
