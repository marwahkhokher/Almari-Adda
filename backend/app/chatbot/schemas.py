"""
Pydantic models for chatbot request/response payloads and internal
data structures shared across the chatbot module.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ClothingItem(BaseModel):
    """Represents one catalogue item, with optional enriched attributes."""

    id: str
    category: str
    subcategory: Optional[str] = None
    confidence: Optional[float] = None
    image_url: str
    color: Optional[str] = None
    formality: Optional[str] = None
    attributes_inferred: bool = False


class ChatMessageRequest(BaseModel):
    """Incoming request to /chatbot/message."""

    session_id: str = Field(..., description="Client-generated session identifier")
    user_id: Optional[str] = Field("anonymous_user", description="Authenticated user ID")
    message: str = Field(..., min_length=1, description="User's natural language message")


class OutfitSuggestion(BaseModel):
    """A single outfit suggestion with reasoning."""

    items: List[ClothingItem]
    reasoning: str
    confidence_score: Optional[float] = None


class ChatMessageResponse(BaseModel):
    """Response returned from /chatbot/message."""

    session_id: str
    title: Optional[str] = None
    reply: str
    outfit_suggestions: List[OutfitSuggestion] = Field(default_factory=list)
    image_urls: List[str] = Field(default_factory=list)


class ResetSessionRequest(BaseModel):
    """Request to clear a session's conversation memory."""

    session_id: str