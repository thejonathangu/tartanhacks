"""
Shared Dedalus Labs client used by all three MCP agents.

Uses the OpenAI-compatible chat completions endpoint with your
Dedalus API key.  Every agent calls `dedalus_chat()` to enrich
its response with LLM-generated context.
"""

import httpx
from django.conf import settings


def dedalus_chat(
    system_prompt: str,
    user_message: str,
    model: str | None = None,
    max_tokens: int = 512,
) -> str:
    """
    Send a chat completion request to Dedalus Labs.

    Returns the assistant's response text, or a fallback string
    if the API key is missing or the call fails.
    """
    api_key = settings.DEDALUS_API_KEY
    if not api_key:
        return "(Dedalus API key not configured — using static data only)"

    model = model or settings.DEDALUS_MODEL

    try:
        resp = httpx.post(
            f"{settings.DEDALUS_BASE_URL}/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                "max_tokens": max_tokens,
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
    except Exception as exc:
        return f"(Dedalus call failed: {exc})"
