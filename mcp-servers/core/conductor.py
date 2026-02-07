"""
ConductorAgent — The orchestration "brain" of the Living Literary Map.

This is the single entry-point the frontend calls.  It:
  1. Receives a user action (marker click or era selection).
  2. Reasons about which specialist MCP tools to invoke.
  3. Fans out PARALLEL requests to the ArchivistAgent, LinguistAgent,
     and StylistAgent.
  4. Merges the results and returns a unified response with a visible
     delegation timeline and chain-of-thought reasoning — perfect for
     hackathon demos.

This demonstrates Modular Orchestration: each task is handled by the
specialist best suited for it, coordinated by a single Conductor.
"""

import json
import time
from concurrent.futures import ThreadPoolExecutor

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from archivist.knowledge_base import KNOWLEDGE_BASE
from archivist.views import _archivist_lookup
from linguist.views import _linguist_dialect
from stylist.views import _stylist_style
from core.dedalus_client import dedalus_chat


CONDUCTOR_SYSTEM_PROMPT = (
    "You are the ConductorAgent, an AI orchestrator for a Living Literary Map. "
    "You have just received the combined output of three specialist agents: "
    "the ArchivistAgent (historical facts), LinguistAgent (era slang), and "
    "StylistAgent (visual design). Synthesize their outputs into one vivid, "
    "2-sentence narrative summary that ties the location, language, and "
    "visual atmosphere together. Be poetic but factual."
)


def _timed_call(name, fn, *args):
    """Execute fn(*args) and return (name, result, elapsed_ms)."""
    t0 = time.perf_counter()
    try:
        result = fn(*args)
        elapsed = round((time.perf_counter() - t0) * 1000)
        return name, result, elapsed, None
    except Exception as exc:
        elapsed = round((time.perf_counter() - t0) * 1000)
        return name, None, elapsed, str(exc)


@csrf_exempt
@require_POST
def orchestrate(request):
    """
    POST /orchestrate
    Body: { "landmark_id": "hr-harlem" }
       OR { "era": "1920s" }
       OR { "landmark_id": "hr-harlem", "era": "1920s" }

    Returns a unified response with delegation timeline and chain-of-thought.
    """
    t_start = time.perf_counter()

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    landmark_id = body.get("landmark_id")
    era = body.get("era")

    # If we have a landmark_id, infer the era from the knowledge base
    if landmark_id and not era:
        entry = KNOWLEDGE_BASE.get(landmark_id)
        if entry:
            era = entry.get("era")

    if not landmark_id and not era:
        return JsonResponse(
            {"error": "Provide at least landmark_id or era"}, status=400
        )

    # ── Chain of Thought — visible reasoning steps ──────────────────
    chain_of_thought = []

    def cot(agent, step, detail=""):
        chain_of_thought.append({
            "agent": agent,
            "step": step,
            "detail": detail,
            "ts": round((time.perf_counter() - t_start) * 1000),
        })

    cot("ConductorAgent", "RECEIVED_REQUEST",
        f"landmark_id={landmark_id}, era={era}")

    delegates = []
    if landmark_id:
        delegates.append("ArchivistAgent")
        cot("ConductorAgent", "REASONING",
            f"landmark_id present → delegating to ArchivistAgent for historical context")
    if era:
        delegates.append("LinguistAgent")
        delegates.append("StylistAgent")
        cot("ConductorAgent", "REASONING",
            f"era={era} → delegating to LinguistAgent + StylistAgent in parallel")

    cot("ConductorAgent", "DELEGATING",
        f"Fan-out to {len(delegates)} agents: {', '.join(delegates)}")

    # ── Fan out to specialist agents in parallel ────────────────────
    timeline = []
    results = {}
    futures = {}

    with ThreadPoolExecutor(max_workers=3) as pool:
        if landmark_id:
            cot("ArchivistAgent", "TOOL_CALL",
                f'get_historical_context(landmark_id="{landmark_id}")')
            futures["archivist"] = pool.submit(
                _timed_call, "ArchivistAgent", _archivist_lookup, landmark_id
            )
        if era:
            cot("LinguistAgent", "TOOL_CALL",
                f'analyze_period_dialect(era="{era}")')
            cot("StylistAgent", "TOOL_CALL",
                f'generate_map_style(era="{era}")')
            futures["linguist"] = pool.submit(
                _timed_call, "LinguistAgent", _linguist_dialect, era
            )
            futures["stylist"] = pool.submit(
                _timed_call, "StylistAgent", _stylist_style, era
            )

        for key, future in futures.items():
            name, result, elapsed, error = future.result()

            tool_name = {
                "ArchivistAgent": "get_historical_context",
                "LinguistAgent": "analyze_period_dialect",
                "StylistAgent": "generate_map_style",
            }.get(name, "unknown")

            timeline.append({
                "agent": name,
                "tool": tool_name,
                "status": "success" if error is None else "error",
                "elapsed_ms": elapsed,
                "error": error,
            })

            if error is None:
                results[key] = result
                if key == "archivist":
                    cot(name, "RESULT",
                        f'Found: "{result.get("book", "")}" — '
                        f'{result.get("quote", "")[:60]}...')
                elif key == "linguist":
                    slang_preview = ", ".join(
                        s["term"] for s in result.get("slang", [])[:3]
                    )
                    cot(name, "RESULT",
                        f"Identified {len(result.get('slang', []))} slang terms: "
                        f"{slang_preview}")
                elif key == "stylist":
                    cot(name, "RESULT",
                        f'Generated style: {result.get("label", "")} '
                        f'(accent: {result.get("accent_color", "")})')
            else:
                cot(name, "ERROR", f"Failed: {error}")

    # ── Conductor synthesis — tie it all together ───────────────────
    synthesis = None
    synth_ms = 0
    if results:
        cot("ConductorAgent", "SYNTHESIZING",
            f"Merging {len(results)} agent results into unified narrative")

        parts = []
        if "archivist" in results:
            a = results["archivist"]
            parts.append(f"Location: {a.get('book', '')} — {a.get('historical_context', '')[:200]}")
        if "linguist" in results:
            slang_terms = ", ".join(
                s["term"] for s in results["linguist"].get("slang", [])[:3]
            )
            parts.append(f"Language of the era: {slang_terms}")
        if "stylist" in results:
            s = results["stylist"]
            parts.append(f"Visual vibe: {s.get('label', '')} ({s.get('accent_color', '')})")

        synth_prompt = "\n".join(parts) + "\n\nSynthesize into one vivid 2-sentence narrative."
        t0 = time.perf_counter()
        synthesis = dedalus_chat(CONDUCTOR_SYSTEM_PROMPT, synth_prompt)
        synth_ms = round((time.perf_counter() - t0) * 1000)

        cot("ConductorAgent", "SYNTHESIS_COMPLETE",
            f"Generated narrative in {synth_ms}ms")

    timeline.append({
        "agent": "ConductorAgent",
        "tool": "synthesize_narrative",
        "status": "success" if synthesis else "skipped",
        "elapsed_ms": synth_ms,
    })

    total_ms = round((time.perf_counter() - t_start) * 1000)

    cot("ConductorAgent", "COMPLETE",
        f"Total orchestration: {total_ms}ms")

    return JsonResponse({
        "archivist": results.get("archivist"),
        "linguist": results.get("linguist"),
        "stylist": results.get("stylist"),
        "synthesis": synthesis,
        "timeline": timeline,
        "chain_of_thought": chain_of_thought,
        "total_ms": total_ms,
    })
