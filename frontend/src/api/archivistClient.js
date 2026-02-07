const MCP_BASE_URL = import.meta.env.VITE_MCP_BASE_URL || "";

// ─── Individual Agent Endpoints (direct calls) ─────────────────────

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

// ─── Conductor Endpoint (orchestrated parallel call) ────────────────

/**
 * The Conductor is the single "brain" that fans out parallel requests
 * to all 3 specialist MCP agents and returns a unified response
 * with a delegation timeline.
 */
export async function fetchConductorOrchestrate({ landmarkId, era }) {
  const body = {};
  if (landmarkId) body.landmark_id = landmarkId;
  if (era) body.era = era;

  const res = await fetch(`${MCP_BASE_URL}/orchestrate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`ConductorAgent error: ${res.status}`);
  return res.json();
}

// ─── Vibe Search Endpoint (semantic / feeling-based search) ─────────

/**
 * Semantic "Vibe Search" — search by feelings, not addresses.
 * e.g. "Show me somewhere that feels like a lonely rainy Sunday"
 */
export async function fetchVibeSearch(query) {
  const res = await fetch(`${MCP_BASE_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`VibeSearch error: ${res.status}`);
  return res.json();
}

// ─── Book PDF Upload Endpoint ───────────────────────────────────────

/**
 * Upload a book PDF and extract geographic locations via AI.
 * Returns a GeoJSON FeatureCollection with the extracted points.
 */
export async function uploadBookPDF(file, title = "") {
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);

  const res = await fetch(`${MCP_BASE_URL}/upload-book`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload error: ${res.status}`);
  }
  return res.json();
}
