"""
FastAPI router for the chatbot module. Exposes endpoints to send
messages to the fashion stylist agent, retrieve session history, and reset memory.
"""
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.chatbot.graph.build_graph import chatbot_graph
from app.chatbot.memory import get_history, reset_session, save_turn
from app.chatbot.history_db import (
    get_or_create_session,
    save_chat_message,
    get_user_sessions,
    get_session_messages,
)
from app.chatbot.schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    ResetSessionRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(payload: ChatMessageRequest) -> ChatMessageResponse:
    """Process a user message through the stylist agent, save session & messages, and return reply."""
    user_id = payload.user_id or "anonymous_user"
    session_info = await get_or_create_session(payload.session_id, user_id, first_message=payload.message)
    session_title = session_info.get("title", "Styling Conversation")

    # Persist incoming user message
    save_chat_message(payload.session_id, sender="user", message=payload.message)

    history = get_history(payload.session_id)

    initial_state = {
        "session_id": payload.session_id,
        "user_message": payload.message,
        "history": history,
    }

    try:
        result_state = await chatbot_graph.ainvoke(initial_state)
    except Exception as e:
        logger.error("Chatbot graph execution failed: %s", e)
        raise HTTPException(status_code=500, detail="Stylist agent failed to respond")

    reply = result_state.get("reply", "Sorry, I couldn't process that.")
    suggestions = result_state.get("outfit_suggestions", [])

    image_urls = [
        item.image_url
        for suggestion in suggestions
        for item in suggestion.items
    ]

    save_turn(payload.session_id, payload.message, reply)

    # Convert Pydantic suggestions to JSON dicts for persistent storage
    raw_suggestions = [s.model_dump() if hasattr(s, "model_dump") else s.dict() for s in suggestions]
    save_chat_message(payload.session_id, sender="bot", message=reply, outfit_suggestions=raw_suggestions)

    return ChatMessageResponse(
        session_id=payload.session_id,
        title=session_title,
        reply=reply,
        outfit_suggestions=suggestions,
        image_urls=image_urls,
    )


@router.get("/sessions")
def list_sessions(user_id: str = Query("anonymous_user")) -> List[dict]:
    """Retrieve all chat sessions for a specific user, ordered by most recently active."""
    return get_user_sessions(user_id)


@router.get("/sessions/{session_id}")
def get_session_history(session_id: str) -> List[dict]:
    """Retrieve full chronological message history for a specific chat session."""
    return get_session_messages(session_id)


@router.post("/reset")
def reset(payload: ResetSessionRequest) -> dict:
    """Clear conversation memory for a given session."""
    reset_session(payload.session_id)
    return {"status": "reset", "session_id": payload.session_id}