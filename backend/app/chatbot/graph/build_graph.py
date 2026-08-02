"""
Assembles the LangGraph pipeline for the fashion stylist agent by
wiring together the node functions in sequence.
"""
from langgraph.graph import END, StateGraph

from app.chatbot.graph.nodes import (
    enrich_attributes,
    format_response,
    generate_outfit_reasoning,
    load_catalogue,
    parse_intent,
    retrieve_relevant_items,
)
from app.chatbot.graph.state import ChatbotState


def build_chatbot_graph():
    """Build and compile the stylist agent graph."""
    graph = StateGraph(ChatbotState)

    graph.add_node("parse_intent", parse_intent)
    graph.add_node("load_catalogue", load_catalogue)
    graph.add_node("enrich_attributes", enrich_attributes)
    graph.add_node("retrieve_relevant_items", retrieve_relevant_items)
    graph.add_node("generate_outfit_reasoning", generate_outfit_reasoning)
    graph.add_node("format_response", format_response)

    graph.set_entry_point("parse_intent")
    graph.add_edge("parse_intent", "load_catalogue")
    graph.add_edge("load_catalogue", "enrich_attributes")
    graph.add_edge("enrich_attributes", "retrieve_relevant_items")
    graph.add_edge("retrieve_relevant_items", "generate_outfit_reasoning")
    graph.add_edge("generate_outfit_reasoning", "format_response")
    graph.add_edge("format_response", END)

    return graph.compile()


# Compiled once at import time, reused across requests.
chatbot_graph = build_chatbot_graph()