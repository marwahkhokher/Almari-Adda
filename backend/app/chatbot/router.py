"""
FastAPI router for the chatbot module. Exposes endpoints to send
messages to the fashion stylist agent and reset session memory.
"""
import logging

from fastapi import APIRouter, HTTPException

from app.chatbot.graph.build_graph import chatbot_graph
from app.chatbot.memory import get_history, reset_session, save_turn
from app.chatbot.schemas import (
    ChatMessageRequest,
    ChatMessageResponse,
    ResetSessionRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(payload: ChatMessageRequest) -> ChatMessageResponse:
    """Process a user message through the stylist agent and return a reply."""
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

    return ChatMessageResponse(
        session_id=payload.session_id,
        reply=reply,
        outfit_suggestions=suggestions,
        image_urls=image_urls,
    )


@router.post("/reset")
def reset(payload: ResetSessionRequest) -> dict:
    """Clear conversation memory for a given session."""
    reset_session(payload.session_id)
    return {"status": "reset", "session_id": payload.session_id}