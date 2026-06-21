import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";

const ACCENT_GRADIENT = "linear-gradient(135deg, #7C3AED 0%, #EC4899 50%, #F59E0B 100%)";

function GradientText({ children, style = {} }) {
  return (
    <span style={{
      background: ACCENT_GRADIENT,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      ...style
    }}>
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  const configs = {
    idle: { bg: "#F3F4F6", color: "#6B7280", label: "No video loaded" },
    uploading: { bg: "#EEF2FF", color: "#6366F1", label: "Uploading…" },
    processing: { bg: "#FEF3C7", color: "#D97706", label: "Generating transcript…" },
    ready: { bg: "#D1FAE5", color: "#059669", label: "Ready to query" },
    error: { bg: "#FEE2E2", color: "#DC2626", label: "Error occurred" },
  };
  const c = configs[status] || configs.idle;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: c.bg, color: c.color,
      fontSize: 12, fontWeight: 600, padding: "4px 10px",
      borderRadius: 20, letterSpacing: 0.3
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: c.color,
        animation: status === "uploading" || status === "processing" ? "pulse 1.2s infinite" : "none"
      }} />
      {c.label}
    </span>
  );
}

function VideoPlayer({ src, filename }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = val;
    setCurrentTime(val);
  };

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{
      background: "#0F0F1A", borderRadius: 16, overflow: "hidden",
      border: "1px solid rgba(124, 58, 237, 0.3)"
    }}>
      <video
        ref={videoRef}
        src={src}
        style={{ width: "100%", display: "block", maxHeight: 220, objectFit: "contain", background: "#000" }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setPlaying(false)}
      />
      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <button onClick={toggle} style={{
            width: 36, height: 36, borderRadius: "50%",
            background: ACCENT_GRADIENT, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            {playing
              ? <svg width="12" height="14" viewBox="0 0 12 14" fill="white"><rect x="0" y="0" width="4" height="14" rx="1" /><rect x="8" y="0" width="4" height="14" rx="1" /></svg>
              : <svg width="12" height="14" viewBox="0 0 12 14" fill="white"><polygon points="0,0 12,7 0,14" /></svg>
            }
          </button>
          <span style={{ fontSize: 12, color: "#9CA3AF", minWidth: 70 }}>
            {fmtTime(currentTime)} / {fmtTime(duration)}
          </span>
        </div>
        <input
          type="range" min={0} max={duration || 0} step={0.1}
          value={currentTime} onChange={handleSeek}
          style={{ width: "100%", accentColor: "#7C3AED", cursor: "pointer" }}
        />
        {filename && (
          <p style={{ fontSize: 11, color: "#6B7280", marginTop: 6, margin: "6px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {filename}
          </p>
        )}
      </div>
    </div>
  );
}

function TranscriptPanel({ transcript }) {
  if (!transcript) return null;
  return (
    <div style={{
      background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 12,
      padding: 16, height: 308, display: "flex", flexDirection: "column", boxSizing: "border-box"
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>
        Transcript
      </p>
      <pre style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace", flex: 1, overflowY: "auto" }}>
        {transcript}
      </pre>
    </div>
  );
}

function ChatBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 12
    }}>
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          background: ACCENT_GRADIENT, marginRight: 8, marginTop: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13
        }}>
          🎬
        </div>
      )}
      <div style={{
        maxWidth: "75%",
        background: isUser
          ? "linear-gradient(135deg, #7C3AED, #6D28D9)"
          : "#F9FAFB",
        color: isUser ? "#fff" : "#111827",
        padding: "10px 14px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        fontSize: 14, lineHeight: 1.6,
        border: isUser ? "none" : "1px solid #E5E7EB",
        boxShadow: isUser ? "0 2px 8px rgba(124,58,237,0.3)" : "none"
      }}>
        {content}
      </div>
      {isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          background: "#E5E7EB", marginLeft: 8, marginTop: 2,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13
        }}>
          👤
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [status, setStatus] = useState("idle");
  const [videoSrc, setVideoSrc] = useState(null);
  const [videoFilename, setVideoFilename] = useState("");
  const [transcript, setTranscript] = useState("");
  const [filePath, setFilePath] = useState("");

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("manager");
  const [chatHistory, setChatHistory] = useState([]);
  const [querying, setQuerying] = useState(false);

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideoFilename(file.name);
    setVideoSrc(URL.createObjectURL(file));
    setFilePath(file.name);
    setTranscript("");
    setChatHistory([]);
    setStatus("idle");
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files[0]) {
      alert("Please select a video file first.");
      return;
    }
    setStatus("uploading");
    const formData = new FormData();
    formData.append("video", fileInputRef.current.files[0]);
    try {
      setStatus("processing");
      const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setTranscript(data.transcript);
        setFilePath(data.filepath);
        setStatus("ready");
        setChatHistory([{
          role: "assistant",
          content: `Video "${data.filename}" uploaded and transcript generated! Ask me anything about it.`
        }]);
      } else {
        setStatus("error");
        alert(data.error || "Upload failed");
      }
    } catch (err) {
      setStatus("error");
      alert("Upload failed: " + err.message);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) return;
    const userMsg = query.trim();
    setQuery("");
    setQuerying(true);
    const newHistory = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(newHistory);
    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg, transcript, history: chatHistory, role, filepath: filePath, filename: videoFilename })
      });
      const data = await res.json();
      if (data.success) {
        setChatHistory([...newHistory, { role: "assistant", content: data.answer }]);
      } else {
        setChatHistory([...newHistory, { role: "assistant", content: "Error: " + data.error }]);
      }
    } catch (err) {
      setChatHistory([...newHistory, { role: "assistant", content: "Connection error: " + err.message }]);
    } finally {
      setQuerying(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7FF", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
        @keyframes shimmer { 0% { opacity:0.6 } 100% { opacity:1 } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #F3F4F6; border-radius: 3px; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
        input[type="range"] { height: 4px; }
        textarea:focus, input:focus { outline: none; }
      `}</style>

      {/* Header */}
      <header style={{
        background: "#fff", borderBottom: "1px solid #E5E7EB",
        padding: "0 32px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: ACCENT_GRADIENT,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
          }}>🎬</div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 }}>
            <GradientText>VideoChat</GradientText>
          </span>
          <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 4 }}>
            Ask your video anything
          </span>
        </div>
        <StatusBadge status={status} />
      </header>

      {/* Main columns */}
      <main style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 0,
        height: "calc(100vh - 64px)",
        maxWidth: 1400,
        margin: "0 auto"
      }}>

        {/* LEFT: Data Loading */}
        <section style={{
          borderRight: "1px solid #E5E7EB",
          overflowY: "auto",
          padding: 28,
          display: "flex", flexDirection: "column", gap: 20
        }}>
          <div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#111827", margin: "0 0 4px" }}>
              Load Video
            </h2>
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
              Upload a video to extract transcript and start chatting
            </p>
          </div>

          {/* File selector */}
          <div style={{
            border: "2px dashed #DDD6FE",
            borderRadius: 16, padding: 28,
            textAlign: "center",
            background: "linear-gradient(135deg, #F5F3FF 0%, #FDF2F8 100%)",
            cursor: "pointer"
          }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ fontSize: 40, marginBottom: 10 }}>📁</div>
            <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#4B5563", fontSize: 14 }}>
              {videoFilename || "Click to choose a video file"}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF" }}>
              MP4, WebM, MOV supported
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
          </div>

          {filePath && (
            <div style={{
              background: "#F9FAFB", border: "1px solid #E5E7EB",
              borderRadius: 10, padding: "10px 14px",
              fontSize: 12, color: "#6B7280",
              display: "flex", alignItems: "center", gap: 8
            }}>
              <span>📍</span>
              <span style={{ fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {filePath}
              </span>
            </div>
          )}

          <button onClick={handleUpload} disabled={!videoFilename || status === "uploading" || status === "processing"}
            style={{
              width: "100%", padding: "13px 0",
              background: (!videoFilename || status === "uploading" || status === "processing")
                ? "#E5E7EB"
                : ACCENT_GRADIENT,
              color: (!videoFilename || status === "uploading" || status === "processing") ? "#9CA3AF" : "#fff",
              border: "none", borderRadius: 12,
              fontWeight: 700, fontSize: 15, cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              transition: "opacity 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8
            }}>
            {status === "uploading" || status === "processing"
              ? <><span style={{ animation: "shimmer 0.8s infinite alternate" }}>⏳</span> Processing…</>
              : <><span>🚀</span> Upload &amp; Extract Transcript</>
            }
          </button>

          {/* Video player */}
          {videoSrc && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#7C3AED", textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 10px" }}>
                Preview
              </p>
              <VideoPlayer src={videoSrc} filename={videoFilename} />
            </div>
          )}

          {/* Transcript */}
          {transcript && <TranscriptPanel transcript={transcript} />}

          {!videoSrc && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              color: "#D1D5DB", paddingTop: 40, textAlign: "center"
            }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎥</div>
              <p style={{ fontSize: 14, color: "#9CA3AF" }}>Your video will appear here</p>
            </div>
          )}
        </section>

        {/* RIGHT: Query */}
        <section style={{
          display: "flex", flexDirection: "column",
          height: "100%", overflow: "hidden",
          background: "#fff"
        }}>
          {/* Chat area header */}
          <div style={{
            padding: "20px 28px 16px",
            borderBottom: "1px solid #F3F4F6",
            background: "#fff"
          }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#111827", margin: "0 0 2px" }}>
              Ask Anything
            </h2>
            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
              Query your video content with natural language
            </p>
          </div>

          {/* Chat history */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
            {chatHistory.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                height: "100%", color: "#9CA3AF", textAlign: "center", gap: 12
              }}>
                <div style={{ fontSize: 56 }}>💬</div>
                <p style={{ fontSize: 16, color: "#6B7280", fontWeight: 500 }}>Ready to chat</p>
                <p style={{ fontSize: 13, color: "#9CA3AF", maxWidth: 280 }}>
                  Upload a video on the left, then ask questions about its content here
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
                  {["What is this video about?", "Summarize the key points", "Who speaks in this video?"].map(q => (
                    <button key={q} onClick={() => setQuery(q)} style={{
                      padding: "6px 14px", borderRadius: 20, border: "1px solid #DDD6FE",
                      background: "#F5F3FF", color: "#7C3AED", fontSize: 12,
                      cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: 500
                    }}>{q}</button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {chatHistory.map((msg, i) => (
                  <ChatBubble key={i} role={msg.role} content={msg.content} />
                ))}

                {querying && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: ACCENT_GRADIENT, flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13
                    }}>🎬</div>
                    <div style={{
                      display: "flex", gap: 4, padding: "10px 14px",
                      background: "#F9FAFB", borderRadius: "18px 18px 18px 4px",
                      border: "1px solid #E5E7EB"
                    }}>
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <span key={i} style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: "#7C3AED", display: "inline-block",
                          animation: `pulse 1s ${delay}s infinite`
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Input area */}
          <div style={{
            padding: "16px 28px 24px",
            borderTop: "1px solid #F3F4F6",
            background: "#fff"
          }}>
            <div style={{
              display: "flex", gap: 10, alignItems: "flex-end",
              background: "#F9FAFB", borderRadius: 16,
              border: "2px solid #E5E7EB", padding: "12px 12px 12px 16px",
              transition: "border-color 0.2s"
            }}
              onFocus={() => { }} // handled by CSS
            >
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                style={{
                  border: "1px solid #DDD6FE",
                  borderRadius: 10,
                  padding: "8px 24px 8px 10px",
                  fontSize: 13,
                  color: "#7C3AED",
                  background: "#F5F3FF url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M1 3l4 4 4-4' stroke='%237C3AED' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\") no-repeat right 8px center",
                  backgroundSize: "10px",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  cursor: "pointer",
                  outline: "none",
                  alignSelf: "center",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  appearance: "none",
                  minWidth: 100
                }}
              >
                <option value="manager">Manager</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
              </select>
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={status === "ready" ? "Ask about your video…" : "Upload a video first, then ask questions here…"}
                rows={1}
                style={{
                  flex: 1, border: "none", background: "transparent",
                  resize: "none", fontSize: 13, color: "#111827",
                  fontFamily: "'Inter', sans-serif", lineHeight: 1.5,
                  maxHeight: 120, overflow: "auto"
                }}
                onInput={e => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
              />
              <button
                onClick={handleQuery}
                disabled={!query.trim() || querying}
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: (!query.trim() || querying) ? "#E5E7EB" : ACCENT_GRADIENT,
                  border: "none", cursor: "pointer", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "opacity 0.2s"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8L2 2L5 8L2 14L14 8Z" fill={(!query.trim() || querying) ? "#9CA3AF" : "white"} />
                </svg>
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: "8px 0 0", textAlign: "center" }}>
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
