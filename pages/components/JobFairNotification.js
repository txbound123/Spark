import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useTheme } from "../lib/themeContext";

// Haversine formula — returns distance in km between two lat/lng points
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

const formatDist = (km) =>
  km < 1 ? `${Math.round(km * 1000)} m away` : `${km.toFixed(1)} km away`;

const RADIUS_KM = 80;

export default function JobFairNotification() {
  const { C } = useTheme();
  const [fairs, setFairs] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => fetchNearby(coords.latitude, coords.longitude),
      () => {},
      { timeout: 10000 }
    );
  }, []);

  const fetchNearby = async (lat, lng) => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("job_fairs")
      .select("*")
      .gte("event_date", now)
      .order("event_date", { ascending: true });

    if (!data) return;

    const nearby = data
      .map((f) => ({ ...f, distKm: haversineKm(lat, lng, f.latitude, f.longitude) }))
      .filter((f) => f.distKm <= RADIUS_KM)
      .sort((a, b) => a.distKm - b.distKm);

    setFairs(nearby);
  };

  const dismiss = (id) => setDismissed((prev) => new Set([...prev, id]));
  const visible = fairs.filter((f) => !dismissed.has(f.id));

  if (visible.length === 0) return null;

  return (
    <div style={{
      background: C.greenLight,
      borderBottom: `1px solid ${C.green}40`,
    }}>
      {/* Collapsed header bar */}
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "9px 20px", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span style={{ fontSize: "14px" }}>📍</span>
          <span style={{ fontSize: "12px", fontWeight: "700", color: C.green, letterSpacing: "0.5px" }}>
            {visible.length} job fair{visible.length > 1 ? "s" : ""} near you
          </span>
        </div>
        <span style={{ fontSize: "11px", color: C.softDark }}>
          {expanded ? "▲ hide" : "▼ show"}
        </span>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 12px", display: "flex", flexDirection: "column", gap: "7px" }}>
          {visible.map((fair) => (
            <div
              key={fair.id}
              style={{
                background: C.paper,
                border: `1px solid ${C.green}30`,
                borderRadius: "10px",
                padding: "11px 14px",
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", fontSize: "14px", color: C.dark }}>
                  {fair.title}
                </div>
                <div style={{ fontSize: "12px", color: C.softDark, marginTop: "3px" }}>
                  {formatDate(fair.event_date)}
                  {fair.location_name && ` · ${fair.location_name}`}
                  {" · "}
                  <span style={{ color: C.green, fontWeight: "600" }}>{formatDist(fair.distKm)}</span>
                </div>
                {fair.description && (
                  <div style={{ fontSize: "12px", color: C.mid, marginTop: "5px", lineHeight: "1.4" }}>
                    {fair.description}
                  </div>
                )}
                {fair.website && (
                  <a
                    href={fair.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block", marginTop: "6px",
                      fontSize: "11px", color: C.accent,
                      textDecoration: "underline",
                    }}
                  >
                    Learn more →
                  </a>
                )}
              </div>
              <button
                onClick={() => dismiss(fair.id)}
                title="Dismiss"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "18px", color: C.softDark, padding: "0 4px",
                  lineHeight: 1, flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
