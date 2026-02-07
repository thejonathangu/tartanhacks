import React, { useState, useCallback, useRef } from "react";
import {
  fetchLibrarianSearch,
  fetchLocationsFromTitle,
} from "../api/archivistClient";

/**
 * BookSearch — A search widget that queries the LibrarianAgent
 * (Open Library) and renders selectable book results.
 * After "Map It" extracts locations, switches to a location-list view.
 *
 * Props:
 *  - onBookSelect(book)            — called when the user clicks a book result
 *  - onLocationsExtracted(geojson) — called when locations are extracted from a title
 *  - onLocationClick(feature)      — called when a location row is clicked (fly-to + conductor)
 *  - accentColor                   — theme accent (defaults to #4ecdc4)
 */
export default function BookSearch({
  onBookSelect,
  onLocationsExtracted,
  onLocationClick,
  accentColor = "#4ecdc4",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [extracting, setExtracting] = useState(null); // book key currently extracting
  const [extractError, setExtractError] = useState(null);

  // "Mapped" state — after successful extraction
  const [mappedBook, setMappedBook] = useState(null);
  const [extractedLocations, setExtractedLocations] = useState(null); // GeoJSON
  const [activeLocationId, setActiveLocationId] = useState(null);

  const debounceRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setSelectedKey(null);
    try {
      const data = await fetchLibrarianSearch(q, 8);
      setResults(data);
    } catch (err) {
      console.error("LibrarianAgent search failed:", err);
      setError("Search failed — please try again.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    // Debounce 400ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      doSearch(query);
    }
  };

  const handleSelect = (book) => {
    setSelectedKey(book.key);
    if (onBookSelect) onBookSelect(book);
  };

  const handleExtractLocations = async (book, e) => {
    e.stopPropagation(); // Don't trigger book select
    setExtracting(book.key);
    setExtractError(null);
    try {
      const data = await fetchLocationsFromTitle(
        book.title,
        book.authors?.join(", ") || "",
        book.first_publish_year ? String(book.first_publish_year) : "",
      );
      if (data.geojson && data.geojson.features.length > 0) {
        if (onLocationsExtracted) onLocationsExtracted(data.geojson);
        // Transition to mapped view
        setMappedBook(book);
        setExtractedLocations(data.geojson);
        setResults(null);
        setQuery("");
        setSelectedKey(null);
      } else {
        setExtractError("No locations found for this book.");
      }
    } catch (err) {
      console.error("Location extraction failed:", err);
      setExtractError("Extraction failed — please try again.");
    } finally {
      setExtracting(null);
    }
  };

  const handleBackToSearch = () => {
    setMappedBook(null);
    setExtractedLocations(null);
    setActiveLocationId(null);
  };

  const handleLocationClick = (feature) => {
    setActiveLocationId(feature.properties.id);
    if (onLocationClick) onLocationClick(feature);
  };

  /* ── Mapped View — after successful extraction ─────────────── */
  if (mappedBook && extractedLocations) {
    const features = extractedLocations.features || [];
    // Sort locations by rank (1 = most important, N = least important)
    const sortedFeatures = [...features].sort((a, b) => {
      const rankA = a.properties.rank || 999;
      const rankB = b.properties.rank || 999;
      return rankA - rankB;
    });
    return (
      <div style={{ marginBottom: "14px" }}>
        {/* Back button */}
        <button
          onClick={handleBackToSearch}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            color: "#888",
            fontSize: "11px",
            cursor: "pointer",
            padding: "0 0 10px",
            fontFamily: "system-ui, sans-serif",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = accentColor)}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}
        >
          ← Back to search
        </button>

        {/* Mapped book card */}
        <div
          style={{
            background: "linear-gradient(135deg, #0a2a1a 0%, #0d0f1a 100%)",
            borderRadius: "8px",
            padding: "12px",
            border: `1px solid ${accentColor}33`,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {mappedBook.cover_url ? (
            <img
              src={mappedBook.cover_url}
              alt={mappedBook.title}
              style={{
                width: "36px",
                height: "52px",
                objectFit: "cover",
                borderRadius: "4px",
                flexShrink: 0,
              }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div
              style={{
                width: "36px",
                height: "52px",
                background: "#0a0c18",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
              }}
            >
              📖
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                fontWeight: 700,
                color: accentColor,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {mappedBook.title}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#999" }}>
              {mappedBook.authors?.join(", ") || "Unknown author"}
              {mappedBook.first_publish_year
                ? ` · ${mappedBook.first_publish_year}`
                : ""}
            </p>
          </div>
        </div>

        {/* Locations header */}
        <p
          style={{
            fontSize: "10px",
            color: "#666",
            margin: "0 0 8px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontWeight: 600,
          }}
        >
          📍 {sortedFeatures.length} location{sortedFeatures.length !== 1 ? "s" : ""}{" "}
          extracted
        </p>

        {/* Locations list */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {sortedFeatures.map((feature) => {
            const p = feature.properties;
            const isActive = activeLocationId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleLocationClick(feature)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "10px 12px",
                  background: isActive ? `${accentColor}18` : "#141728",
                  border: `1px solid ${isActive ? accentColor : "#1e2235"}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  width: "100%",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: "2px",
                    minWidth: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isActive ? accentColor : `${accentColor}33`,
                    color: isActive ? "#000" : "#fff",
                    borderRadius: "6px",
                  }}
                >
                  {p.rank || "?"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      fontWeight: 600,
                      color: isActive ? accentColor : "#eee",
                      lineHeight: 1.3,
                    }}
                  >
                    {p.title}
                  </p>
                  {p.era && (
                    <span
                      style={{
                        fontSize: "9px",
                        padding: "1px 6px",
                        marginTop: "4px",
                        display: "inline-block",
                        background: `${accentColor}15`,
                        border: `1px solid ${accentColor}33`,
                        borderRadius: "4px",
                        color: accentColor,
                        fontWeight: 600,
                      }}
                    >
                      {p.era}
                      {p.year ? ` · ${p.year}` : ""}
                    </span>
                  )}
                  {p.quote && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: "10px",
                        color: "#777",
                        fontStyle: "italic",
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      &ldquo;{p.quote}&rdquo;
                    </p>
                  )}
                  {p.mood && (
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        marginTop: "4px",
                        flexWrap: "wrap",
                      }}
                    >
                      {p.mood
                        .split(",")
                        .slice(0, 3)
                        .map((m, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: "8px",
                              padding: "1px 5px",
                              background: "#0a0c18",
                              borderRadius: "4px",
                              color: "#888",
                            }}
                          >
                            {m.trim()}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
                {isActive && (
                  <span
                    style={{
                      fontSize: "12px",
                      color: accentColor,
                      flexShrink: 0,
                      alignSelf: "center",
                    }}
                  >
                    ▶
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Search View (default) ────────────────────────────────────── */
  return (
    <div style={{ marginBottom: "14px" }}>
      {/* Search Input */}
      <div style={{ position: "relative", marginBottom: "10px" }}>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search for a book title..."
          style={{
            width: "100%",
            padding: "10px 38px 10px 12px",
            background: "#1a1d2e",
            border: `1px solid ${query ? accentColor : "#252840"}`,
            borderRadius: "8px",
            color: "#eee",
            fontSize: "13px",
            outline: "none",
            fontFamily: "system-ui, sans-serif",
            transition: "border-color 0.2s",
            boxSizing: "border-box",
          }}
        />
        <span
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "14px",
            color: "#555",
            pointerEvents: "none",
          }}
        >
          {loading ? "⏳" : "🔍"}
        </span>
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: "11px", color: "#ff6b6b", margin: "0 0 8px" }}>
          {error}
        </p>
      )}

      {/* Results count */}
      {results && !loading && (
        <p
          style={{
            fontSize: "10px",
            color: "#666",
            margin: "0 0 8px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          📚 {results.num_found.toLocaleString()} results for "{results.query}"
        </p>
      )}

      {/* Results list */}
      {results?.books?.length > 0 && (
        <div
          style={{
            maxHeight: "340px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {results.books.map((book) => {
            const isSelected = selectedKey === book.key;
            return (
              <button
                key={book.key}
                onClick={() => handleSelect(book)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "10px",
                  background: isSelected ? `${accentColor}15` : "#141728",
                  border: `1px solid ${isSelected ? accentColor : "#1e2235"}`,
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                  width: "100%",
                }}
              >
                {/* Cover */}
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    style={{
                      width: "40px",
                      height: "58px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      background: "#0a0c18",
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "40px",
                      height: "58px",
                      background: "#0a0c18",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      flexShrink: 0,
                    }}
                  >
                    📖
                  </div>
                )}

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: 600,
                      color: isSelected ? accentColor : "#eee",
                      lineHeight: 1.3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {book.title}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "11px",
                      color: "#999",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {book.authors?.length
                      ? book.authors.join(", ")
                      : "Unknown author"}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "4px",
                      fontSize: "10px",
                      color: "#666",
                    }}
                  >
                    {book.first_publish_year && (
                      <span>📅 {book.first_publish_year}</span>
                    )}
                    {book.edition_count > 0 && (
                      <span>📚 {book.edition_count} editions</span>
                    )}
                  </div>
                  {book.subjects?.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        marginTop: "4px",
                        flexWrap: "wrap",
                      }}
                    >
                      {book.subjects.slice(0, 3).map((s, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: "9px",
                            padding: "1px 5px",
                            background: "#0a0c18",
                            borderRadius: "4px",
                            color: "#888",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <span
                    style={{
                      fontSize: "14px",
                      color: accentColor,
                      flexShrink: 0,
                      alignSelf: "center",
                    }}
                  >
                    ✓
                  </span>
                )}

                {/* Extract Locations button */}
                <div
                  onClick={(e) => handleExtractLocations(book, e)}
                  title="Extract map locations from this book"
                  style={{
                    flexShrink: 0,
                    alignSelf: "center",
                    padding: "4px 8px",
                    background:
                      extracting === book.key ? "#2a2d3e" : `${accentColor}22`,
                    border: `1px solid ${accentColor}44`,
                    borderRadius: "6px",
                    cursor: extracting === book.key ? "wait" : "pointer",
                    fontSize: "10px",
                    color: accentColor,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                    opacity: extracting && extracting !== book.key ? 0.4 : 1,
                  }}
                >
                  {extracting === book.key ? "⏳ Extracting…" : "📍 Map It"}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* No results */}
      {results && results.books?.length === 0 && !loading && (
        <p
          style={{
            textAlign: "center",
            color: "#555",
            fontSize: "12px",
            padding: "16px 0",
          }}
        >
          No books found. Try a different title.
        </p>
      )}

      {/* Extract error */}
      {extractError && (
        <p
          style={{
            fontSize: "11px",
            color: "#ff6b6b",
            margin: "8px 0 0",
            textAlign: "center",
          }}
        >
          {extractError}
        </p>
      )}
    </div>
  );
}
