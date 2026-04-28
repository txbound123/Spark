import { useState, useEffect } from "react";
import { useTheme } from "../lib/ThemeContext";
import {
  checkConversationHistory,
  getOrCreateSession,
  updateSession,
  callLinkedInCoach,
} from "../lib/linkedinCoach";
import CoachStep from "./CoachStep";

const STEP_LABELS = ["Headline", "About", "Skills", "Job Description", "Report"];

// Normalize DB keys (JSON keys come back as strings) to numbers
function normalizeKeys(obj) {
  if (!obj) return {};
  const out = {};
  Object.keys(obj).forEach((k) => { out[parseInt(k, 10)] = obj[k]; });
  return out;
}

export default function LinkedInModal({ user, onClose }) {
  const { C } = useTheme();
  const [initialLoading, setInitialLoading] = useState(true);
  const [historyCount, setHistoryCount] = useState(0);
  const [session, setSession] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") handleResumeLater(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (user) initialize();
  }, [user]);

  const initialize = async () => {
    setInitialLoading(true);
    try {
      const count = await checkConversationHistory(user.id);
      setHistoryCount(count);

      if (count >= 3) {
        const sess = await getOrCreateSession(user.id);
        setSession(sess);
        const step = sess.current_step || 1;
        const loadedResults = normalizeKeys(sess.optimized);
        const loadedAnswers = normalizeKeys(sess.responses);
        setCurrentStep(step);
        setResults(loadedResults);
        setUserAnswers(loadedAnswers);

        // Auto-trigger report generation if resuming at step 5 with no report yet
        if (step === 5 && !loadedResults[5]) {
          triggerStep5Generation(loadedResults, sess.id);
        }
      }
    } catch (e) {
      console.error("LinkedIn Coach init error:", e);
    }
    setInitialLoading(false);
  };

  const triggerStep5Generation = async (currentResults, sessionId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await callLinkedInCoach({
        step: "5",
        userAnswer: "Generate the final report",
        sessionId,
        userId: user.id,
        previousResponses: currentResults,
      });
      const newResults = { ...currentResults, 5: result };
      setResults(newResults);
      try {
        await updateSession(sessionId, {
          current_step: 5,
          optimized: newResults,
          completed: true,
        });
      } catch (e) {
        console.error("Save error:", e);
      }
    } catch (e) {
      setError("Something went wrong on my end. Could you try once more in a moment?");
    }
    setLoading(false);
  };

  const handleSubmit = async (answer) => {
    setLoading(true);
    setError(null);
    const newAnswers = { ...userAnswers, [currentStep]: answer };
    setUserAnswers(newAnswers);

    try {
      const result = await callLinkedInCoach({
        step: String(currentStep),
        userAnswer: answer,
        sessionId: session?.id,
        userId: user.id,
        previousResponses: results,
      });
      const newResults = { ...results, [currentStep]: result };
      setResults(newResults);
      try {
        await updateSession(session?.id, {
          current_step: currentStep,
          responses: newAnswers,
          optimized: newResults,
        });
      } catch (e) {
        console.error("Save error:", e);
      }
    } catch (e) {
      setError("Something went wrong on my end. Could you try once more in a moment?");
    }
    setLoading(false);
  };

  const handleRetry = async () => {
    const answer = userAnswers[currentStep];
    if (!answer || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await callLinkedInCoach({
        step: String(currentStep),
        userAnswer: answer,
        sessionId: session?.id,
        userId: user.id,
        previousResponses: results,
      });
      const newResults = { ...results, [currentStep]: result };
      setResults(newResults);
      try {
        await updateSession(session?.id, { optimized: newResults });
      } catch (e) {
        console.error("Save error:", e);
      }
    } catch (e) {
      setError("Something went wrong on my end. Could you try once more in a moment?");
    }
    setLoading(false);
  };

  const handleSkip = () => {
    const newResults = { ...results, [currentStep]: null };
    setResults(newResults);
    advanceStep(newResults);
  };

  const handleNext = () => {
    advanceStep(results);
  };

  const advanceStep = (currentResults) => {
    const nextStep = currentStep + 1;
    if (nextStep > 5) {
      onClose();
      return;
    }
    setCurrentStep(nextStep);
    setError(null);
    try {
      updateSession(session?.id, { current_step: nextStep });
    } catch (e) {
      console.error("Save error:", e);
    }
    if (nextStep === 5 && !currentResults[5]) {
      triggerStep5Generation(currentResults, session?.id);
    }
  };

  const handleResumeLater = async () => {
    try {
      await updateSession(session?.id, {
        current_step: currentStep,
        responses: userAnswers,
        optimized: results,
      });
    } catch (e) {
      console.error("Save error:", e);
    }
    onClose();
  };

  const backdropStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  };

  const modalStyle = {
    background: C.paper,
    borderRadius: "18px",
    border: `1px solid ${C.soft}`,
    width: "100%",
    maxWidth: "560px",
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "32px",
    position: "relative",
  };

  const closeButtonStyle = {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "none",
    border: "none",
    fontSize: "20px",
    color: C.softDark,
    cursor: "pointer",
    lineHeight: 1,
  };

  // Loading state while initializing
  if (initialLoading) {
    return (
      <div onClick={onClose} style={backdropStyle}>
        <div onClick={(e) => e.stopPropagation()} style={{
          ...modalStyle,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "48px 32px",
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            background: `linear-gradient(135deg, ${C.accent}, ${C.mid})`,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            color: "#fff",
            animation: "sparkSpin 2s linear infinite",
          }}>✦</div>
          <div style={{ fontSize: "14px", color: C.softDark }}>Loading your session...</div>
          <style jsx global>{`
            @keyframes sparkSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    );
  }

  // Not enough conversation history
  if (historyCount < 3) {
    return (
      <div onClick={onClose} style={backdropStyle}>
        <div onClick={(e) => e.stopPropagation()} style={{ ...modalStyle, maxWidth: "480px" }}>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
          <div style={{ textAlign: "center", paddingTop: "8px" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>💼</div>
            <div style={{
              fontSize: "20px",
              fontWeight: "700",
              color: C.dark,
              marginBottom: "12px",
            }}>
              LinkedIn Coach
            </div>
            <div style={{
              fontSize: "14px",
              color: C.dark,
              lineHeight: "1.7",
              background: C.bg,
              borderRadius: "12px",
              padding: "16px",
            }}>
              Let's chat with Spark a bit more first so I can really understand what makes you valuable. Come back to LinkedIn Coach after a few more messages!
            </div>
            <button
              onClick={onClose}
              style={{
                background: `linear-gradient(135deg, ${C.accent}, ${C.mid})`,
                border: "none",
                borderRadius: "12px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#FFF9F0",
                cursor: "pointer",
                fontFamily: "inherit",
                marginTop: "20px",
              }}
            >
              Back to Spark
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={handleResumeLater} style={backdropStyle}>
      <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
        <button onClick={handleResumeLater} style={closeButtonStyle}>×</button>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              background: `linear-gradient(135deg, ${C.accent}, ${C.mid})`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              flexShrink: 0,
            }}>💼</div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: C.dark }}>
                LinkedIn Coach
              </div>
              <div style={{ fontSize: "12px", color: C.softDark }}>
                Step {currentStep} of 5 — {STEP_LABELS[currentStep - 1]}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{
            background: C.soft,
            borderRadius: "10px",
            height: "6px",
            overflow: "hidden",
            marginBottom: "10px",
          }}>
            <div style={{
              background: `linear-gradient(90deg, ${C.accent}, ${C.mid})`,
              height: "100%",
              width: `${(currentStep / 5) * 100}%`,
              borderRadius: "10px",
              transition: "width 0.3s ease",
            }} />
          </div>

          {/* Step dots */}
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: s < currentStep ? C.green : s === currentStep ? C.accent : C.soft,
                transition: "background 0.3s",
              }} />
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: C.listeningBg,
            border: `1px solid ${C.red}30`,
            borderRadius: "10px",
            padding: "12px 14px",
            fontSize: "13px",
            color: C.red,
            lineHeight: "1.5",
            marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        {/* Current coaching step */}
        <CoachStep
          key={currentStep}
          step={currentStep}
          initialAnswer={userAnswers[currentStep] || ""}
          result={results[currentStep] !== undefined ? results[currentStep] : null}
          loading={loading}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          onRetry={handleRetry}
          onNext={handleNext}
        />

        {/* Footer */}
        <div style={{
          borderTop: `1px solid ${C.soft}`,
          marginTop: "20px",
          paddingTop: "16px",
        }}>
          {currentStep === 5 && results[5] && !loading ? (
            <button
              onClick={onClose}
              style={{
                width: "100%",
                background: `linear-gradient(135deg, ${C.accent}, ${C.mid})`,
                border: "none",
                borderRadius: "12px",
                padding: "12px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#FFF9F0",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Done! 🎉
            </button>
          ) : (
            <button
              onClick={handleResumeLater}
              style={{
                background: "none",
                border: "none",
                fontSize: "13px",
                color: C.softDark,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Resume later →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
