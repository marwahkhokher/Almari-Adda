"""
In-memory conversation history store, keyed by session_id. Simple
process-local store — fine for a single-instance internship deployment.
Swap for Redis/DB later if needed without changing the router's interface.
"""
from typing import Dict, List

from app.chatbot.config import config

_sessions: Dict[str, List[dict]] = {}


def get_history(session_id: str) -> List[dict]:
    """Return the conversation history for a session (empty if new)."""
    return _sessions.get(session_id, [])


def save_turn(session_id: str, user_message: str, reply: str) -> None:
    """Append a user/assistant turn to a session's history, trimming old turns."""
    history = _sessions.setdefault(session_id, [])
    history.append({"role": "user", "content": user_message})
    history.append({"role": "assistant", "content": reply})

    max_messages = config.MAX_MEMORY_TURNS * 2
    if len(history) > max_messages:
        del history[: len(history) - max_messages]


def reset_session(session_id: str) -> None:
    """Clear a session's history entirely."""
    _sessions.pop(session_id, None)