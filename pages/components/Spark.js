import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";
import JobFairNotification from "./JobFairNotification";
import { useTheme } from "../lib/themeContext";

const parseResponse = (text) => {
  const insightMatch = text.match(/INSIGHT:\s*(.+)/i);
  const insight = insightMatch ? insightMatch[1].trim() : null;
  const message = text.replace(/INSIGHT:\s*.+/i, "").trim();
  return { message, insight };
};

const speak = (text) => {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*_#]/g, "");
  const utter = new SpeechSynthesisUtterance(clean);
  utter.rate = 0.95;
  utter.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes("Samantha") || v.name.includes("Karen") ||
    v.name.includes("Female") || (v.lang === "en-US" && v.localService)
  );
  if (preferred) utter.voice = preferred;
  window.speechSynthesis.speak(utter);
};

export default function Spark({ user }) {
  const { C, darkMode, toggleDark } = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState([]);
  const [showInsights, setShowInsights] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [browserSupport, setBrowserSupport] = useState(true);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const router = useRouter();

  // Load history on mount
  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setBrowserSupport(false);
    }
  }, []);

  const loadHistory = async () => {
    try {
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      const { data: ins } = await supabase
        .from("insights")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (convs && convs.length > 0) {
        setMessages(convs.map(c => ({ role: c.role, content: c.content })));
      } else {
        await startConversation();
      }

      if (ins && ins.length > 0) {
        setInsights(ins.map(i => i.insight));
      }
    } catch (e) {
      console.error("Load error:", e);
    }
    setHistoryLoaded(true);
  };

  const saveMessage = async (role, content) => {
    try {
      await supabase.from("conversations").insert({
        user_id: user.id, role, content,
      });
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  const saveInsight = async (insight) => {
    try {
      await supabase.from("insights").insert({
        user_id: user.id, insight,
      });
    } catch (e) {
      console.error("Save insight error:", e);
    }
  };

  const callAPI = async (msgs) => {
    // Calls the secure Edge Function instead of Anthropic directly
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat-with-spark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        messages: msgs.map(m => ({ role: m.role, content: m.content })),
      }),
    });
    const data = await res.json();
    return data.content?.map(b => b.text || "").join("") || "";
  };

  const startConversation = async () => {
    setLoading(true);
    try {
      const raw = await callAPI([{ role: "user", content: "Hello, I just opened the app." }]);
      const { message, insight } = parseResponse(raw);
      setMessages([{ role: "assistant", content: message }]);
      await saveMessage("assistant", message);
      if (insight) {
        setInsights([insight]);
        await saveInsight(insight);
      }
      if (voiceEnabled) setTimeout(() => speak(message), 300);
    } catch (e) {
      const fallback = "Hey, I'm so glad you're here. I'm Spark. What are you good at?";
      setMessages([{ role: "assistant", content: fallback }]);
    }
    setLoading(false);
  };

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    window.speechSynthesis?.cancel();

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => { setListening(true); setTranscript(""); };
    recognition.onresult = (e) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      setTranscript(final || interim);
      if (final) setInput(final);
    };
    recognition.onend = () => { setListening(false); recognitionRef.current = null; };
    recognition.onerror = () => { setListening(false); recognitionRef.current = null; };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const sendMessage = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;
    setInput("");
    setTranscript("");
    window.speechSynthesis?.cancel();

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    await saveMessage("user", text);
    setLoading(true);

    try {
      const raw = await callAPI(newMessages);
      const { message, insight } = parseResponse(raw);
      setMessages(prev => [...prev, { role: "assistant", content: message }]);
      await saveMessage("assistant", message);
      if (insight) {
        setInsights(prev => [...prev, insight]);
        await saveInsight(insight);
        setShowInsights(true);
      }
      if (voiceEnabled) setTimeout(() => speak(message), 200);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm here. Tell me more." }]);
    }
    setLoading(false);
  };

  const handleMicClick = () => {
    if (listening) {
      stopListening();
      if (input.trim()) sendMessage(input);
    } else startListening();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!historyLoaded) {
    return (
      <div style={{
        minHeight: "100vh", background: C.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "60px", height: "60px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.mid})`,
            borderRadius: "50%", margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "24px", color: "#fff",
            animation: "pulse 1.5s ease infinite",
          }}>✦</div>
          <p style={{ color: C.softDark }}>Loading your conversations...</p>
        </div>
        <style jsx>{`
          @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "14px 20px", borderBottom: `1px solid ${C.soft}`,
        background: C.paper, display: "flex", alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "34px", height: "34px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.mid})`,
            borderRadius: "50%", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "14px", color: "#fff",
          }}>✦</div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: C.dark }}>Spark</div>
            <div style={{ fontSize: "10px", color: C.softDark, letterSpacing: "1px", textTransform: "uppercase" }}>
              {user?.email}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={toggleDark}
            title={darkMode ? "Switch to light mode" : "Switch to night mode"}
            style={{
              background: darkMode ? C.soft : C.bg,
              border: `1px solid ${C.soft}`,
              borderRadius: "20px", padding: "7px 12px",
              fontSize: "12px", color: C.softDark,
              cursor: "pointer",
            }}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          <button
            onClick={() => { setVoiceEnabled(!voiceEnabled); window.speechSynthesis?.cancel(); }}
            style={{
              background: voiceEnabled ? C.greenLight : C.bg,
              border: `1px solid ${voiceEnabled ? C.green : C.soft}`,
              borderRadius: "20px", padding: "7px 12px",
              fontSize: "12px", color: voiceEnabled ? C.green : C.softDark,
              cursor: "pointer",
            }}
          >
            {voiceEnabled ? "🔊" : "🔇"}
          </button>

          {insights.length > 0 && (
            <button
              onClick={() => setShowInsights(!showInsights)}
              style={{
                background: showInsights ? C.greenLight : C.paper,
                border: `1px solid ${showInsights ? C.green : C.soft}`,
                borderRadius: "20px", padding: "7px 14px",
                fontSize: "12px", color: showInsights ? C.green : C.mid,
                cursor: "pointer",
              }}
            >
              ✦ {insights.length}
            </button>
          )}

          <button
            onClick={handleSignOut}
            style={{
              background: C.bg, border: `1px solid ${C.soft}`,
              borderRadius: "20px", padding: "7px 14px",
              fontSize: "12px", color: C.mid, cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <JobFairNotification />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{
            flex: 1, overflowY: "auto", padding: "28px 20px",
            display: "flex", flexDirection: "column", gap: "20px",
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                {msg.role === "assistant" && (
                  <div style={{
                    width: "30px", height: "30px", minWidth: "30px",
                    background: `linear-gradient(135deg, ${C.accent}, ${C.mid})`,
                    borderRadius: "50%", marginRight: "10px", marginTop: "4px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", color: "#fff",
                  }}>✦</div>
                )}
                <div style={{
                  maxWidth: "78%",
                  background: msg.role === "user"
                    ? `linear-gradient(135deg, ${C.accent}, ${C.mid})`
                    : C.paper,
                  color: msg.role === "user" ? "#FFF9F0" : C.dark,
                  padding: "14px 18px",
                  borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
                  fontSize: "15px", lineHeight: "1.7",
                  border: msg.role === "assistant" ? `1px solid ${C.soft}` : "none",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "30px", height: "30px", minWidth: "30px",
                  background: `linear-gradient(135deg, ${C.accent}, ${C.mid})`,
                  borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "11px", color: "#fff",
                }}>✦</div>
                <div style={{
                  background: C.paper, border: `1px solid ${C.soft}`,
                  borderRadius: "4px 18px 18px 18px",
                  padding: "14px 18px", display: "flex", gap: "5px",
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: "7px", height: "7px", background: C.accent,
                      borderRadius: "50%", animation: `bounce 1.2s ease ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {listening && (
            <div style={{
              margin: "0 20px 8px",
              background: "#FEF2F2", border: `1px solid ${C.red}30`,
              borderRadius: "12px", padding: "10px 16px",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <div style={{
                width: "10px", height: "10px", background: C.red,
                borderRadius: "50%", animation: "pulseRed 1s ease infinite",
              }} />
              <span style={{ fontSize: "13px", color: C.red, flex: 1 }}>
                {transcript || "Listening..."}
              </span>
            </div>
          )}

          <div style={{
            padding: "14px 20px", borderTop: `1px solid ${C.soft}`,
            background: C.paper,
          }}>
            <div style={{
              display: "flex", gap: "10px", alignItems: "flex-end",
              background: C.bg, border: `1px solid ${listening ? C.red : C.soft}`,
              borderRadius: "16px", padding: "10px 14px",
            }}>
              <textarea
                ref={inputRef}
                value={listening ? transcript : input}
                onChange={e => !listening && setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={listening ? "Listening..." : "Speak 🎙 or type..."}
                rows={1}
                readOnly={listening}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontSize: "15px", color: C.dark, fontFamily: "inherit",
                  lineHeight: "1.5", resize: "none", maxHeight: "100px",
                }}
              />
              {browserSupport && (
                <button
                  onClick={handleMicClick}
                  style={{
                    width: "40px", height: "40px",
                    background: listening ? C.red : `${C.accent}40`,
                    border: `1px solid ${listening ? C.red : C.soft}`,
                    borderRadius: "12px", cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  {listening ? "⏹" : "🎙"}
                </button>
              )}
              <button
                onClick={() => sendMessage()}
                disabled={(!input.trim() && !transcript.trim()) || loading || listening}
                style={{
                  width: "40px", height: "40px",
                  background: (input.trim() || transcript.trim()) && !loading && !listening
                    ? `linear-gradient(135deg, ${C.accent}, ${C.mid})`
                    : C.soft,
                  border: "none", borderRadius: "12px",
                  color: "#fff", fontSize: "16px",
                  cursor: (input.trim() || transcript.trim()) && !loading ? "pointer" : "not-allowed",
                }}
              >→</button>
            </div>
          </div>
        </div>

        {showInsights && insights.length > 0 && (
          <div style={{
            width: "320px", borderLeft: `1px solid ${C.soft}`,
            background: C.paper, overflowY: "auto", padding: "28px 20px",
          }}>
            <h3 style={{
              fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase",
              color: C.softDark, margin: "0 0 16px",
            }}>What We've Discovered</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {insights.map((insight, i) => (
                <div key={i} style={{
                  background: C.greenLight,
                  borderLeft: `3px solid ${C.green}`,
                  borderRadius: "0 10px 10px 0",
                  padding: "12px 14px",
                }}>
                  <div style={{ fontSize: "13px", color: C.dark, lineHeight: "1.5" }}>{insight}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes bounce { 0%,100% { opacity:0.3; transform:translateY(0); } 50% { opacity:1; transform:translateY(-4px); } }
        @keyframes pulseRed { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.8); } }
      `}</style>
    </div>
  );
}
