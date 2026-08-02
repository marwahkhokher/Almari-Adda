import { useEffect, useRef, useState } from "react";
import { resetChatSession, sendChatMessage, ApiError } from "../api";
import { useToast } from "../components/Toast";
import { SINGLE_PIECE } from "../config";
import { titleCase } from "../lib/format";

const PROMPTS = [
  "I need an outfit for a wedding",
  "Something casual for the weekend",
  "What can I wear to a formal dinner?",
];

function getSessionId() {
  let id = localStorage.getItem("aa_session");
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem("aa_session", id);
  }
  return id;
}

// Build a normalized outfit (for the Visualize hand-off) from a flat item list.
function outfitFromItems(items = []) {
  const single = items.find(
    (i) =>
      i.category === "dress" ||
      SINGLE_PIECE.has((i.subcategory || "").toLowerCase()),
  );
  if (single) return { kind: "single", pieces: [single] };
  const top = items.find((i) => i.category === "top");
  const bottom = items.find((i) => i.category === "bottom");
  return { kind: "top_bottom", pieces: [top, bottom].filter(Boolean) };
}

export default function ChatView({ onVisualize }) {
  const toast = useToast();
  const [sessionId] = useState(getSessionId);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I'm your stylist. Tell me the occasion — a wedding, a casual day out, a formal dinner — and I'll put a look together from your closet.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setBusy(true);
    try {
      const res = await sendChatMessage(sessionId, msg);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: res.reply || "Here's what I'd suggest.",
          suggestions: res.outfit_suggestions || [],
        },
      ]);
    } catch (err) {
      const notDeployed = err instanceof ApiError && (err.status === 404 || err.status === 0);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: notDeployed
            ? "The stylist service isn't reachable right now. Once the chatbot endpoint is deployed, I'll answer here."
            : `Sorry — ${err.message}`,
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    try {
      await resetChatSession(sessionId);
    } catch {
      /* best-effort; clearing locally regardless */
    }
    setMessages([
      {
        role: "assistant",
        text: "Fresh start! What's the occasion?",
      },
    ]);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-160px)] max-w-2xl flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Stylist</h2>
          <p className="text-sm text-ink/60">Occasion-based outfit suggestions</p>
        </div>
        <button
          onClick={reset}
          className="rounded-full border border-sand bg-white px-3 py-1.5 text-sm hover:bg-sand"
        >
          New chat
        </button>
      </div>

      <div
        ref={scrollRef}
        className="scroll-slim flex-1 space-y-4 overflow-y-auto rounded-2xl border border-sand bg-white/60 p-4"
      >
        {messages.map((m, i) => (
          <Bubble key={i} message={m} onVisualize={onVisualize} />
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-ink/50">
            <span className="flex gap-1">
              <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
            </span>
            Thinking…
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="rounded-full border border-sand bg-white px-3 py-1.5 text-xs hover:bg-sand"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe the occasion…"
          className="flex-1 rounded-full border border-sand bg-white px-4 py-2.5 text-sm outline-none focus:border-clay"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-full bg-clay px-5 py-2.5 text-sm font-medium text-white transition enabled:hover:opacity-90 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function Bubble({ message, onVisualize }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] animate-fade-in-up rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? "bg-ink text-cream"
            : message.error
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-sand bg-white text-ink"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
        {message.suggestions?.length > 0 && (
          <div className="mt-3 space-y-3">
            {message.suggestions.map((s, i) => (
              <Suggestion key={i} suggestion={s} onVisualize={onVisualize} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Suggestion({ suggestion, onVisualize }) {
  const items = suggestion.items || [];
  return (
    <div className="rounded-xl border border-sand bg-cream/70 p-3">
      <div className="checker flex items-center justify-center gap-2 rounded-lg border border-sand p-2">
        {items.map((it, idx) => (
          <img
            key={idx}
            src={it.image_url}
            alt={it.subcategory || it.category}
            className="h-24 w-full max-w-[45%] object-contain"
          />
        ))}
      </div>
      {suggestion.reasoning && (
        <p className="mt-2 text-xs text-ink/70">{suggestion.reasoning}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((it, idx) => (
          <span key={idx} className="text-[11px] text-ink/50">
            {titleCase(it.subcategory) || titleCase(it.category)}
          </span>
        ))}
        {items.length > 0 && onVisualize && (
          <button
            onClick={() => onVisualize(outfitFromItems(items))}
            className="ml-auto rounded-full bg-ink px-3 py-1 text-[11px] text-cream hover:opacity-90"
          >
            🪞 Visualize
          </button>
        )}
      </div>
    </div>
  );
}

function Dot({ delay = "0ms" }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40"
      style={{ animationDelay: delay }}
    />
  );
}
