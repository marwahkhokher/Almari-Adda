"""
Configuration for the chatbot module.

Loads environment variables and exposes typed settings used
across the chatbot package.
"""

import os

from dotenv import load_dotenv


load_dotenv()


def get_int_env(name: str, default: int) -> int:
    """Read an integer environment variable safely."""
    raw_value = os.getenv(name)

    if raw_value is None or not raw_value.strip():
        return default

    try:
        return int(raw_value)
    except ValueError:
        raise RuntimeError(
            f"{name} must be a valid integer, received: {raw_value!r}"
        )


class ChatbotConfig:
    """Centralized configuration for the chatbot module."""

    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_TEXT_MODEL = os.getenv(
        "GROQ_TEXT_MODEL",
        "llama-3.3-70b-versatile",
    )
    GROQ_VISION_MODEL = os.getenv(
        "GROQ_VISION_MODEL",
        "meta-llama/llama-4-scout-17b-16e-instruct",
    )

    # Base URL of this FastAPI app, used for internal catalogue calls.
    BACKEND_BASE_URL = os.getenv(
        "BACKEND_BASE_URL",
        "http://127.0.0.1:8000",
    )

    # How long inferred attributes remain cached, in seconds.
    ATTRIBUTE_CACHE_TTL = get_int_env(
        "ATTRIBUTE_CACHE_TTL",
        3600,
    )

    # Maximum conversation turns kept before trimming old turns.
    MAX_MEMORY_TURNS = get_int_env(
        "MAX_MEMORY_TURNS",
        20,
    )

    @classmethod
    def validate(cls) -> None:
        """Raise an error when required chatbot settings are missing."""
        if not cls.GROQ_API_KEY:
            raise RuntimeError(
                "GROQ_API_KEY must be set in the backend .env file "
                "for the chatbot module."
            )


config = ChatbotConfig()