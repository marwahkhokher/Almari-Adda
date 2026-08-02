import { API_BASE } from "./config";

// Thin wrapper around fetch that gives us consistent error handling and
// JSON parsing. Throws an Error with a human-readable message on failure so
// the UI can surface it in a toast.
async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, options);
  } catch (networkErr) {
    // Backend unreachable (server down, CORS, wrong URL, offline).
    throw new ApiError(
      `Can't reach the backend at ${API_BASE}. Is it running?`,
      0,
    );
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const detail =
      (data && data.detail) ||
      (typeof data === "string" && data) ||
      res.statusText ||
      "Request failed";
    throw new ApiError(detail, res.status);
  }

  return data;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// GET /catalogue -> { items: [...] }
export async function getCatalogue() {
  const data = await request("/catalogue");
  return Array.isArray(data?.items) ? data.items : [];
}

// POST /upload (multipart) -> { item, all_predictions }
export async function uploadItem(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/upload", { method: "POST", body: form });
}

// POST /outfit-suggest -> { outfits: [...] }
export async function suggestOutfits() {
  const data = await request("/outfit-suggest", { method: "POST" });
  return Array.isArray(data?.outfits) ? data.outfits : [];
}

// POST /chatbot/message -> { session_id, reply, outfit_suggestions, image_urls }
export async function sendChatMessage(sessionId, message) {
  return request("/chatbot/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });
}

// POST /chatbot/reset -> clears server-side memory for the session
export async function resetChatSession(sessionId) {
  return request("/chatbot/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
}
