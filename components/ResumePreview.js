import { useState, useEffect } from "react";
import { useTheme } from "../lib/ThemeContext";
import { ResumePDF } from "./ResumePDF";
import { PDFDownloadLink } from "@react-pdf/renderer";

export default function ResumePreview({ resume, onRegenerate }) {
  const { C } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!resume) return null;
  const { header = {}, summary, experience = [], skills = [], education = [], additional = [] } = resume;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button
          onClick={onRegenerate}
          style={{
            background: C.bg,
            border: `1px solid ${C.soft}`,
            borderRadius: "20px",
            padding: "9px 18px",
            fontSize: "13px",
            color: C.mid,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ↻ Regenerate
        </button>

        {mounted && (
          <PDFDownloadLink
            document={<ResumePDF resume={resume} />}
            fileName={`${header.name ? header.name.replace(/\s+/g, "_") : "resume"}.pdf`}
            style={{ textDecoration: "none" }}
          >
            {({ loading: pdfLoading }) => (
              <span
                style={{
                  display: "inline-block",
                  background: `linear-gradient(135deg, ${C.accent}, ${C.mid})`,
                  borderRadius: "20px",
                  padding: "9px 20px",
                  fontSize: "13px",
                  color: "#FFF9F0",
                  cursor: pdfLoading ? "wait" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {pdfLoading ? "Preparing PDF..." : "⬇ Download PDF"}
              </span>
            )}
          </PDFDownloadLink>
        )}
      </div>

      {/* Resume preview */}
      <div style={{
        background: "#FFFFFF",
        border: `1px solid ${C.soft}`,
        borderRadius: "12px",
        padding: "40px 48px",
        fontFamily: "Georgia, serif",
        color: "#2C1810",
        fontSize: "14px",
        lineHeight: "1.6",
        maxHeight: "60vh",
        overflowY: "auto",
      }}>

        {/* Header */}
        <div style={{ marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #E0D4BC" }}>
          {header.name && (
            <div style={{ fontSize: "28px", fontWeight: "700", color: "#2C1810", marginBottom: "4px", fontFamily: "Arial, sans-serif" }}>
              {header.name}
            </div>
          )}
          {header.title && (
            <div style={{ fontSize: "15px", color: "#8B6010", marginBottom: "8px", fontFamily: "Arial, sans-serif" }}>
              {header.title}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            {header.email && <span style={{ fontSize: "12px", color: "#9B8A70" }}>{header.email}</span>}
            {header.phone && <span style={{ fontSize: "12px", color: "#9B8A70" }}>{header.phone}</span>}
            {header.location && <span style={{ fontSize: "12px", color: "#9B8A70" }}>{header.location}</span>}
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div style={{ marginBottom: "18px" }}>
            <div style={sectionTitleStyle}>Summary</div>
            <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.7", color: "#2C1810" }}>{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div style={{ marginBottom: "18px" }}>
            <div style={sectionTitleStyle}>Experience</div>
            {experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "13px", color: "#2C1810", fontFamily: "Arial, sans-serif" }}>{exp.title}</div>
                    {exp.company && <div style={{ fontSize: "12px", color: "#6B4226" }}>{exp.company}</div>}
                  </div>
                  {exp.dates && <div style={{ fontSize: "11px", color: "#9B8A70", whiteSpace: "nowrap", marginLeft: "12px" }}>{exp.dates}</div>}
                </div>
                {exp.location && <div style={{ fontSize: "11px", color: "#9B8A70", marginBottom: "5px" }}>{exp.location}</div>}
                {(exp.achievements || []).map((ach, j) => (
                  <div key={j} style={{ display: "flex", gap: "6px", marginBottom: "3px", paddingLeft: "8px" }}>
                    <span style={{ color: "#8B6010", flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: "12px", color: "#2C1810", lineHeight: "1.5" }}>{ach}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div style={{ marginBottom: "18px" }}>
            <div style={sectionTitleStyle}>Skills</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {skills.map((skill, i) => (
                <span key={i} style={{
                  background: "#FAF8F4",
                  border: "1px solid #E0D4BC",
                  borderRadius: "12px",
                  padding: "4px 12px",
                  fontSize: "11px",
                  color: "#6B4226",
                  fontFamily: "Arial, sans-serif",
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div style={{ marginBottom: "18px" }}>
            <div style={sectionTitleStyle}>Education</div>
            {education.map((edu, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "13px", fontFamily: "Arial, sans-serif" }}>{edu.credential}</div>
                  {edu.institution && <div style={{ fontSize: "12px", color: "#6B4226" }}>{edu.institution}</div>}
                </div>
                {edu.year && <div style={{ fontSize: "11px", color: "#9B8A70" }}>{edu.year}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Additional */}
        {additional.length > 0 && (
          <div>
            <div style={sectionTitleStyle}>Additional</div>
            {additional.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "3px", paddingLeft: "8px" }}>
                <span style={{ color: "#8B6010", flexShrink: 0 }}>·</span>
                <span style={{ fontSize: "12px", color: "#2C1810" }}>{item}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

const sectionTitleStyle = {
  fontSize: "10px",
  fontWeight: "700",
  fontFamily: "Arial, sans-serif",
  color: "#8B6010",
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  marginBottom: "8px",
  paddingBottom: "4px",
  borderBottom: "0.5px solid #E0D4BC",
};
