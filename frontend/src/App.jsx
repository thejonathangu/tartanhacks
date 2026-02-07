import React, { useState, useCallback, useEffect, useRef } from "react";
import MapComponent from "./components/MapComponent";
import { fetchConductorOrchestrate, fetchVibeSearch } from "./api/archivistClient";
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

const STEP_COLORS = {
  RECEIVED_REQUEST: "#888",
  REASONING: "#e6b800",
  DELEGATING: "#b388ff",
  TOOL_CALL: "#4ecdc4",
  RESULT: "#4caf50",
  ERROR: "#ff6b6b",
  SYNTHESIZING: "#b388ff",
  SYNTHESIS_COMPLETE: "#4caf50",
  COMPLETE: "#4ecdc4",
};

/* ── Detective Chain-of-Thought Component ──────────────────────── */
function DetectiveLog({ chain, isLive }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chain?.length]);

  if (!chain?.length) return null;
  return (
    <div style={{
      background: "#0a0c10", borderRadius: "8px", padding: "12px",
      marginBottom: "14px", border: "1px solid #1a1d2e",
      fontFamily: "'Fira Code', 'SF Mono', monospace",
      fontSize: "11px", maxHeight: "220px", overflowY: "auto",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        marginBottom: "10px", paddingBottom: "8px",
        borderBottom: "1px solid #1a1d2e",
      }}>
        <span style={{
          width: "8px", height: "8px", borderRadius: "50%",
          background: isLive ? "#4caf50" : "#666",
          boxShadow: isLive ? "0 0 8px #4caf50" : "none",
          animation: isLive ? "pulse 1.2s ease infinite" : "none",
        }} />
        <span style={{ color: "#888", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700 }}>
          🔍 Detective Mode — Agent Chain of Thought
        </span>
      </div>
      {chain.map((entry, i) => {
        const icon = AGENT_ICONS[entry.agent] || "⚙️";
        const stepColor = STEP_COLORS[entry.step] || "#888";
        return (
          <div key={i} style={{
            marginBottom: "4px", lineHeight: 1.5,
            animation: "fadeIn 0.3s ease",
          }}>
            <span style={{ color: "#555" }}>[{entry.ts}ms]</span>{" "}
            <span style={{ fontSize: "11px" }}>{icon}</span>{" "}
            <span style={{ color: stepColor, fontWeight: 600 }}>{entry.step}</span>{" "}
            <span style={{ color: "#aaa" }}>{entry.detail}</span>
          </div>
        );
      })}
      {isLive && (
        <div style={{ color: "#4ecdc4", animation: "blink 1s step-end infinite" }}>
          █
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

/* ── Delegation Timeline Component ─────────────────────────────── */
function DelegationTimeline({ timeline, totalMs }) {
  if (!timeline?.length) return null;
  return (
    <div style={{
      background: "#0a0c18", borderRadius: "8px", padding: "12px",
      marginBottom: "14px", border: "1px solid #1e2235",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "10px",
      }}>
        <p style={{
          fontSize: "10px", color: "#888", margin: 0,
          textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700,
        }}>
          ⚡ Orchestration Timeline
        </p>
        <span style={{ fontSize: "10px", color: "#4ecdc4", fontFamily: "monospace" }}>
          {totalMs}ms total
        </span>
      </div>
      {timeline.map((step, i) => {
        const icon = AGENT_ICONS[step.agent] || "⚙️";
        const isSuccess = step.status === "success";
        const barWidth = totalMs > 0 ? Math.max(8, (step.elapsed_ms / totalMs) * 100) : 50;
        return (
          <div key={i} style={{ marginBottom: "6px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px",
            }}>
              <span style={{ fontSize: "12px" }}>{icon}</span>
              <span style={{ fontSize: "10px", color: "#ccc", flex: 1 }}>{step.agent}</span>
              <code style={{ fontSize: "9px", color: "#666" }}>{step.tool}</code>
              <span style={{
                fontSize: "9px", fontFamily: "monospace",
                color: isSuccess ? "#4ecdc4" : step.status === "skipped" ? "#666" : "#ff6b6b",
              }}>
                {step.elapsed_ms}ms
              </span>
            </div>
            <div style={{ height: "3px", background: "#1a1d2e", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{
                width: `${barWidth}%`, height: "100%", borderRadius: "2px",
                background: isSuccess ? "linear-gradient(90deg, #4ecdc4, #44a8a0)"
                  : step.status === "skipped" ? "#333" : "#ff6b6b",
                transition: "width 0.6s ease",
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Fact-Checker: highlights source vs AI-generated ───────────── */
function FactCheckedContent({ archivist, eraColor }) {
  const [factCheckOn, setFactCheckOn] = useState(false);
  if (!archivist) return null;

  const sourceStyle = factCheckOn
    ? { background: "rgba(76, 175, 80, 0.15)", borderLeft: "3px solid #4caf50", paddingLeft: "8px", borderRadius: "4px", marginBottom: "6px", padding: "6px 8px" }
    : {};
  const aiStyle = factCheckOn
    ? { background: "rgba(66, 165, 245, 0.15)", borderLeft: "3px solid #42a5f5", paddingLeft: "8px", borderRadius: "4px" }
    : {};

  return (
    <div style={{
      background: "#141728", borderRadius: "8px", padding: "14px",
      marginBottom: "12px", border: "1px solid #1e2235",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px",
      }}>
        <span style={{ fontSize: "14px" }}>🏛</span>
        <span style={{ fontSize: "11px", color: eraColor, fontWeight: 700 }}>ArchivistAgent</span>
        <span style={{
          fontSize: "9px", color: "#555", marginLeft: "auto", fontFamily: "monospace",
        }}>
          get_historical_context
        </span>
      </div>

      {/* Fact-checker toggle */}
      <button
        onClick={() => setFactCheckOn(!factCheckOn)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: factCheckOn ? "rgba(66, 165, 245, 0.15)" : "#1a1d2e",
          border: `1px solid ${factCheckOn ? "#42a5f5" : "#252840"}`,
          borderRadius: "6px", padding: "6px 10px", marginBottom: "10px",
          cursor: "pointer", width: "100%", justifyContent: "center",
          transition: "all 0.2s",
        }}
      >
        <span style={{ fontSize: "12px" }}>{factCheckOn ? "🔍" : "🔎"}</span>
        <span style={{
          fontSize: "10px", fontWeight: 600,
          color: factCheckOn ? "#42a5f5" : "#888",
          textTransform: "uppercase", letterSpacing: "1px",
        }}>
          {factCheckOn ? "Fact-Check ON" : "Toggle Fact-Checker"}
        </span>
      </button>

      {factCheckOn && (
        <div style={{
          display: "flex", gap: "12px", marginBottom: "10px",
          fontSize: "9px", color: "#888",
        }}>
          <span><span style={{ color: "#4caf50" }}>■</span> Verified Source</span>
          <span><span style={{ color: "#42a5f5" }}>■</span> AI-Generated</span>
        </div>
      )}

      <h3 style={{ margin: "0 0 4px", fontSize: "15px", color: "#eee", ...sourceStyle }}>
        {archivist.book}
        {factCheckOn && (
          <span style={{ fontSize: "9px", color: "#4caf50", marginLeft: "8px" }}>
            📖 from knowledge base
          </span>
        )}
      </h3>
      <blockquote style={{
        borderLeft: `3px solid ${eraColor}`, paddingLeft: "10px",
        margin: "8px 0", fontStyle: "italic", fontSize: "13px",
        color: "#bbb", lineHeight: 1.6, ...sourceStyle,
      }}>
        &ldquo;{archivist.quote}&rdquo;
        {factCheckOn && (
          <span style={{ fontSize: "9px", color: "#4caf50", display: "block", marginTop: "4px", fontStyle: "normal" }}>
            ✓ Verified — direct literary quote
          </span>
        )}
      </blockquote>
      <p style={{
        fontSize: "12px", color: "#999", margin: "8px 0",
        lineHeight: 1.5, ...sourceStyle,
      }}>
        {archivist.historical_context}
        {factCheckOn && (
          <span style={{ fontSize: "9px", color: "#4caf50", display: "block", marginTop: "4px" }}>
            ✓ Verified — curated knowledge base ({archivist.year})
          </span>
        )}
      </p>
      {archivist.ai_insight && (
        <div style={{
          background: "#1e2140", borderRadius: "6px", padding: "10px",
          marginTop: "8px", ...aiStyle,
        }}>
          <p style={{
            fontSize: "9px", color: factCheckOn ? "#42a5f5" : "#e6b800",
            margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "1px",
          }}>
            {factCheckOn ? "🤖 AI-Generated (Dedalus GPT-4o)" : "✨ AI Deep Dive (Dedalus)"}
          </p>
          <p style={{ fontSize: "12px", color: "#ddd", margin: 0, lineHeight: 1.5 }}>
            {archivist.ai_insight}
          </p>
          {factCheckOn && (
            <p style={{ fontSize: "9px", color: "#42a5f5", margin: "6px 0 0" }}>
              ⚠ AI-generated content — may contain inaccuracies
            </p>
          )}
        </div>
      )}
      {archivist.dialect_note && (
        <p style={{
          fontSize: "11px", color: "#4ecdc4", margin: "8px 0 0", ...sourceStyle,
        }}>
          🗣 {archivist.dialect_note}
          {factCheckOn && (
            <span style={{ fontSize: "9px", color: "#4caf50", marginLeft: "8px" }}>✓ Curated</span>
          )}
        </p>
      )}
    </div>
  );
}

/* ── Vibe Search Component ─────────────────────────────────────── */
function VibeSearch({ onResultClick }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchMs, setSearchMs] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults(null);
    try {
      const data = await fetchVibeSearch(query);
      setResults(data.matches || []);
      setSearchMs(data.total_ms);
    } catch (err) {
      console.error("Vibe search failed:", err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{
      padding: "12px 20px", borderBottom: "1px solid #1e2235",
    }}>
      <p style={{
        fontSize: "10px", color: "#555", margin: "0 0 8px",
        textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600,
      }}>
        ✨ Vibe Search — search by feeling
      </p>
      <div style={{ display: "flex", gap: "6px" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder='a lonely rainy Sunday...'
          style={{
            flex: 1, background: "#1a1d2e", border: "1px solid #252840",
            borderRadius: "8px", padding: "8px 12px", color: "#ddd",
            fontSize: "12px", outline: "none", fontFamily: "system-ui, sans-serif",
          }}
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          style={{
            background: searching ? "#1a1d2e" : "linear-gradient(135deg, #b388ff, #7c4dff)",
            border: "none", borderRadius: "8px", padding: "8px 14px",
            color: "#fff", cursor: searching ? "wait" : "pointer",
            fontSize: "12px", fontWeight: 600, transition: "all 0.2s",
            minWidth: "60px",
          }}
        >
          {searching ? "..." : "🔮"}
        </button>
      </div>
      {results && (
        <div style={{ marginTop: "8px" }}>
          {searchMs && (
            <p style={{ fontSize: "9px", color: "#555", margin: "0 0 6px", fontFamily: "monospace" }}>
              Found {results.length} matches in {searchMs}ms via Dedalus AI
            </p>
          )}
          {results.map((match) => (
            <button
              key={match.landmark_id}
              onClick={() => onResultClick(match.landmark_id)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                background: "#141728", border: "1px solid #1e2235",
                borderRadius: "6px", padding: "8px 10px", marginBottom: "4px",
                cursor: "pointer", transition: "all 0.2s", color: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{
                  fontSize: "11px", fontWeight: 700,
                  color: ERA_META[match.era]?.color || "#fff",
                }}>
                  {ERA_META[match.era]?.icon} {match.book}
                </span>
                <span style={{
                  fontSize: "9px", color: "#b388ff", marginLeft: "auto",
                  fontFamily: "monospace",
                }}>
                  {Math.round((match.vibe_score || 0) * 100)}% match
                </span>
              </div>
              <p style={{
                fontSize: "10px", color: "#888", margin: "4px 0 0",
                lineHeight: 1.4,
              }}>
                {match.reason}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main App ──────────────────────────────────────────────────── */
export default function App() {
  const [popupContent, setPopupContent] = useState(null);
  const [selectedEra, setSelectedEra] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conductorResult, setConductorResult] = useState(null);
  const [flyToLandmark, setFlyToLandmark] = useState(null);

  /* ── Marker click → Conductor orchestration ─────────────────── */
  const handleMarkerClick = useCallback(async (feature) => {
    const geometry = feature.geometry
      ? { type: feature.geometry.type, coordinates: feature.geometry.coordinates.slice() }
      : null;
    const properties = { ...feature.properties };
    const { id, era } = properties;

    setSelectedEra(era);
    setLoading(true);
    setConductorResult(null);
    setSidebarOpen(true);

    try {
      const result = await fetchConductorOrchestrate({ landmarkId: id, era });
      setConductorResult(result);
      setPopupContent({
        geometry, properties,
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

  /* ── Era filter click → Conductor for Linguist + Stylist ────── */
  const handleEraClick = useCallback(async (era) => {
    const nextEra = selectedEra === era ? null : era;
    setSelectedEra(nextEra);
    if (!nextEra) {
      setConductorResult(null);
      return;
    }

    setLoading(true);
    try {
      const result = await fetchConductorOrchestrate({ era: nextEra });
      setConductorResult(result);
    } catch (err) {
      console.error("Era orchestration failed:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedEra]);

  /* ── Vibe search result click → fly to landmark ─────────────── */
  const handleVibeResultClick = useCallback((landmarkId) => {
    const feature = literaryGeoJSON.features.find(
      (f) => f.properties.id === landmarkId
    );
    if (feature) {
      setFlyToLandmark(feature);
      handleMarkerClick(feature);
    }
  }, [handleMarkerClick]);

  const eraColor = selectedEra ? ERA_META[selectedEra]?.color : "#4ecdc4";
  const archivist = conductorResult?.archivist;
  const linguist = conductorResult?.linguist;
  const stylist = conductorResult?.stylist;
  const synthesis = conductorResult?.synthesis;
  const timeline = conductorResult?.timeline;
  const totalMs = conductorResult?.total_ms;
  const chainOfThought = conductorResult?.chain_of_thought;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden" }}>
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <div style={{
        width: sidebarOpen ? "420px" : "0px",
        minWidth: sidebarOpen ? "420px" : "0px",
        height: "100%", background: "#0d0f1a", color: "#fff",
        transition: "all 0.3s ease", overflow: "hidden",
        display: "flex", flexDirection: "column",
        borderRight: sidebarOpen ? "1px solid #1e2235" : "none",
        fontFamily: "system-ui, sans-serif",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid #1e2235",
          background: "linear-gradient(135deg, #0d0f1a 0%, #141832 100%)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>🗺️</span>
            <div>
              <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>
                Living Literary Map
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#666" }}>
                MCP-Orchestrated · Powered by Dedalus Labs
              </p>
            </div>
          </div>
        </div>

        {/* Vibe Search */}
        <VibeSearch onResultClick={handleVibeResultClick} />

        {/* Era Filter */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #1e2235" }}>
          <p style={{
            fontSize: "10px", color: "#555", margin: "0 0 8px",
            textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600,
          }}>
            Filter by Era
          </p>
          <div style={{ display: "flex", gap: "6px" }}>
            {Object.entries(ERA_META).map(([era, meta]) => (
              <button
                key={era}
                onClick={() => handleEraClick(era)}
                style={{
                  flex: 1, background: selectedEra === era ? meta.color : "#1a1d2e",
                  color: selectedEra === era ? "#000" : "#999",
                  border: `1px solid ${selectedEra === era ? meta.color : "#252840"}`,
                  borderRadius: "8px", padding: "10px 4px", cursor: "pointer",
                  fontSize: "11px", fontWeight: selectedEra === era ? 700 : 400,
                  transition: "all 0.2s ease", textAlign: "center",
                }}
              >
                <span style={{ display: "block", fontSize: "18px", marginBottom: "2px" }}>
                  {meta.icon}
                </span>
                {era}
              </button>
            ))}
          </div>
        </div>

        {/* Agent Status */}
        <div style={{ padding: "8px 20px", borderBottom: "1px solid #1e2235" }}>
          <p style={{
            fontSize: "10px", color: "#555", margin: "0 0 6px",
            textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600,
          }}>
            MCP Agent Pipeline
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            {[
              { name: "Conductor", icon: "🎼", desc: "Orchestrator" },
              { name: "Archivist", icon: "🏛", desc: "Data" },
              { name: "Linguist", icon: "🗣", desc: "Language" },
              { name: "Stylist", icon: "🎨", desc: "Visual" },
            ].map((a) => (
              <div key={a.name} style={{ textAlign: "center", flex: 1 }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  margin: "0 auto 4px",
                  background: loading ? "#1a1d2e" : "#141728",
                  border: `1px solid ${loading ? "#e6b800" : "#252840"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px",
                  animation: loading ? "pulse 1.2s ease infinite" : "none",
                }}>
                  {a.icon}
                </div>
                <p style={{ fontSize: "9px", color: "#666", margin: 0 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Content — scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px" }}>
          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#888" }}>
              <div style={{
                fontSize: "32px", marginBottom: "12px",
                animation: "spin 2s linear infinite",
              }}>🎼</div>
              <p style={{ fontSize: "13px", margin: "0 0 4px" }}>Conductor delegating tasks...</p>
              <p style={{ fontSize: "11px", color: "#555" }}>
                ArchivistAgent · LinguistAgent · StylistAgent
              </p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !conductorResult && (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#444" }}>
              <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📍</p>
              <p style={{ fontSize: "13px", color: "#666", margin: "0 0 6px" }}>
                Click a marker or use Vibe Search
              </p>
              <p style={{ fontSize: "11px", color: "#444", lineHeight: 1.5 }}>
                Each action triggers the{" "}
                <strong style={{ color: "#e6b800" }}>ConductorAgent</strong>{" "}
                which delegates to 3 specialist MCP servers in parallel
              </p>
            </div>
          )}

          {/* Results */}
          {!loading && conductorResult && (
            <>
              {/* Detective Mode — Chain of Thought */}
              <DetectiveLog chain={chainOfThought} isLive={false} />

              {/* Delegation Timeline */}
              <DelegationTimeline timeline={timeline} totalMs={totalMs} />

              {/* Conductor Synthesis */}
              {synthesis && (
                <div style={{
                  background: "linear-gradient(135deg, #1a1040 0%, #0d0f1a 100%)",
                  borderRadius: "8px", padding: "14px", marginBottom: "14px",
                  border: "1px solid #2a1d5e",
                }}>
                  <p style={{
                    fontSize: "10px", color: "#b388ff", margin: "0 0 6px",
                    fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px",
                  }}>
                    🎼 Conductor Synthesis
                  </p>
                  <p style={{
                    fontSize: "13px", color: "#ddd", margin: 0,
                    lineHeight: 1.6, fontStyle: "italic",
                  }}>
                    &ldquo;{synthesis}&rdquo;
                  </p>
                </div>
              )}

              {/* Archivist Panel with Fact-Checker */}
              <FactCheckedContent archivist={archivist} eraColor={eraColor} />

              {/* Linguist Panel */}
              {linguist && (
                <div style={{
                  background: "#141728", borderRadius: "8px", padding: "14px",
                  marginBottom: "12px", border: "1px solid #1e2235",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    marginBottom: "8px",
                  }}>
                    <span style={{ fontSize: "14px" }}>🗣</span>
                    <span style={{ fontSize: "11px", color: "#ff6b6b", fontWeight: 700 }}>
                      LinguistAgent
                    </span>
                    <span style={{ fontSize: "10px", color: "#888", marginLeft: "4px" }}>
                      — {linguist.era_label}
                    </span>
                    <span style={{
                      fontSize: "9px", color: "#555", marginLeft: "auto",
                      fontFamily: "monospace",
                    }}>
                      analyze_period_dialect
                    </span>
                  </div>
                  <div style={{
                    display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px",
                  }}>
                    {linguist.slang?.map((s) => (
                      <span
                        key={s.term}
                        title={s.meaning}
                        style={{
                          background: "#1e2140", padding: "4px 10px",
                          borderRadius: "12px", fontSize: "11px", color: "#ff6b6b",
                          cursor: "help", border: "1px solid #2a2d4e",
                          transition: "all 0.2s",
                        }}
                      >
                        {s.term}
                      </span>
                    ))}
                  </div>
                  {linguist.ai_blurb && (
                    <div style={{ background: "#1e2140", borderRadius: "6px", padding: "10px" }}>
                      <p style={{
                        fontSize: "9px", color: "#ff6b6b", margin: "0 0 4px",
                        textTransform: "uppercase", letterSpacing: "1px",
                      }}>
                        �� Did You Know?
                      </p>
                      <p style={{ fontSize: "12px", color: "#ccc", margin: 0, lineHeight: 1.5 }}>
                        {linguist.ai_blurb}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Stylist Panel */}
              {stylist && (
                <div style={{
                  background: "#141728", borderRadius: "8px", padding: "14px",
                  marginBottom: "12px", border: "1px solid #1e2235",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    marginBottom: "8px",
                  }}>
                    <span style={{ fontSize: "14px" }}>🎨</span>
                    <span style={{ fontSize: "11px", color: "#4ecdc4", fontWeight: 700 }}>
                      StylistAgent
                    </span>
                    <span style={{ fontSize: "10px", color: "#888", marginLeft: "4px" }}>
                      — {stylist.label}
                    </span>
                    <span style={{
                      fontSize: "9px", color: "#555", marginLeft: "auto",
                      fontFamily: "monospace",
                    }}>
                      generate_map_style
                    </span>
                  </div>
                  <div style={{
                    display: "flex", gap: "8px", alignItems: "center",
                    marginBottom: "10px",
                  }}>
                    {[
                      { label: "BG", color: stylist.background_color },
                      { label: "Accent", color: stylist.accent_color },
                    ].map((c) => (
                      <div key={c.label} style={{
                        display: "flex", alignItems: "center", gap: "5px",
                      }}>
                        <span style={{
                          width: "16px", height: "16px", borderRadius: "4px",
                          background: c.color, border: "1px solid #444",
                          boxShadow: `0 0 8px ${c.color}44`,
                        }} />
                        <span style={{ fontSize: "10px", color: "#888" }}>
                          {c.label}: {c.color}
                        </span>
                      </div>
                    ))}
                    <span style={{
                      fontSize: "10px", color: "#888", marginLeft: "auto",
                    }}>
                      🔤 {stylist.font_suggestion}
                    </span>
                  </div>
                  <div style={{
                    background: "#0a0c18", borderRadius: "4px", padding: "6px 10px",
                    marginBottom: "8px", fontFamily: "monospace", fontSize: "10px",
                    color: "#666",
                  }}>
                    style: {stylist.mapbox_style?.split("/").pop()}
                  </div>
                  {stylist.ai_suggestion && (
                    <div style={{ background: "#1e2140", borderRadius: "6px", padding: "10px" }}>
                      <p style={{
                        fontSize: "9px", color: "#4ecdc4", margin: "0 0 4px",
                        textTransform: "uppercase", letterSpacing: "1px",
                      }}>
                        💡 Visual Suggestion
                      </p>
                      <p style={{ fontSize: "12px", color: "#ccc", margin: 0, lineHeight: 1.5 }}>
                        {stylist.ai_suggestion}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "10px 20px", borderTop: "1px solid #1e2235",
          fontSize: "9px", color: "#333", display: "flex", justifyContent: "space-between",
        }}>
          <span>Conductor → 3 MCP Agents</span>
          <span>Dedalus Labs · Mapbox · Google Street View</span>
        </div>
      </div>

      {/* ── Map ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative" }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: "absolute", top: "10px", left: "10px", zIndex: 20,
            background: "rgba(13,15,26,0.9)", color: "#fff",
            border: "1px solid #2a2d3e", borderRadius: "8px",
            padding: "8px 12px", cursor: "pointer", fontSize: "14px",
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
          stylistOverrides={stylist}
          flyToLandmark={flyToLandmark}
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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0d0f1a; }
        ::-webkit-scrollbar-thumb { background: #2a2d3e; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #4ecdc4; }
      `}</style>
    </div>
  );
}
