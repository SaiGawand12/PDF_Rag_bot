"use client";

import { useRef, useState, useEffect } from "react";
import { UploadedFile, ChatSession } from "@/types";

const API = "http://localhost:5000";

interface Props {
  sessionId: number | null;
  files: UploadedFile[];
  onUpload: (f: File) => Promise<void>;
  onDelete: (name: string) => void;
  onClearChat: () => void;
  onNewChat: () => void;
  onSelectSession: (s: ChatSession) => void;
  uploading: boolean;
  open: boolean;
  onClose: () => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function SidebarContent({ sessionId, files, onUpload, onDelete, onClearChat, onNewChat, onSelectSession, uploading, onClose }: Omit<Props, "open">) {
  const [drag, setDrag] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [tab, setTab] = useState<"files" | "history">("files");
  const ref = useRef<HTMLInputElement>(null);

  const handle = (f: File) => { if (f.type === "application/pdf") { onUpload(f); onClose(); } };
  const fmt = (b: number) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;

  const loadSessions = async () => {
    try {
      const res = await fetch(`${API}/api/sessions`);
      const data = await res.json();
      setSessions(data);
    } catch {}
  };

  useEffect(() => { loadSessions(); }, []);

  const deleteSession = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`${API}/api/sessions/${id}`, { method: "DELETE" });
    loadSessions();
    if (id === sessionId) onNewChat();
  };

  return (
    <>
      {/* Logo + New Chat */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--white)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M4 5h12M4 8.5h8M4 12h10M4 15.5h6" stroke="#141414" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--white)", letterSpacing: "-0.3px" }}>DocMind</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onNewChat} title="New chat" style={{ width: 28, height: 28, borderRadius: 7, background: "var(--bg3)", border: "1px solid var(--line)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text2)" }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", padding: "10px 12px 0", gap: 4, flexShrink: 0 }}>
        {(["files", "history"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); if (t === "history") loadSessions(); }}
            style={{ flex: 1, padding: "6px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s", background: tab === t ? "var(--bg3)" : "transparent", color: tab === t ? "var(--text)" : "var(--text3)", textTransform: "capitalize" }}>
            {t === "files" ? "Documents" : "History"}
          </button>
        ))}
      </div>

      {tab === "files" ? (
        <>
          {/* Upload zone */}
          <div style={{ padding: "10px 12px 8px", flexShrink: 0 }}>
            <div onClick={() => !uploading && ref.current?.click()}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
              style={{ border: `1.5px dashed ${drag ? "rgba(255,255,255,0.3)" : "var(--line2)"}`, borderRadius: 10, padding: "16px 12px", cursor: uploading ? "default" : "pointer", background: drag ? "var(--bg2)" : "var(--bg)", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
              {uploading ? (
                <>
                  <div style={{ width: 20, height: 20, border: "2px solid var(--bg4)", borderTopColor: "var(--text2)", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
                  <span style={{ fontSize: 11, color: "var(--text2)" }}>Processing…</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M10 13V4M10 4L7 7M10 4l3 3" stroke={drag ? "var(--text)" : "var(--text2)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 14v1.5A1.5 1.5 0 004.5 17h11a1.5 1.5 0 001.5-1.5V14" stroke={drag ? "var(--text)" : "var(--text2)"} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p style={{ fontSize: 11, fontWeight: 600, color: drag ? "var(--text)" : "var(--text2)" }}>{drag ? "Release to upload" : "Drop PDF or click"}</p>
                </>
              )}
            </div>
            <input ref={ref} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handle(e.target.files[0])} />
          </div>

          <div style={{ height: 1, background: "var(--line)", margin: "0 12px", flexShrink: 0 }} />

          {/* Files */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              Documents {files.length > 0 && `— ${files.length}`}
            </p>
            {files.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--text3)", padding: "8px 0" }}>No documents yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {files.map((f, i) => (
                  <div key={i} className="fade-up" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "var(--bg2)", border: "1px solid var(--line)" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: "var(--bg3)", border: "1px solid var(--line2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                        <path d="M9.5 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5.5L9.5 1z" stroke="var(--text2)" strokeWidth="1.2" strokeLinejoin="round"/>
                        <path d="M9.5 1v4.5H14" stroke="var(--text2)" strokeWidth="1.2" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                      <p style={{ fontSize: 10, color: "var(--text3)", marginTop: 1 }}>{fmt(f.size)}</p>
                    </div>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
                    <button onClick={() => onDelete(f.name)} style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "var(--text3)"; }}>
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4h12M5 4V2.5h6V4M6.5 7v5M9.5 7v5M3 4l.9 8.5a1 1 0 001 .9h6.2a1 1 0 001-.9L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: "8px 12px 14px", borderTop: "1px solid var(--line)", flexShrink: 0 }}>
            <button onClick={onClearChat} style={{ width: "100%", padding: "7px 12px", borderRadius: 8, background: "transparent", border: "1px solid var(--line)", color: "var(--text3)", fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s", fontFamily: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(248,113,113,0.4)"; e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.background = "rgba(248,113,113,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.background = "transparent"; }}>
              Clear conversation
            </button>
          </div>
        </>
      ) : (
        /* History tab */
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
          {sessions.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--text3)", padding: "12px 0" }}>No history yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {sessions.map(s => (
                <div key={s.id} onClick={() => { onSelectSession(s); onClose(); }}
                  style={{ padding: "9px 10px", borderRadius: 8, cursor: "pointer", border: `1px solid ${s.id === sessionId ? "var(--line2)" : "transparent"}`, background: s.id === sessionId ? "var(--bg3)" : "transparent", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 8 }}
                  onMouseEnter={e => { if (s.id !== sessionId) e.currentTarget.style.background = "var(--bg2)"; }}
                  onMouseLeave={e => { if (s.id !== sessionId) e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</p>
                    <p style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>
                      {s.files.length} file{s.files.length !== 1 ? "s" : ""} · {timeAgo(s.updated_at)}
                    </p>
                  </div>
                  <button onClick={e => deleteSession(s.id, e)} style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", opacity: 0.6 }}
                    onMouseEnter={e => { e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.opacity = "0.6"; }}>
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4h12M5 4V2.5h6V4M6.5 7v5M9.5 7v5M3 4l.9 8.5a1 1 0 001 .9h6.2a1 1 0 001-.9L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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

  if (!isMobile) {
    return (
      <aside style={{ width: 252, minWidth: 252, display: "flex", flexDirection: "column", background: "var(--bg1)", borderRight: "1px solid var(--line)" }}>
        <SidebarContent {...props} onClose={() => {}} />
      </aside>
    );
  }

  return (
    <>
      {open && (
        <>
          <div className="overlay" onClick={onClose} />
          <div className="sheet">
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
