"""
Configuration for the chatbot module. Loads environment variables
and exposes typed settings used across the chatbot package.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class ChatbotConfig:
    """Centralized config for the chatbot module."""

    GROQ_API_KEY= os.getenv("GROQ_API_KEY")
    GROQ_TEXT_MODEL= os.getenv("GROQ_TEXT_MODEL")
    GROQ_VISION_MODEL = os.getenv("GROQ_VISION_MODEL")

    # Base URL of our own FastAPI app, used to call /catalogue internally.
    BACKEND_BASE_URL= os.getenv("BACKEND_BASE_URL")

    # How long an enriched item's inferred attributes stay valid in memory (seconds).
    ATTRIBUTE_CACHE_TTL= int(os.getenv("ATTRIBUTE_CACHE_TTL"))

    # Max conversation turns kept per session before trimming oldest.
    MAX_MEMORY_TURNS= int(os.getenv("MAX_MEMORY_TURNS"))

    @classmethod
    def validate(cls) -> None:
        """Raise if required settings are missing. Call this at startup."""
        if not cls.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY must be set in .env for the chatbot module")


config = ChatbotConfig()