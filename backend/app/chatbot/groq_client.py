"""
Thin wrapper around the Groq API for text and vision completions.
Isolates all Groq SDK/HTTP details from the rest of the chatbot module.
Uses a shared connection pool and max_tokens constraint for sub-second responses.
"""
import logging
from typing import Optional
import httpx
from app.chatbot.config import config

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


def _strip_json_fences(text: str) -> str:
    """Strip markdown code fences some models wrap JSON responses in."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()
    return text


class GroqClient:
    """Optimized async client for Groq chat completions."""

    def __init__(self) -> None:
        if not config.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not set")
        self._headers = {
            "Authorization": f"Bearer {config.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        self._client: Optional[httpx.AsyncClient] = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=10.0)
        return self._client

    async def complete_text(self, prompt: str, system: Optional[str] = None) -> str:
        """Send a plain text prompt to the Groq text model."""
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": config.GROQ_TEXT_MODEL,
            "messages": messages,
            "temperature": 0.4,
            "max_tokens": 150,
        }
        return await self._send(payload)

    async def describe_image(self, image_url: str, prompt: str) -> str:
        """Send an image + prompt to the Groq vision model."""
        payload = {
            "model": config.GROQ_VISION_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                }
            ],
            "temperature": 0.2,
            "max_tokens": 200,
        }
        return await self._send(payload)

    async def _send(self, payload: dict) -> str:
        client = self._get_client()
        try:
            response = await client.post(GROQ_API_URL, headers=self._headers, json=payload)
            response.raise_for_status()
            data = response.json()
            return _strip_json_fences(data["choices"][0]["message"]["content"])
        except httpx.HTTPStatusError as e:
            logger.error("Groq API error: %s - %s", e.response.status_code, e.response.text)
            raise
        except (KeyError, IndexError) as e:
            logger.error("Unexpected Groq response shape: %s", e)
            raise RuntimeError("Malformed response from Groq API") from e


groq_client = GroqClient()