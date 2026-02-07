import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import MapComponent from "./components/MapComponent";
import BookSearch from "./components/BookSearch";
import BookUpload from "./components/BookUpload";
import {
  fetchConductorOrchestrate,
  fetchChatAboutPlace,
} from "./api/archivistClient";
import { literaryGeoJSON } from "./data/literaryPoints";

/* ── Era metadata ──────────────────────────────────────────────── */
const ERA_META = {
  "1920s": { label: "Harlem Renaissance", color: "#ff6b6b", icon: "🎷" },
  "1940s": { label: "Post-War Immigration", color: "#e6b800", icon: "🚢" },
  "1960s": { label: "Civil Rights", color: "#4ecdc4", icon: "✊" },
};

const AGENT_ICONS = {
  ArchivistAgent: "🏛",
  LinguistAgent: "🗣",
  StylistAgent: "🎨",
  ConductorAgent: "🎼",
};

/* ── Delegation Timeline Component ─────────────────────────────── */
function DelegationTimeline({ timeline, totalMs }) {
  if (!timeline?.length) return null;
  return (
    <div
      style={{
        background: "#0a0c18",
        borderRadius: "8px",
        padding: "12px",
        marginBottom: "14px",
        border: "1px solid #1e2235",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <p
          style={{
            fontSize: "10px",
            color: "#888",
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            fontWeight: 700,
          }}
        >
          ⚡ Orchestration Timeline
        </p>
        <span
          style={{
            fontSize: "10px",
            color: "#4ecdc4",
            fontFamily: "monospace",
          }}
        >
          {totalMs}ms total
        </span>
      </div>
      {timeline.map((step, i) => {
        const icon = AGENT_ICONS[step.agent] || "⚙️";
        const isSuccess = step.status === "success";
        const barWidth =
          totalMs > 0 ? Math.max(8, (step.elapsed_ms / totalMs) * 100) : 50;
        return (
          <div key={i} style={{ marginBottom: "6px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "2px",
              }}
            >
              <span style={{ fontSize: "12px" }}>{icon}</span>
              <span style={{ fontSize: "10px", color: "#ccc", flex: 1 }}>
                {step.agent}
              </span>
              <code style={{ fontSize: "9px", color: "#666" }}>
                {step.tool}
              </code>
              <span
                style={{
                  fontSize: "9px",
                  fontFamily: "monospace",
                  color: isSuccess
                    ? "#4ecdc4"
                    : step.status === "skipped"
                      ? "#666"
                      : "#ff6b6b",
                }}
              >
                {step.elapsed_ms}ms
              </span>
            </div>
            <div
              style={{
                height: "3px",
                background: "#1a1d2e",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${barWidth}%`,
                  height: "100%",
                  borderRadius: "2px",
                  background: isSuccess
                    ? "linear-gradient(90deg, #4ecdc4, #44a8a0)"
                    : step.status === "skipped"
                      ? "#333"
                      : "#ff6b6b",
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main App ──────────────────────────────────────────────────── */
export default function App() {
  const [popupContent, setPopupContent] = useState(null);
  const [selectedEra, setSelectedEra] = useState(null);
  const [yearRange, setYearRange] = useState(null); // [min, max] or null = show all
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Conductor response (unified: archivist + linguist + stylist + synthesis + timeline)
  const [conductorResult, setConductorResult] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [uploadedBookLocations, setUploadedBookLocations] = useState(null);

  // Debounce ref for slider MCP calls
  const sliderDebounceRef = useRef(null);

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Story Mode state
  const [storyPlaying, setStoryPlaying] = useState(false);
  const [storyIndex, setStoryIndex] = useState(-1);
  const storyTimerRef = useRef(null);
  const storyActiveRef = useRef(false); // tracks whether story mode is running (avoids stale closure)

  // Narration state
  const [narrationEnabled, setNarrationEnabled] = useState(false);
  const synthRef = useRef(null);

  // Heatmap toggle
  const [heatmapOn, setHeatmapOn] = useState(false);

  /* ── Compute global year range from curated + uploaded data ── */
  const globalYearRange = useMemo(() => {
    const years = [];
    for (const f of literaryGeoJSON.features) {
      const y = f.properties?.year;
      if (typeof y === "number" && isFinite(y)) years.push(y);
    }
    if (uploadedBookLocations?.features) {
      for (const f of uploadedBookLocations.features) {
        const y = f.properties?.year;
        if (typeof y === "number" && isFinite(y)) years.push(y);
      }
    }
    if (years.length === 0) return [1920, 2020];
    const min = Math.min(...years);
    const max = Math.max(...years);
    // Pad by 5 years on each side so slider isn't at the very edge
    return [Math.floor((min - 5) / 10) * 10, Math.ceil((max + 5) / 10) * 10];
  }, [uploadedBookLocations]);

  // Reset yearRange when uploaded locations change so slider is fresh
  React.useEffect(() => {
    if (yearRange) {
      // Clamp existing range to new global bounds
      const clamped = [
        Math.max(yearRange[0], globalYearRange[0]),
        Math.min(yearRange[1], globalYearRange[1]),
      ];
      if (clamped[0] >= clamped[1]) {
        setYearRange(null); // range is invalid, reset
      } else if (clamped[0] !== yearRange[0] || clamped[1] !== yearRange[1]) {
        setYearRange(clamped);
      }
    }
  }, [globalYearRange]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Helper: year → era string (e.g. 1925 → "1920s") ───────── */
  const yearToEra = (year) => `${Math.floor(year / 10) * 10}s`;

  /* ── Stats computed from all data ───────────────────────────── */
  const stats = useMemo(() => {
    const curatedFeats = literaryGeoJSON.features || [];
    const uploadedFeats = uploadedBookLocations?.features || [];
    const all = [...curatedFeats, ...uploadedFeats];
    const books = new Set();
    const eras = new Set();
    const countries = new Set();
    all.forEach((f) => {
      if (f.properties?.book) books.add(f.properties.book);
      if (f.properties?.era) eras.add(f.properties.era);
      // rough country from coords
      const [lng] = f.geometry?.coordinates || [];
      if (lng != null) {
        if (lng > -130 && lng < -60) countries.add("USA");
        else if (lng > -10 && lng < 40) countries.add("Europe");
        else if (lng > 40 && lng < 80) countries.add("Asia");
        else if (lng > 100 && lng < 160) countries.add("Asia-Pacific");
        else countries.add("Other");
      }
    });
    return {
      books: books.size,
      locations: all.length,
      eras: eras.size,
      regions: countries.size,
    };
  }, [uploadedBookLocations]);

  /* ── All features for story mode ────────────────────────────── */
  const allFeatures = useMemo(() => {
    const curatedFeats = literaryGeoJSON.features || [];
    const uploadedFeats = uploadedBookLocations?.features || [];
    return [...curatedFeats, ...uploadedFeats];
  }, [uploadedBookLocations]);

  /* ── Narration helper (SpeechSynthesis) ─────────────────────── */
  const speak = useCallback(
    (text) => {
      if (!narrationEnabled || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      utter.pitch = 1.0;
      utter.volume = 1.0;
      // Pick a pleasant voice
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.lang === "en-US" && v.name.includes("Google")) ||
        voices.find((v) => v.lang === "en-US") ||
        voices[0];
      if (preferred) utter.voice = preferred;
      synthRef.current = utter;
      window.speechSynthesis.speak(utter);
    },
    [narrationEnabled],
  );

  /* ── Story Mode — auto-fly through locations ────────────────── */
  const startStoryMode = useCallback(() => {
    if (allFeatures.length === 0) return;
    storyActiveRef.current = true;
    setStoryPlaying(true);
    setStoryIndex(0);
  }, [allFeatures]);

  const stopStoryMode = useCallback(() => {
    storyActiveRef.current = false;
    setStoryPlaying(false);
    setStoryIndex(-1);
    if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  // Story mode: process one location fully before moving to the next.
  // 1. Fly to the location + call MCP orchestration (handleMarkerClick)
  // 2. Wait for the MCP result to come back
  // 3. Narrate the FULL synthesis (from the Conductor) + feature details
  // 4. Wait for narration to finish, then pause briefly, then advance
  useEffect(() => {
    if (!storyPlaying || storyIndex < 0) return;
    if (storyIndex >= allFeatures.length) {
      stopStoryMode();
      return;
    }

    let cancelled = false;
    const feature = allFeatures[storyIndex];

    (async () => {
      // Step 1: fly to location & orchestrate — reuse handleMarkerClick logic
      // but inline it so we can await the result
      const geometry = feature.geometry
        ? {
            type: feature.geometry.type,
            coordinates: feature.geometry.coordinates.slice(),
          }
        : null;
      const properties = { ...feature.properties };
      const { id, era } = properties;

      setSelectedEra(era);
      setLoading(true);
      setConductorResult(null);
      setSidebarOpen(true);

      let result = null;
      try {
        result = await fetchConductorOrchestrate({
          landmarkId: id,
          era,
          featureData: {
            book: properties.book,
            quote: properties.quote,
            historical_context: properties.historical_context,
            year: properties.year,
            era: properties.era,
            title: properties.title,
            mood: properties.mood,
          },
        });
        if (cancelled) return;
        setConductorResult(result);
        setPopupContent({
          geometry,
          properties,
          deepContext: result?.archivist || null,
        });
      } catch (err) {
        console.error("Story mode orchestration failed:", err);
        if (cancelled) return;
        setPopupContent({ geometry, properties, deepContext: null });
        setConductorResult(null);
      } finally {
        setLoading(false);
      }

      if (cancelled) return;

      // Step 2: Build the full narration — prefer the MCP synthesis, then
      // fall back to assembled feature properties
      const p = properties;
      const parts = [];
      if (p.title) parts.push(p.title + ".");
      if (p.book) parts.push(`From the book ${p.book}.`);
      if (p.era) parts.push(`Set in the ${p.era}.`);
      // Use the MCP conductor synthesis if available — it's richer
      if (result?.synthesis) {
        parts.push(result.synthesis);
      } else {
        if (p.quote) parts.push(`Quote: "${p.quote}"`);
        if (p.historical_context) parts.push(p.historical_context);
      }
      if (p.mood) parts.push(`The mood here is ${p.mood.replace(/,/g, ", ")}.`);
      const narration = parts.join(" ");

      // Step 3: Speak and wait for completion
      if (narrationEnabled && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        await new Promise((resolve) => {
          const utter = new SpeechSynthesisUtterance(narration);
          utter.rate = 0.95;
          utter.pitch = 1.0;
          const voices = window.speechSynthesis.getVoices();
          const preferred =
            voices.find(
              (v) => v.lang === "en-US" && v.name.includes("Google"),
            ) ||
            voices.find((v) => v.lang === "en-US") ||
            voices[0];
          if (preferred) utter.voice = preferred;
          utter.onend = resolve;
          utter.onerror = resolve; // still advance on error
          window.speechSynthesis.speak(utter);
        });
      } else {
        // No narration — just pause 8s so the user can read the sidebar
        await new Promise((r) => {
          storyTimerRef.current = setTimeout(r, 8000);
        });
      }

      if (cancelled) return;

      // Step 4: Brief pause, then advance to the next location
      await new Promise((r) => {
        storyTimerRef.current = setTimeout(r, 2000);
      });

      if (cancelled || !storyActiveRef.current) return;
      setStoryIndex((prev) => prev + 1);
    })();

    return () => {
      cancelled = true;
      if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, [storyPlaying, storyIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Narrate synthesis when it arrives (non-story-mode only) ── */
  const archivist = conductorResult?.archivist;
  const linguist = conductorResult?.linguist;
  const stylist = conductorResult?.stylist;
  const synthesis = conductorResult?.synthesis;
  const timeline = conductorResult?.timeline;
  const totalMs = conductorResult?.total_ms;

  useEffect(() => {
    // In story mode, narration is handled by the story effect — skip here
    if (storyPlaying) return;
    if (synthesis && narrationEnabled) {
      speak(synthesis);
    }
  }, [synthesis]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Chat handler ───────────────────────────────────────────── */
  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim()) return;
    const question = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: question }]);
    setChatLoading(true);
    try {
      const context = {};
      if (popupContent?.properties) {
        Object.assign(context, popupContent.properties);
      }
      if (archivist) {
        context.historical_context = archivist.historical_context;
        context.book = archivist.book;
      }
      const data = await fetchChatAboutPlace(question, context);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.answer, ms: data.elapsed_ms },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I couldn't answer that right now.",
          ms: 0,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, popupContent, archivist]);
  /* ── Book selection from LibrarianAgent search ──────────────── */
  const handleBookSelect = useCallback((book) => {
    setSelectedBook(book);
    console.log("Selected book for processing:", book);
  }, []);

  /* ── Marker click → Conductor orchestration ─────────────────── */
  const handleMarkerClick = useCallback(async (feature) => {
    const geometry = feature.geometry
      ? {
          type: feature.geometry.type,
          coordinates: feature.geometry.coordinates.slice(),
        }
      : null;
    const properties = { ...feature.properties };
    const { id, era } = properties;

    setSelectedEra(era);
    setLoading(true);
    setConductorResult(null);
    setSidebarOpen(true);

    try {
      // Single call to the Conductor → fans out to all 3 agents in parallel
      // Pass feature properties as featureData so the Conductor can handle
      // uploaded-book landmarks that aren't in the curated knowledge base
      const result = await fetchConductorOrchestrate({
        landmarkId: id,
        era,
        featureData: {
          book: properties.book,
          quote: properties.quote,
          historical_context: properties.historical_context,
          year: properties.year,
          era: properties.era,
          title: properties.title,
          mood: properties.mood,
        },
      });
      setConductorResult(result);
      setPopupContent({
        geometry,
        properties,
        deepContext: result.archivist || null,
      });
    } catch (err) {
      console.error("Conductor orchestration failed:", err);
      setPopupContent({ geometry, properties, deepContext: null });
      setConductorResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Era filter — year range slider ──────────────────────────── */
  const handleYearRangeChange = useCallback((newRange) => {
    setYearRange(newRange);
    // Derive an era string from the midpoint for MCP calls
    if (newRange) {
      const mid = Math.round((newRange[0] + newRange[1]) / 2);
      const era = yearToEra(mid);
      setSelectedEra(era);

      // Debounced MCP call — only fire after user stops sliding for 600ms
      if (sliderDebounceRef.current) clearTimeout(sliderDebounceRef.current);
      sliderDebounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const result = await fetchConductorOrchestrate({ era });
          setConductorResult(result);
        } catch (err) {
          console.error("Era orchestration failed:", err);
        } finally {
          setLoading(false);
        }
      }, 600);
    } else {
      setSelectedEra(null);
      setConductorResult(null);
      if (sliderDebounceRef.current) clearTimeout(sliderDebounceRef.current);
    }
  }, []);

  const eraColor = selectedEra
    ? ERA_META[selectedEra]?.color || "#b388ff"
    : "#4ecdc4";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <div
        style={{
          width: sidebarOpen ? "400px" : "0px",
          minWidth: sidebarOpen ? "400px" : "0px",
          height: "100%",
          background: "#0d0f1a",
          color: "#fff",
          transition: "all 0.3s ease",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          borderRight: sidebarOpen ? "1px solid #1e2235" : "none",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #1e2235",
            background: "linear-gradient(135deg, #0d0f1a 0%, #141832 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>🗺️</span>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  letterSpacing: "-0.3px",
                }}
              >
                Living Literary Map
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#666" }}>
                MCP-Orchestrated · Powered by Dedalus Labs
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats Dashboard ──────────────────────────────────── */}
        <div
          style={{
            padding: "10px 20px",
            borderBottom: "1px solid #1e2235",
            display: "flex",
            gap: "10px",
            justifyContent: "space-between",
          }}
        >
          {[
            { icon: "📚", val: stats.books, label: "books" },
            { icon: "📍", val: stats.locations, label: "places" },
            { icon: "🕰️", val: stats.eras, label: "eras" },
            { icon: "🌍", val: stats.regions, label: "regions" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center", flex: 1 }}>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: eraColor,
                  fontFamily: "monospace",
                }}
              >
                {s.icon} {s.val}
              </div>
              <div
                style={{
                  fontSize: "8px",
                  color: "#555",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Story Mode + Narration + Heatmap Controls ────────── */}
        <div
          style={{
            padding: "8px 20px",
            borderBottom: "1px solid #1e2235",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          {/* Story Mode */}
          <button
            onClick={storyPlaying ? stopStoryMode : startStoryMode}
            disabled={allFeatures.length === 0}
            style={{
              background: storyPlaying ? "#ff6b6b22" : "#141728",
              color: storyPlaying ? "#ff6b6b" : "#aaa",
              border: `1px solid ${storyPlaying ? "#ff6b6b66" : "#1e2235"}`,
              borderRadius: "6px",
              padding: "5px 10px",
              cursor: "pointer",
              fontSize: "10px",
              fontWeight: 600,
              fontFamily: "system-ui, sans-serif",
              transition: "all 0.2s",
              flex: 1,
            }}
          >
            {storyPlaying
              ? `⏹ Stop (${storyIndex + 1}/${allFeatures.length})`
              : "▶ Story Mode"}
          </button>
          {/* Narration */}
          <button
            onClick={() => {
              setNarrationEnabled(!narrationEnabled);
              if (narrationEnabled) window.speechSynthesis?.cancel();
            }}
            style={{
              background: narrationEnabled ? "#4ecdc422" : "#141728",
              color: narrationEnabled ? "#4ecdc4" : "#aaa",
              border: `1px solid ${narrationEnabled ? "#4ecdc466" : "#1e2235"}`,
              borderRadius: "6px",
              padding: "5px 10px",
              cursor: "pointer",
              fontSize: "10px",
              fontWeight: 600,
              fontFamily: "system-ui, sans-serif",
              transition: "all 0.2s",
            }}
          >
            {narrationEnabled ? "🔊 On" : "🔇 Narrate"}
          </button>
          {/* Heatmap */}
          <button
            onClick={() => setHeatmapOn(!heatmapOn)}
            style={{
              background: heatmapOn ? "#e6b80022" : "#141728",
              color: heatmapOn ? "#e6b800" : "#aaa",
              border: `1px solid ${heatmapOn ? "#e6b80066" : "#1e2235"}`,
              borderRadius: "6px",
              padding: "5px 10px",
              cursor: "pointer",
              fontSize: "10px",
              fontWeight: 600,
              fontFamily: "system-ui, sans-serif",
              transition: "all 0.2s",
            }}
          >
            {heatmapOn ? "🔥 Heatmap" : "🔥 Heat"}
          </button>
        </div>

        {/* Era Filter — Year Range Slider */}
        <div
          style={{ padding: "14px 20px", borderBottom: "1px solid #1e2235" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                color: "#555",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                fontWeight: 600,
              }}
            >
              🕰️ Time Window
            </p>
            {yearRange && (
              <button
                onClick={() => handleYearRangeChange(null)}
                style={{
                  background: "none",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  color: "#888",
                  fontSize: "9px",
                  padding: "2px 6px",
                  cursor: "pointer",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Reset
              </button>
            )}
          </div>

          {/* Range display */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                fontFamily: "monospace",
                color: yearRange ? eraColor : "#555",
              }}
            >
              {yearRange ? yearRange[0] : globalYearRange[0]}
            </span>
            <span style={{ fontSize: "10px", color: "#555", padding: "0 8px" }}>
              {yearRange
                ? `${selectedEra || ""} · ${yearRange[1] - yearRange[0]} yr span`
                : "All eras"}
            </span>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                fontFamily: "monospace",
                color: yearRange ? eraColor : "#555",
              }}
            >
              {yearRange ? yearRange[1] : globalYearRange[1]}
            </span>
          </div>

          {/* Dual range slider */}
          <div
            style={{ position: "relative", height: "36px", padding: "0 2px" }}
          >
            {/* Track background */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                left: 0,
                right: 0,
                height: "4px",
                background: "#1a1d2e",
                borderRadius: "2px",
              }}
            />
            {/* Active track */}
            {yearRange &&
              (() => {
                const span = globalYearRange[1] - globalYearRange[0] || 1;
                const leftPct =
                  ((yearRange[0] - globalYearRange[0]) / span) * 100;
                const rightPct =
                  ((yearRange[1] - globalYearRange[0]) / span) * 100;
                return (
                  <div
                    style={{
                      position: "absolute",
                      top: "16px",
                      height: "4px",
                      left: `${leftPct}%`,
                      width: `${rightPct - leftPct}%`,
                      background: `linear-gradient(90deg, ${eraColor}, ${eraColor}88)`,
                      borderRadius: "2px",
                    }}
                  />
                );
              })()}
            {/* Min slider */}
            <input
              type="range"
              min={globalYearRange[0]}
              max={globalYearRange[1]}
              step={1}
              value={yearRange ? yearRange[0] : globalYearRange[0]}
              onChange={(e) => {
                const v = Number(e.target.value);
                const curMax = yearRange ? yearRange[1] : globalYearRange[1];
                handleYearRangeChange([Math.min(v, curMax - 1), curMax]);
              }}
              style={{
                position: "absolute",
                top: "6px",
                left: 0,
                width: "100%",
                WebkitAppearance: "none",
                appearance: "none",
                background: "transparent",
                pointerEvents: "none",
                height: "24px",
                margin: 0,
                zIndex: 3,
              }}
              className="era-slider"
            />
            {/* Max slider */}
            <input
              type="range"
              min={globalYearRange[0]}
              max={globalYearRange[1]}
              step={1}
              value={yearRange ? yearRange[1] : globalYearRange[1]}
              onChange={(e) => {
                const v = Number(e.target.value);
                const curMin = yearRange ? yearRange[0] : globalYearRange[0];
                handleYearRangeChange([curMin, Math.max(v, curMin + 1)]);
              }}
              style={{
                position: "absolute",
                top: "6px",
                left: 0,
                width: "100%",
                WebkitAppearance: "none",
                appearance: "none",
                background: "transparent",
                pointerEvents: "none",
                height: "24px",
                margin: 0,
                zIndex: 4,
              }}
              className="era-slider"
            />
          </div>

          {/* Era quick-select chips */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginTop: "6px",
              flexWrap: "wrap",
            }}
          >
            {Object.entries(ERA_META).map(([era, meta]) => {
              const decade = parseInt(era);
              const isActive =
                yearRange &&
                yearRange[0] <= decade &&
                yearRange[1] >= decade + 9;
              return (
                <button
                  key={era}
                  onClick={() => handleYearRangeChange([decade, decade + 9])}
                  style={{
                    background: isActive ? `${meta.color}22` : "#141728",
                    color: isActive ? meta.color : "#666",
                    border: `1px solid ${isActive ? meta.color + "66" : "#1e2235"}`,
                    borderRadius: "6px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: "10px",
                    fontWeight: isActive ? 700 : 400,
                    transition: "all 0.2s ease",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {meta.icon} {era}
                </button>
              );
            })}
          </div>
        </div>

        {/* Agent Status */}
        <div
          style={{ padding: "10px 20px", borderBottom: "1px solid #1e2235" }}
        >
          <p
            style={{
              fontSize: "10px",
              color: "#555",
              margin: "0 0 6px",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              fontWeight: 600,
            }}
          >
            MCP Agent Pipeline
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            {[
              { name: "Conductor", icon: "🎼", desc: "Orchestrator" },
              { name: "Librarian", icon: "📚", desc: "Search" },
              { name: "Archivist", icon: "🏛", desc: "Data" },
              { name: "Linguist", icon: "🗣", desc: "Language" },
              { name: "Stylist", icon: "🎨", desc: "Visual" },
            ].map((a) => (
              <div key={a.name} style={{ textAlign: "center", flex: 1 }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    margin: "0 auto 4px",
                    background: loading ? "#1a1d2e" : "#141728",
                    border: `1px solid ${loading ? "#e6b800" : "#252840"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    animation: loading ? "pulse 1.2s ease infinite" : "none",
                  }}
                >
                  {a.icon}
                </div>
                <p style={{ fontSize: "9px", color: "#666", margin: 0 }}>
                  {a.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Content — scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Book Search */}
          <div
            style={{
              marginBottom: "12px",
              borderBottom: "1px solid #1e2235",
              paddingBottom: "12px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                color: "#555",
                margin: "0 0 8px",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                fontWeight: 600,
              }}
            >
              📚 Book Discovery — LibrarianAgent
            </p>
            <BookSearch
              onBookSelect={handleBookSelect}
              onLocationsExtracted={setUploadedBookLocations}
              onLocationClick={handleMarkerClick}
              accentColor={eraColor}
            />
          </div>

          {/* PDF Book Upload */}
          <div
            style={{
              marginBottom: "12px",
              borderBottom: "1px solid #1e2235",
              paddingBottom: "12px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                color: "#555",
                margin: "0 0 8px",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                fontWeight: 600,
              }}
            >
              📄 Upload Book PDF — AI Location Extraction
            </p>
            <BookUpload
              accentColor={eraColor}
              onLocationsExtracted={setUploadedBookLocations}
            />
          </div>

          {/* Loading */}
          {loading && (
            <div
              style={{ textAlign: "center", padding: "30px 0", color: "#888" }}
            >
              <div
                style={{
                  fontSize: "32px",
                  marginBottom: "12px",
                  animation: "spin 2s linear infinite",
                }}
              >
                🎼
              </div>
              <p style={{ fontSize: "13px", margin: "0 0 4px" }}>
                Conductor delegating tasks...
              </p>
              <p style={{ fontSize: "11px", color: "#555" }}>
                ArchivistAgent · LinguistAgent · StylistAgent
              </p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !conductorResult && (
            <div
              style={{ textAlign: "center", padding: "30px 0", color: "#444" }}
            >
              <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📍</p>
              <p style={{ fontSize: "13px", color: "#666", margin: "0 0 6px" }}>
                Click a marker on the map
              </p>
              <p style={{ fontSize: "11px", color: "#444", lineHeight: 1.5 }}>
                Each click triggers the{" "}
                <strong style={{ color: "#e6b800" }}>ConductorAgent</strong>{" "}
                which delegates to 3 specialist MCP servers in parallel
              </p>
            </div>
          )}

          {/* Results */}
          {!loading && conductorResult && (
            <>
              {/* Delegation Timeline */}
              <DelegationTimeline timeline={timeline} totalMs={totalMs} />

              {/* Conductor Synthesis */}
              {synthesis && (
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #1a1040 0%, #0d0f1a 100%)",
                    borderRadius: "8px",
                    padding: "14px",
                    marginBottom: "14px",
                    border: "1px solid #2a1d5e",
                  }}
                >
                  <p
                    style={{
                      fontSize: "10px",
                      color: "#b388ff",
                      margin: "0 0 6px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    🎼 Conductor Synthesis
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#ddd",
                      margin: 0,
                      lineHeight: 1.6,
                      fontStyle: "italic",
                    }}
                  >
                    "{synthesis}"
                  </p>
                </div>
              )}

              {/* Archivist Panel */}
              {archivist && (
                <div
                  style={{
                    background: "#141728",
                    borderRadius: "8px",
                    padding: "14px",
                    marginBottom: "12px",
                    border: "1px solid #1e2235",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>🏛</span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: eraColor,
                        fontWeight: 700,
                      }}
                    >
                      ArchivistAgent
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#555",
                        marginLeft: "auto",
                        fontFamily: "monospace",
                      }}
                    >
                      get_historical_context
                    </span>
                  </div>
                  <h3
                    style={{
                      margin: "0 0 4px",
                      fontSize: "15px",
                      color: "#eee",
                    }}
                  >
                    {archivist.book}
                  </h3>
                  <blockquote
                    style={{
                      borderLeft: `3px solid ${eraColor}`,
                      paddingLeft: "10px",
                      margin: "8px 0",
                      fontStyle: "italic",
                      fontSize: "13px",
                      color: "#bbb",
                      lineHeight: 1.6,
                    }}
                  >
                    "{archivist.quote}"
                  </blockquote>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      margin: "8px 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {archivist.historical_context}
                  </p>
                  {archivist.ai_insight && (
                    <div
                      style={{
                        background: "#1e2140",
                        borderRadius: "6px",
                        padding: "10px",
                        marginTop: "8px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "9px",
                          color: "#e6b800",
                          margin: "0 0 4px",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        ✨ AI Deep Dive (Dedalus)
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#ddd",
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {archivist.ai_insight}
                      </p>
                    </div>
                  )}
                  {archivist.dialect_note && (
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#4ecdc4",
                        margin: "8px 0 0",
                      }}
                    >
                      🗣 {archivist.dialect_note}
                    </p>
                  )}
                </div>
              )}

              {/* Linguist Panel */}
              {linguist && (
                <div
                  style={{
                    background: "#141728",
                    borderRadius: "8px",
                    padding: "14px",
                    marginBottom: "12px",
                    border: "1px solid #1e2235",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>🗣</span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#ff6b6b",
                        fontWeight: 700,
                      }}
                    >
                      LinguistAgent
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#888",
                        marginLeft: "4px",
                      }}
                    >
                      — {linguist.era_label}
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#555",
                        marginLeft: "auto",
                        fontFamily: "monospace",
                      }}
                    >
                      analyze_period_dialect
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px",
                      marginBottom: "10px",
                    }}
                  >
                    {linguist.slang?.map((s) => (
                      <span
                        key={s.term}
                        title={s.meaning}
                        style={{
                          background: "#1e2140",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          color: "#ff6b6b",
                          cursor: "help",
                          border: "1px solid #2a2d4e",
                          transition: "all 0.2s",
                        }}
                      >
                        {s.term}
                      </span>
                    ))}
                  </div>
                  {linguist.ai_blurb && (
                    <div
                      style={{
                        background: "#1e2140",
                        borderRadius: "6px",
                        padding: "10px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "9px",
                          color: "#ff6b6b",
                          margin: "0 0 4px",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        💡 Did You Know?
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#ccc",
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {linguist.ai_blurb}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Stylist Panel */}
              {stylist && (
                <div
                  style={{
                    background: "#141728",
                    borderRadius: "8px",
                    padding: "14px",
                    marginBottom: "12px",
                    border: "1px solid #1e2235",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>🎨</span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#4ecdc4",
                        fontWeight: 700,
                      }}
                    >
                      StylistAgent
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#888",
                        marginLeft: "4px",
                      }}
                    >
                      — {stylist.label}
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#555",
                        marginLeft: "auto",
                        fontFamily: "monospace",
                      }}
                    >
                      generate_map_style
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    {[
                      { label: "BG", color: stylist.background_color },
                      { label: "Accent", color: stylist.accent_color },
                    ].map((c) => (
                      <div
                        key={c.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <span
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "4px",
                            background: c.color,
                            border: "1px solid #444",
                            boxShadow: `0 0 8px ${c.color}44`,
                          }}
                        />
                        <span style={{ fontSize: "10px", color: "#888" }}>
                          {c.label}: {c.color}
                        </span>
                      </div>
                    ))}
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#888",
                        marginLeft: "auto",
                      }}
                    >
                      🔤 {stylist.font_suggestion}
                    </span>
                  </div>
                  {/* Mapbox style indicator */}
                  <div
                    style={{
                      background: "#0a0c18",
                      borderRadius: "4px",
                      padding: "6px 10px",
                      marginBottom: "8px",
                      fontFamily: "monospace",
                      fontSize: "10px",
                      color: "#666",
                    }}
                  >
                    style: {stylist.mapbox_style?.split("/").pop()}
                  </div>
                  {stylist.ai_suggestion && (
                    <div
                      style={{
                        background: "#1e2140",
                        borderRadius: "6px",
                        padding: "10px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "9px",
                          color: "#4ecdc4",
                          margin: "0 0 4px",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        💡 Visual Suggestion
                      </p>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#ccc",
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {stylist.ai_suggestion}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Ask About This Place — Chat ───────────────── */}
              <div
                style={{
                  background: "#0a0c18",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "14px",
                  border: "1px solid #1e2235",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    color: "#888",
                    margin: "0 0 8px",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    fontWeight: 700,
                  }}
                >
                  💬 Ask About This Place
                </p>

                {/* Chat messages */}
                {chatMessages.length > 0 && (
                  <div
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      marginBottom: "8px",
                    }}
                  >
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        style={{
                          marginBottom: "6px",
                          padding: "8px 10px",
                          background:
                            msg.role === "user" ? "#1a1d2e" : "#141728",
                          borderRadius: "6px",
                          borderLeft:
                            msg.role === "assistant"
                              ? `3px solid ${eraColor}`
                              : "none",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "11px",
                            color: msg.role === "user" ? "#aaa" : "#ddd",
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {msg.role === "user" ? "🧑 " : "🎼 "}
                          {msg.text}
                        </p>
                        {msg.ms > 0 && (
                          <span
                            style={{
                              fontSize: "9px",
                              color: "#555",
                              fontFamily: "monospace",
                            }}
                          >
                            {msg.ms}ms
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Chat input */}
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                    placeholder="Ask anything about this place..."
                    disabled={chatLoading}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      background: "#1a1d2e",
                      border: `1px solid ${chatInput ? eraColor : "#252840"}`,
                      borderRadius: "6px",
                      color: "#eee",
                      fontSize: "12px",
                      outline: "none",
                      fontFamily: "system-ui, sans-serif",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={chatLoading || !chatInput.trim()}
                    style={{
                      background: eraColor,
                      color: "#000",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 14px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 700,
                      opacity: chatLoading || !chatInput.trim() ? 0.4 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {chatLoading ? "⏳" : "→"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "10px 20px",
            borderTop: "1px solid #1e2235",
            fontSize: "9px",
            color: "#333",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Conductor → 3 MCP Agents</span>
          <span>Dedalus Labs · Mapbox · Google Street View</span>
        </div>
      </div>

      {/* ── Map ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative" }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 20,
            background: "rgba(13,15,26,0.9)",
            color: "#fff",
            border: "1px solid #2a2d3e",
            borderRadius: "8px",
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "14px",
            backdropFilter: "blur(10px)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
            transition: "all 0.2s",
          }}
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>
        <MapComponent
          onMarkerClick={handleMarkerClick}
          popupContent={popupContent}
          filterEra={selectedEra}
          yearRange={yearRange}
          stylistOverrides={stylist}
          uploadedBookLocations={uploadedBookLocations}
          heatmapOn={heatmapOn}
        />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.95); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Scrollbar styling */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0f1a; }
        ::-webkit-scrollbar-thumb { background: #2a2d3e; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #4ecdc4; }
        /* Range slider thumb styling */
        .era-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4ecdc4;
          border: 2px solid #0d0f1a;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 0 6px rgba(78,205,196,0.5);
        }
        .era-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #4ecdc4;
          border: 2px solid #0d0f1a;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 0 6px rgba(78,205,196,0.5);
        }
      `}</style>
    </div>
  );
}
