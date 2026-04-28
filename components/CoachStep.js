import { useState } from "react";
import { useTheme } from "../lib/ThemeContext";

const STEP_QUESTIONS = {
  1: "Let's start with your headline — that line right under your name on LinkedIn. What does yours say right now? (If you don't have one, just tell me your current job title.)",
  2: "Now your About section — that paragraph people read to understand who you are. Either paste what's there now, or just tell me about yourself in your own words.",
  3: "What skills do you have listed on LinkedIn right now? Or just tell me what you think your top skills are.",
  4: "Pick the job on your LinkedIn that's most relevant to what you want to do next. Tell me the job title and what you currently have written for it (or just describe what you actually did there).",
};

const STEP_TITLES = {
  1: "Optimize Your Headline",
  2: "Rewrite Your About Section",
  3: "Suggest Skills to Add",
  4: "Improve a Job Description",
  5: "Your LinkedIn Optimization Report",
};

function CopyButton({ text, C }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        background: copied ? C.greenLight : C.bg,
        border: `1px solid ${copied ? C.green : C.soft}`,
        borderRadius: "8px",
        padding: "5px 12px",
        fontSize: "12px",
        color: copied ? C.green : C.softDark,
        cursor: "pointer",
        fontFamily: "inherit",
        flexShrink: 0,
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

// CoachStep handles one coaching step: question, answer input, and AI result display.
export default function CoachStep({
  step,
  initialAnswer,
  result,
  loading,
  onSubmit,
  onSkip,
  onRetry,
  onNext,
}) {
  const { C } = useTheme();
  const [answer, setAnswer] = useState(initialAnswer || "");
  // For step 1 headline options: track which one is selected
  const [selectedOption, setSelectedOption] = useState(null);

  const question = STEP_QUESTIONS[step];
  const title = STEP_TITLES[step];
  const hasResult = result !== null && result !== undefined;

  const renderResult = () => {
    if (!hasResult) return null;

    // Step 1: 3 headline options
    if (step === 1 && result.options) {
      return (
        <div>
          <div style={{ fontSize: "13px", color: C.softDark, marginBottom: "12px" }}>
            Here are 3 headlines crafted just for you. Pick your favorite or use it as inspiration:
          </div>
          {result.options.map((opt, i) => (
            <div
              key={i}
              onClick={() => setSelectedOption(i)}
              style={{
                background: selectedOption === i ? C.greenLight : C.bg,
                border: `1px solid ${selectedOption === i ? C.green : C.soft}`,
                borderRadius: "12px",
                padding: "14px 16px",
                marginBottom: "10px",
                cursor: "pointer",
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
              }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flex: 1 }}>
                  <span style={{
                    background: selectedOption === i ? C.green : C.soft,
                    color: selectedOption === i ? "#fff" : C.mid,
                    borderRadius: "50%",
                    width: "22px",
                    height: "22px",
                    minWidth: "22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "700",
                  }}>{i + 1}</span>
                  <span style={{ fontSize: "14px", color: C.dark, lineHeight: "1.5" }}>{opt}</span>
                </div>
                <CopyButton text={opt} C={C} />
              </div>
            </div>
          ))}
          {result.tip && (
            <div style={{
              background: C.greenLight,
              borderLeft: `3px solid ${C.green}`,
              borderRadius: "0 10px 10px 0",
              padding: "10px 14px",
              fontSize: "13px",
              color: C.dark,
              marginTop: "4px",
              lineHeight: "1.5",
            }}>
              💡 {result.tip}
            </div>
          )}
        </div>
      );
    }

    // Steps 2 and 4: single optimized text block
    if ((step === 2 || step === 4) && result.optimized) {
      return (
        <div>
          <div style={{
            background: C.bg,
            border: `1px solid ${C.soft}`,
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "10px",
          }}>
            <div style={{
              fontSize: "14px",
              color: C.dark,
              lineHeight: "1.7",
              whiteSpace: "pre-wrap",
            }}>
              {result.optimized}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <CopyButton text={result.optimized} C={C} />
          </div>
          {result.tip && (
            <div style={{
              background: C.greenLight,
              borderLeft: `3px solid ${C.green}`,
              borderRadius: "0 10px 10px 0",
              padding: "10px 14px",
              fontSize: "13px",
              color: C.dark,
              marginTop: "10px",
              lineHeight: "1.5",
            }}>
              💡 {result.tip}
            </div>
          )}
        </div>
      );
    }

    // Step 3: skill tags
    if (step === 3 && result.skills) {
      const newSkills = result.new || [];
      return (
        <div>
          <div style={{ fontSize: "13px", color: C.softDark, marginBottom: "12px" }}>
            Here are {result.skills.length} skills for your LinkedIn profile:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
            {result.skills.map((skill, i) => {
              const isNew = newSkills.includes(skill);
              return (
                <span key={i} style={{
                  background: isNew ? C.greenLight : C.bg,
                  border: `1px solid ${isNew ? C.green : C.soft}`,
                  borderRadius: "20px",
                  padding: "5px 12px",
                  fontSize: "13px",
                  color: isNew ? C.green : C.dark,
                }}>
                  {isNew ? "✦ " : ""}{skill}
                </span>
              );
            })}
          </div>
          {newSkills.length > 0 && (
            <div style={{ fontSize: "12px", color: C.softDark, marginBottom: "10px" }}>
              ✦ = newly suggested
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <CopyButton text={result.skills.join(", ")} C={C} />
          </div>
          {result.tip && (
            <div style={{
              background: C.greenLight,
              borderLeft: `3px solid ${C.green}`,
              borderRadius: "0 10px 10px 0",
              padding: "10px 14px",
              fontSize: "13px",
              color: C.dark,
              marginTop: "10px",
              lineHeight: "1.5",
            }}>
              💡 {result.tip}
            </div>
          )}
        </div>
      );
    }

    // Step 5: full optimization report
    if (step === 5) {
      const sections = [];
      if (result.headline) sections.push({ label: "Optimized Headline", content: result.headline });
      if (result.about) sections.push({ label: "About Section", content: result.about });
      if (result.skills && result.skills.length > 0) {
        sections.push({ label: "Recommended Skills", content: result.skills.join(", ") });
      }
      if (result.jobDescription) {
        sections.push({ label: "Job Description", content: result.jobDescription });
      }
      const fullReport = sections.map((s) => s.label + "\n" + s.content).join("\n\n");

      return (
        <div>
          {sections.map((section, i) => (
            <div key={i} style={{
              background: C.bg,
              border: `1px solid ${C.soft}`,
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "12px",
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "10px",
              }}>
                <div style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: C.accent,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}>
                  {section.label}
                </div>
                <CopyButton text={section.content} C={C} />
              </div>
              <div style={{
                fontSize: "14px",
                color: C.dark,
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
              }}>
                {section.content}
              </div>
            </div>
          ))}

          {result.improvements && result.improvements.length > 0 && (
            <div style={{
              background: C.greenLight,
              border: `1px solid ${C.green}30`,
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "12px",
            }}>
              <div style={{
                fontSize: "11px",
                fontWeight: "700",
                color: C.green,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginBottom: "10px",
              }}>
                3 Quick Wins
              </div>
              {result.improvements.map((imp, i) => (
                <div key={i} style={{
                  fontSize: "14px",
                  color: C.dark,
                  marginBottom: "8px",
                  lineHeight: "1.5",
                  display: "flex",
                  gap: "8px",
                }}>
                  <span style={{ color: C.green, fontWeight: "700", flexShrink: 0 }}>{i + 1}.</span>
                  {imp}
                </div>
              ))}
            </div>
          )}

          {result.closingMessage && (
            <div style={{
              background: `linear-gradient(135deg, ${C.accent}15, ${C.mid}10)`,
              border: `1px solid ${C.accent}40`,
              borderRadius: "12px",
              padding: "18px",
              marginBottom: "12px",
              fontSize: "14px",
              color: C.dark,
              lineHeight: "1.7",
              textAlign: "center",
            }}>
              {result.closingMessage}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <CopyButton text={fullReport} C={C} />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      <div style={{ fontSize: "16px", fontWeight: "700", color: C.dark, marginBottom: "16px" }}>
        {title}
      </div>

      {/* Question — shown when there is no result and not loading */}
      {question && !hasResult && !loading && (
        <div style={{
          background: C.bg,
          border: `1px solid ${C.soft}`,
          borderRadius: "12px",
          padding: "16px",
          fontSize: "14px",
          color: C.dark,
          lineHeight: "1.7",
          marginBottom: "16px",
        }}>
          {question}
        </div>
      )}

      {/* Answer input — steps 1-4, no result yet, not loading */}
      {step !== 5 && !hasResult && !loading && (
        <div style={{ marginBottom: "16px" }}>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={4}
            style={{
              width: "100%",
              padding: "12px 14px",
              background: C.bg,
              border: `1px solid ${C.soft}`,
              borderRadius: "12px",
              fontSize: "14px",
              color: C.dark,
              fontFamily: "inherit",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
            <button
              onClick={() => onSubmit(answer)}
              disabled={!answer.trim()}
              style={{
                flex: 1,
                background: answer.trim()
                  ? `linear-gradient(135deg, ${C.accent}, ${C.mid})`
                  : C.soft,
                border: "none",
                borderRadius: "12px",
                padding: "12px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#FFF9F0",
                cursor: answer.trim() ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}
            >
              Submit
            </button>
            <button
              onClick={onSkip}
              style={{
                background: C.bg,
                border: `1px solid ${C.soft}`,
                borderRadius: "12px",
                padding: "12px 18px",
                fontSize: "14px",
                color: C.softDark,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "30px 20px",
          gap: "16px",
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
          <div style={{ fontSize: "14px", color: C.dark, textAlign: "center" }}>
            {step === 5
              ? "Generating your LinkedIn Optimization Report..."
              : "Crafting your options..."}
          </div>
        </div>
      )}

      {/* Result + action buttons */}
      {hasResult && !loading && (
        <div>
          {renderResult()}
          {step < 5 && (
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                onClick={onNext}
                style={{
                  flex: 1,
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
                {step === 4 ? "Generate Report →" : "Next Step →"}
              </button>
              <button
                onClick={onRetry}
                style={{
                  background: C.bg,
                  border: `1px solid ${C.soft}`,
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontSize: "14px",
                  color: C.softDark,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                Try different versions
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes sparkSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100% { opacity:0.3; transform:translateY(0); } 50% { opacity:1; transform:translateY(-4px); } }
      `}</style>
    </div>
  );
}
