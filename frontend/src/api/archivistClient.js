const MCP_BASE_URL = import.meta.env.VITE_MCP_BASE_URL || "";

/**
 * Calls the ArchivistAgent MCP tool to fetch deeper literary/historical
 * context for a given landmark ID.
 *
 * This is the "handoff" — the frontend delegates to the MCP server,
 * which acts as the agentic orchestrator.
 *
 * In dev, Vite proxies /tools/* → Django on :8000.
 */
export async function fetchArchivistContext(landmarkId) {
  const res = await fetch(`${MCP_BASE_URL}/tools/archivist/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ landmark_id: landmarkId }),
  });

  if (!res.ok) {
    throw new Error(`ArchivistAgent error: ${res.status}`);
  }

  return res.json();
}
