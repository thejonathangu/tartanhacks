"""
Chat endpoint — lets users ask freeform questions about a location.
Routes through the ConductorAgent + ArchivistAgent + LinguistAgent
for contextual answers grounded in the literary knowledge base.
"""

import json
import time

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from core.dedalus_client import dedalus_chat


CHAT_SYSTEM_PROMPT = (
    "You are a brilliant literary historian and cultural guide for the Living Literary Map. "
    "You have deep knowledge of literature, historical landmarks, cultural movements, "
    "and the intersection of place and story. A user is exploring a location on an interactive "
    "literary map and has asked a question about it.\n\n"
    "Answer in 2-3 concise, engaging sentences. Be specific, vivid, and informative. "
    "If you reference a book, author, or historical event, be accurate. "
    "Keep a warm, knowledgeable tone — like a passionate museum guide."
)


@csrf_exempt
@require_POST
def chat_about_place(request):
    """
    POST /chat
    Body: {
      "question": "What was the Cotton Club's dress code?",
      "context": {  // optional — currently selected location data
        "title": "The Cotton Club",
        "book": "...",
        "era": "1920s",
        "historical_context": "...",
        "quote": "..."
      }
    }
    """
    t_start = time.perf_counter()

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    question = body.get("question", "").strip()
    if not question:
        return JsonResponse({"error": "question is required"}, status=400)

    context = body.get("context", {})

    # Build context-aware prompt
    parts = [f"User question: {question}"]
    if context:
        if context.get("title"):
            parts.append(f"Location: {context['title']}")
        if context.get("book"):
            parts.append(f"Book: {context['book']}")
        if context.get("era"):
            parts.append(f"Era: {context['era']}")
        if context.get("historical_context"):
            parts.append(f"Historical context: {context['historical_context'][:300]}")
        if context.get("quote"):
            parts.append(f"Literary quote: \"{context['quote'][:200]}\"")

    user_prompt = "\n".join(parts)

    try:
        answer = dedalus_chat(CHAT_SYSTEM_PROMPT, user_prompt)
        elapsed = round((time.perf_counter() - t_start) * 1000)
        return JsonResponse({
            "answer": answer,
            "elapsed_ms": elapsed,
            "timeline": [{
                "agent": "ConductorAgent",
                "tool": "chat_about_place",
                "status": "success",
                "elapsed_ms": elapsed,
            }],
        })
    except Exception as exc:
        elapsed = round((time.perf_counter() - t_start) * 1000)
        return JsonResponse({
            "error": str(exc),
            "elapsed_ms": elapsed,
        }, status=502)
