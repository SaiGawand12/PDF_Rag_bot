"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ChatMessage from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";
import ChatInput from "@/components/ChatInput";
import EmptyState from "@/components/EmptyState";
import { Message, UploadedFile } from "@/types";

const API = "http://localhost:5000";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [prefill, setPrefill] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const addMsg = (role: "user" | "bot", text: string) =>
    setMessages(p => [...p, { id: crypto.randomUUID(), role, text, timestamp: new Date() }]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("pdf", file);
      const res = await fetch(`${API}/api/upload`, { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const { job_id, filename } = await res.json();

      const poll = async (): Promise<void> => {
        const r = await fetch(`${API}/api/status/${job_id}`);
        const data = await r.json();
        if (data.status === "done") {
          setFiles(p => [...p, { name: filename, size: file.size, uploadedAt: new Date() }]);
          addMsg("bot", `"${filename}" has been indexed. Ask me anything about it.`);
          setUploading(false);
        } else if (data.status === "error") {
          addMsg("bot", `Failed to process "${filename}": ${data.error}`);
          setUploading(false);
        } else {
          setTimeout(poll, 1500);
        }
      };
      poll();
    } catch {
      addMsg("bot", "Upload failed. Make sure Flask is running on port 5000.");
      setUploading(false);
    }
  };

  const handleSend = async (text: string) => {
    addMsg("user", text);
    setLoading(true);
    setPrefill(undefined);
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      addMsg("bot", data.answer ?? "No response.");
    } catch {
      addMsg("bot", "Something went wrong. Is the Flask server running?");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    setFiles(p => p.filter(f => f.name !== filename));
    try {
      await fetch(`${API}/api/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
    } catch {}
  };

  const hasFiles = files.length > 0;

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
      <Sidebar
        files={files}
        onUpload={handleUpload}
        onDelete={handleDelete}
        onClearChat={() => setMessages([])}
        uploading={uploading}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)", minWidth: 0 }}>

        {/* Topbar */}
        <div style={{
          height: isMobile ? 52 : 50,
          padding: isMobile ? "0 16px" : "0 24px",
          borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {/* Mobile menu button */}
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text2)", padding: "4px", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
            {hasFiles ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M9.5 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V5.5L9.5 1z" stroke="var(--text2)" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M9.5 1v4.5H14" stroke="var(--text2)" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {files[files.length - 1].name}
                </span>
                {files.length > 1 && (
                  <span style={{ fontSize: 10, fontWeight: 600, background: "var(--bg3)", border: "1px solid var(--line)", color: "var(--text3)", padding: "1px 6px", borderRadius: 4, flexShrink: 0 }}>
                    +{files.length - 1}
                  </span>
                )}
              </div>
            ) : (
              <span style={{ fontSize: 13, color: "var(--text3)" }}>No document loaded</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
            <span style={{ fontSize: 11, color: "var(--text3)" }}>{isMobile ? "Local" : "Local · Private"}</span>
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "16px 14px" : "28px 32px" }}>
          {messages.length === 0 && !loading ? (
            <EmptyState hasFiles={hasFiles} onSuggest={s => setPrefill(s)} isMobile={isMobile} />
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessage key={msg.id} message={msg} index={i} isMobile={isMobile} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        <ChatInput
          onSend={handleSend}
          disabled={loading || uploading}
          hasContext={hasFiles}
          prefill={prefill}
          isMobile={isMobile}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      </div>
    </div>
  );
}
