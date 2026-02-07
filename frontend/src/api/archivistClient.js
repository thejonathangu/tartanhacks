




const MCP_BASE_URL = import.meta.env.VITE_MCP_BASE_URL || "";

// ─── Individual Agent Endpoints (direct calls) ─────────────────────

/**
 * LibrarianAgent — Search Open Library for books by title.
 * Returns { query, num_found, books: [...] }
 */
export async function fetchLibrarianSearch(query, limit = 10) {
  const res = await fetch(`${MCP_BASE_URL}/tools/librarian/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) throw new Error(`LibrarianAgent error: ${res.status}`);
  return res.json();
}

export async function fetchArchivistContext(landmarkId) {
  const res = await fetch(`${MCP_BASE_URL}/tools/archivist/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ landmark_id: landmarkId }),
  });
  if (!res.ok) throw new Error(`ArchivistAgent error: ${res.status}`);
  return res.json();
}

export async function fetchLinguistDialect(era) {
  const res = await fetch(`${MCP_BASE_URL}/tools/linguist/dialect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ era }),
  });
  if (!res.ok) throw new Error(`LinguistAgent error: ${res.status}`);
  return res.json();
}

export async function fetchStylistStyle(era) {
  const res = await fetch(`${MCP_BASE_URL}/tools/stylist/style`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ era }),
  });
  if (!res.ok) throw new Error(`StylistAgent error: ${res.status}`);
  return res.json();
}

/**
 * Upload a PDF file for location extraction
 * Returns { book_title, locations: [...], geojson: {...} }
 */
export async function uploadBookPDF(file, title = "") {
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);

  const res = await fetch(`${MCP_BASE_URL}/upload-book`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`PDF upload error: ${res.status}`);
  return res.json();
}

/**
 * Extract locations from a book title (no PDF needed).
 * Uses Dedalus AI to recall notable locations from the book.
 * Returns { book_title, author, locations_found, geojson: {...} }
 */
export async function fetchLocationsFromTitle(title, author = "", year = "") {
  const res = await fetch(`${MCP_BASE_URL}/extract-from-title`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, author, year }),
  });
  if (!res.ok) throw new Error(`Title extraction error: ${res.status}`);
  return res.json();
}

// ─── Conductor Endpoint (orchestrated parallel call) ────────────────

/**
 * The Conductor is the single "brain" that fans out parallel requests
 * to all 3 specialist MCP agents and returns a unified response
 * with a delegation timeline.
 */
export async function fetchConductorOrchestrate({ landmarkId, era, featureData }) {
  const body = {};
  if (landmarkId) body.landmark_id = landmarkId;
  if (era) body.era = era;
  if (featureData) body.feature_data = featureData;

  const res = await fetch(`${MCP_BASE_URL}/orchestrate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ConductorAgent error: ${res.status}`);
  return res.json();
}
