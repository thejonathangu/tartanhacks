import React, { useState, useRef } from "react";
import { uploadBookPDF } from "../api/archivistClient";

/**
 * BookUpload — PDF upload panel for the sidebar.
 * Lets users drag-and-drop or browse for a PDF, optionally set a title,
 * then calls the backend to extract locations and add them to the map.
 */
export default function BookUpload({ onLocationsExtracted }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (f && f.type === "application/pdf") {
      setFile(f);
      setError(null);
      setResult(null);
      // Auto-fill title from filename if empty
      if (!title) {
        const name = f.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " ");
        setTitle(name.replace(/\b\w/g, (c) => c.toUpperCase()));
      }
    } else {
      setError("Please select a PDF file");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const data = await uploadBookPDF(file, title);
      setResult(data);
      if (data.geojson && data.geojson.features.length > 0) {
        onLocationsExtracted(data.geojson, title || data.book_title);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setTitle("");
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={{
      padding: "12px 20px", borderBottom: "1px solid #1e2235",
    }}>
      <p style={{
        fontSize: "10px", color: "#555", margin: "0 0 8px",
        textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600,
      }}>
        📖 Upload a Book PDF
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "#4ecdc4" : file ? "#4caf50" : "#252840"}`,
          borderRadius: "8px",
          padding: file ? "10px 12px" : "20px 12px",
          textAlign: "center",
          cursor: "pointer",
          background: dragOver ? "rgba(78,205,196,0.05)" : file ? "rgba(76,175,80,0.05)" : "#0d0f1a",
          transition: "all 0.2s",
          marginBottom: "8px",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {file ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>📄</span>
            <div style={{ flex: 1, textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: "12px", color: "#ddd", fontWeight: 600 }}>
                {file.name}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#666" }}>
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              style={{
                background: "none", border: "none", color: "#666",
                cursor: "pointer", fontSize: "14px", padding: "4px",
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <span style={{ fontSize: "28px", display: "block", marginBottom: "4px" }}>📤</span>
            <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
              Drop a PDF here or <span style={{ color: "#4ecdc4", textDecoration: "underline" }}>browse</span>
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#555" }}>
              Extracts locations via AI
            </p>
          </>
        )}
      </div>

      {/* Title input */}
      {file && (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Book title (optional)"
          style={{
            width: "100%", background: "#1a1d2e", border: "1px solid #252840",
            borderRadius: "8px", padding: "8px 12px", color: "#ddd",
            fontSize: "12px", outline: "none", fontFamily: "system-ui, sans-serif",
            marginBottom: "8px", boxSizing: "border-box",
          }}
        />
      )}

      {/* Upload button */}
      {file && !result && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{
            width: "100%",
            background: uploading
              ? "#1a1d2e"
              : "linear-gradient(135deg, #4ecdc4, #44a8a0)",
            border: "none", borderRadius: "8px", padding: "10px",
            color: uploading ? "#888" : "#000",
            cursor: uploading ? "wait" : "pointer",
            fontSize: "12px", fontWeight: 700, transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}
        >
          {uploading ? (
            <>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
              Extracting locations...
            </>
          ) : (
            <>📍 Extract Locations</>
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(255,107,107,0.1)", border: "1px solid #ff6b6b33",
          borderRadius: "6px", padding: "8px 10px", marginTop: "8px",
        }}>
          <p style={{ margin: 0, fontSize: "11px", color: "#ff6b6b" }}>
            ⚠ {error}
          </p>
        </div>
      )}

      {/* Success result */}
      {result && !error && (
        <div style={{
          background: "rgba(76,175,80,0.1)", border: "1px solid #4caf5033",
          borderRadius: "6px", padding: "10px", marginTop: "8px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <span style={{ fontSize: "14px" }}>✅</span>
            <span style={{ fontSize: "12px", color: "#4caf50", fontWeight: 700 }}>
              {result.locations_found} location{result.locations_found !== 1 ? "s" : ""} found
            </span>
          </div>
          {[...(result.geojson?.features || [])]
            .sort((a, b) => (a.properties.rank || 999) - (b.properties.rank || 999))
            .map((f, i) => (
            <div key={i} style={{
              background: "#0d0f1a", borderRadius: "4px",
              padding: "8px 10px", marginBottom: "4px",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span style={{
                fontSize: "12px",
                fontWeight: 700,
                minWidth: "22px",
                height: "22px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#4ecdc433",
                color: "#4ecdc4",
                borderRadius: "5px",
                flexShrink: 0,
              }}>
                {f.properties.rank || "?"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: "#4ecdc4", fontWeight: 600 }}>
                  {f.properties.title}
                </span>
                {f.properties.era && (
                  <span style={{ color: "#555", marginLeft: "6px" }}>
                    {f.properties.era}
                  </span>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={handleClear}
            style={{
              width: "100%", marginTop: "6px",
              background: "transparent", border: "1px solid #252840",
              borderRadius: "6px", padding: "6px",
              color: "#888", cursor: "pointer", fontSize: "11px",
            }}
          >
            Upload another book
          </button>
        </div>
      )}
    </div>
  );
}
