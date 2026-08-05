"""
Database and AI Titling Manager for Chatbot Session History.
Manages persistent chat sessions, message histories, and automated LLM session titling in Supabase.
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client
from app.chatbot.groq_client import groq_client

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent.parent / '.env', override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL") if "os" in globals() else None
import os
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

logger = logging.getLogger(__name__)


async def generate_ai_chat_title(first_message: str) -> str:
    """Uses Groq LLM to generate a concise 3-5 word descriptive title based on the first prompt."""
    if not first_message or len(first_message.strip()) == 0:
        return "Styling Conversation"

    prompt = (
        f"Generate a short, descriptive 3 to 5 word title for a fashion chatbot conversation "
        f"starting with this user query: \"{first_message}\".\n"
        f"Return ONLY the plain title text, without quotes, punctuation, or preamble. E.g. Inquiry for Formal Dress"
    )
    try:
        title = await groq_client.complete_text(prompt)
        cleaned = title.strip().strip('"\'')
        return cleaned[:60] if cleaned else "Styling Conversation"
    except Exception as e:
        logger.warning("AI title generation failed, using fallback title: %s", e)
        words = first_message.strip().split()
        return " ".join(words[:4]).capitalize()


async def get_or_create_session(session_id: str, user_id: str, first_message: Optional[str] = None) -> Dict[str, Any]:
    """Retrieves an existing session or creates a new one with an AI-generated title."""
    try:
        res = supabase.table("chat_sessions").select("*").eq("id", session_id).execute()
        if res.data:
            return res.data[0]

        title = "Styling Conversation"
        if first_message:
            title = await generate_ai_chat_title(first_message)

        session_data = {
            "id": session_id,
            "user_id": user_id,
            "title": title,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }
        ins_res = supabase.table("chat_sessions").insert(session_data).execute()
        return ins_res.data[0] if ins_res.data else session_data
    except Exception as e:
        logger.error("Failed in get_or_create_session: %s", e)
        return {"id": session_id, "user_id": user_id, "title": "Styling Conversation"}


def save_chat_message(
    session_id: str,
    sender: str,
    message: str,
    outfit_suggestions: Optional[List[Dict[str, Any]]] = None,
) -> Optional[Dict[str, Any]]:
    """Persists a single message (user or bot) inside a chat session."""
    try:
        data = {
            "session_id": session_id,
            "sender": sender,
            "message": message,
            "outfit_suggestions": outfit_suggestions,
            "created_at": datetime.now().isoformat(),
        }
        res = supabase.table("chat_messages").insert(data).execute()

        # Update updated_at timestamp on parent session
        supabase.table("chat_sessions").update({"updated_at": datetime.now().isoformat()}).eq("id", session_id).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        logger.error("Failed to save chat message: %s", e)
        return None


def get_user_sessions(user_id: str) -> List[Dict[str, Any]]:
    """Retrieves all chat sessions for a specific user, ordered by most recently active."""
    try:
        res = (
            supabase.table("chat_sessions")
            .select("*")
            .eq("user_id", user_id)
            .order("updated_at")
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.error("Failed to fetch sessions for user %s: %s", user_id, e)
        return []


def get_session_messages(session_id: str) -> List[Dict[str, Any]]:
    """Retrieves all messages for a specific session in chronological order."""
    try:
        res = (
            supabase.table("chat_messages")
            .select("*")
            .eq("session_id", session_id)
            .order("created_at")
            .execute()
        )
        return res.data or []
    except Exception as e:
        logger.error("Failed to fetch messages for session %s: %s", session_id, e)
        return []
