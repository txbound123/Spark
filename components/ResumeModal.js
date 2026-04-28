import { useState, useEffect, useRef } from "react";
import { useTheme } from "../lib/ThemeContext";
import { generateResume, saveResume } from "../lib/resumeGenerator";
import ResumePreview from "./ResumePreview";

const LOADING_MESSAGES = [
  "Reviewing what we've discovered about you...",
  "Writing your resume...",
  "Creating your PDF...",
];

export default function ResumeModal({ user, onClose }) {
  const { C } = useTheme();
  const [step, setStep] = useState("form"); // "form" | "loading" | "preview"
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [resume, setResume] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
    location: "",
    role: "",
  });
  const timerRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Cycle loading messages
  useEffect(() => {
    if (step !== "loading") return;
    setLoadingMsgIndex(0);
    timerRef.current = setInterval(() => {
      setLoadingMsgIndex((prev) => Math.min(prev + 1, LOADING_MESSAGES.length - 1));
    }, 2500);
    return () => clearInterval(timerRef.current);
  }, [step]);

  const handleGenerate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.role.trim()) {
      setError("Please fill in your name, email, and target role.");
      return;
    }
    setError(null);
    setStep("loading");
    try {
      const data = await generateResume(user.id, form);
      clearInterval(timerRef.current);
      await saveResume(user.id, data, form.role);
      setResume(data);
      setStep("preview");
    } catch (e) {
      clearInterval(timerRef.current);
      if (e.message === "insufficient_history") {
        setError("I'd love to help build your resume, but we should chat a bit more first so I can really capture what you're great at.");
      } else {
        setError("Something went wrong on my end. Could you try once more in a moment?");
      }
      setStep("form");
    }
  };

  const handleRegenerate = async () => {
    setResume(null);
    setError(null);
    setStep("loading");
    try {
      const data = await generateResume(user.id, form);
      clearInterval(timerRef.current);
      await saveResume(user.id, data, form.role);
      setResume(data);
      setStep("preview");
    } catch (e) {
      clearInterval(timerRef.current);
      setError("Almost got it — try once more?");
      setStep("preview");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    background: C.bg,
    border: `1px solid ${C.soft}`,
    borderRadius: "10px",
    fontSize: "14px",
    color: C.dark,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: "12px",
    color: C.softDark,
    fontWeight: "600",
    letterSpacing: "0.5px",
    marginBottom: "5px",
    display: "block",
  };

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
    >
      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.paper,
          borderRadius: "18px",
          border: `1px solid ${C.soft}`,
          width: "100%",
          maxWidth: step === "preview" ? "700px" : "480px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "32px",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            fontSize: "20px",
            color: C.softDark,
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        {/* FORM STEP */}
        {step === "form" && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <div style={{
                width: "36px", height: "36px",
                background: `linear-gradient(135deg, ${C.accent}, ${C.mid})`,
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", marginBottom: "12px",
              }}>📄</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: C.dark, marginBottom: "6px" }}>
                Generate Your Resume
              </div>
              <div style={{ fontSize: "13px", color: C.softDark, lineHeight: "1.5" }}>
                I'll use everything we've talked about to build you something great.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Phone (optional)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(555) 000-0000"
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>City / State (optional)</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="City, State"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Target Job Role *</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="e.g. Project Manager, Customer Service Lead"
                  style={inputStyle}
                  onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
                />
              </div>

              {error && (
                <div style={{
                  background: C.listeningBg,
                  border: `1px solid ${C.red}30`,
                  borderRadius: "10px",
                  padding: "12px 14px",
                  fontSize: "13px",
                  color: C.red,
                  lineHeight: "1.5",
                }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                style={{
                  background: `linear-gradient(135deg, ${C.accent}, ${C.mid})`,
                  border: "none",
                  borderRadius: "14px",
                  padding: "13px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#FFF9F0",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  marginTop: "4px",
                }}
              >
                Generate My Resume
              </button>
            </div>
          </div>
        )}

        {/* LOADING STEP */}
        {step === "loading" && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            gap: "20px",
          }}>
            <div style={{
              width: "48px", height: "48px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.mid})`,
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "22px",
              animation: "sparkSpin 2s linear infinite",
            }}>✦</div>
            <div style={{
              fontSize: "15px",
              color: C.dark,
              textAlign: "center",
              lineHeight: "1.6",
              minHeight: "48px",
            }}>
              {LOADING_MESSAGES[loadingMsgIndex]}
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {LOADING_MESSAGES.map((_, i) => (
                <div key={i} style={{
                  width: "6px", height: "6px",
                  borderRadius: "50%",
                  background: i === loadingMsgIndex ? C.accent : C.soft,
                  transition: "background 0.3s",
                }} />
              ))}
            </div>
            <style jsx global>{`
              @keyframes sparkSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}

        {/* PREVIEW STEP */}
        {step === "preview" && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "18px", fontWeight: "700", color: C.dark, marginBottom: "4px" }}>
                Your Resume is Ready ✦
              </div>
              <div style={{ fontSize: "13px", color: C.softDark }}>
                Looking good. Download it or regenerate with a new focus.
              </div>
            </div>

            {error && (
              <div style={{
                background: C.listeningBg,
                border: `1px solid ${C.red}30`,
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "13px",
                color: C.red,
                marginBottom: "16px",
              }}>
                {error}
              </div>
            )}

            <ResumePreview resume={resume} onRegenerate={handleRegenerate} />
          </div>
        )}
      </div>
    </div>
  );
}
