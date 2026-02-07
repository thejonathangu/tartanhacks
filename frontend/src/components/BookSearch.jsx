import React, { useState, useCallback, useRef } from "react";
import { fetchLibrarianSearch } from "../api/archivistClient";

/**
 * BookSearch — A search widget that queries the LibrarianAgent
 * (Open Library) and renders selectable book results.
 *
 * Props:
 *  - onBookSelect(book)  — called when the user clicks a book result
 *  - accentColor         — theme accent (defaults to #4ecdc4)
 */
export default function BookSearch({ onBookSelect, accentColor = "#4ecdc4" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
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
    </div>
  );
}
