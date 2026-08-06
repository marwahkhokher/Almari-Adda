import { API_BASE } from "./config";

// ============================================================
// Shared request helper
// ============================================================

async function request(path, options = {}) {
  let res;

  try {
    res = await fetch(`${API_BASE}${path}`, options);
  } catch (networkErr) {
    throw new ApiError(
      `Can't reach the backend at ${API_BASE}. Is it running?`,
      0
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
    let detailMessage = "Request failed";
    const rawDetail = data && data.detail !== undefined ? data.detail : data;

    if (typeof rawDetail === "string") {
      detailMessage = rawDetail;
    } else if (Array.isArray(rawDetail)) {
      detailMessage = rawDetail.map(err => (typeof err === "string" ? err : err.msg || JSON.stringify(err))).join(", ");
    } else if (rawDetail && typeof rawDetail === "object") {
      detailMessage = rawDetail.message || rawDetail.detail || JSON.stringify(rawDetail);
    } else if (res.statusText) {
      detailMessage = res.statusText;
    }

    throw new ApiError(detailMessage, res.status);
  }

  return data;
}

// ============================================================
// Error class
// ============================================================

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ============================================================
// Catalogue
// ============================================================

// GET /catalogue
export async function getCatalogue() {
  const data = await request("/catalogue");

  return Array.isArray(data?.items)
    ? data.items
    : [];
}

// DELETE /catalogue/{item_id}
// DELETE /catalogue/{item_id}
export async function deleteItem(itemId) {
  return request(`/catalogue/${itemId}`, {
    method: "DELETE",
  });
}

// PATCH /catalogue/{item_id}
export async function updateItemCategory(itemId, updates) {
  return request(`/catalogue/${itemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
}

// PATCH /catalogue/{item_id} — toggle favorite status
export async function toggleFavorite(itemId, isFavorite) {
  return request(`/catalogue/${itemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_favorite: isFavorite }),
  });
}

// ============================================================
// Filters (colour / season / event)
// ============================================================
// ============================================================
// Filters (colour / season / event)
// ============================================================

// GET /filters/options -> { colors, seasons, events }
// Dynamic: only values actually present in the catalogue are returned.
export async function getFilterOptions() {
  const data = await request("/filters/options");
  return {
    colors: Array.isArray(data?.colors) ? data.colors : [],
    seasons: Array.isArray(data?.seasons) ? data.seasons : [],
    events: Array.isArray(data?.events) ? data.events : [],
  };
}

// GET /catalogue/filter?colors=&seasons=&events= -> enriched items
// Each returned item includes color, season[] and events[]. With no
// selections this returns the full enriched catalogue.
export async function getFilteredCatalogue({
  colors = [],
  seasons = [],
  events = [],
} = {}) {
  const params = new URLSearchParams();
  if (colors.length) params.set("colors", colors.join(","));
  if (seasons.length) params.set("seasons", seasons.join(","));
  if (events.length) params.set("events", events.join(","));

  const qs = params.toString();
  const data = await request(`/catalogue/filter${qs ? `?${qs}` : ""}`);
  return Array.isArray(data?.items) ? data.items : [];
}

// ============================================================
// Item metadata
// ============================================================

// GET /item-metadata/{item_id}
export async function getItemMetadata(itemId) {
  return request(`/item-metadata/${itemId}`);
}

// PUT /item-metadata/{item_id}
export async function updateItemMetadata(itemId, metadata) {
  return request(`/item-metadata/${itemId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });
}


// POST /item-metadata/increment-worn
export async function incrementTimesWorn(itemIds) {
  return request("/item-metadata/increment-worn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_ids: itemIds }),
  });
}

// ============================================================
// Upload
// ============================================================

// POST /upload
export async function uploadItem(file) {
  const form = new FormData();
  form.append("file", file);

  return request("/upload?sync=true", {
    method: "POST",
    body: form,
  });
}

// Alias used by UploadScreen.jsx
export async function uploadClothingItem(file) {
  return uploadItem(file);
}

// ============================================================
// Outfit suggestions
// ============================================================

// POST /outfit-suggest
export async function getOutfitSuggestions() {
  const data = await request("/outfit-suggest", {
    method: "POST",
  });

  return Array.isArray(data?.outfits)
    ? data.outfits
    : [];
}

// Keep old function name too
export async function suggestOutfits() {
  return getOutfitSuggestions();
}

// ============================================================
// Chatbot
// ============================================================

// POST /chatbot/message
export async function sendChatMessage(sessionId, message, userId = "anonymous_user", excludedOutfitKeys = []) {
  return request("/chatbot/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      user_id: userId,
      message: message,
      excluded_outfit_keys: excludedOutfitKeys,
    }),
  });
}

// GET /chatbot/sessions?user_id={userId}
export async function getUserChatSessions(userId = "anonymous_user") {
  return request(`/chatbot/sessions?user_id=${encodeURIComponent(userId)}`);
}

// GET /chatbot/sessions/{sessionId}
export async function getChatSessionHistory(sessionId) {
  return request(`/chatbot/sessions/${sessionId}`);
}

// POST /chatbot/reset
export async function resetChatSession(sessionId) {
  return request("/chatbot/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
    }),
  });
}

// ============================================================
// Visualization
// ============================================================

// POST /visualize
export async function visualizeOutfit(
  itemIds,
  model = "female",
  personPhotoFile = null
) {
  const params = new URLSearchParams({
    item_ids: itemIds.join(","),
    model,
  });

  const form = new FormData();

  if (personPhotoFile) {
    form.append("person_photo", personPhotoFile);
  }

  return request(`/visualize?${params.toString()}`, {
    method: "POST",
    body: form,
  });
}

// POST /build-outfit -> { outfit, matched_item_count }
export async function buildOutfit(preferences) {
  return request("/build-outfit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
  });
}

// ============================================================
// Job Queue Status & Polling
// ============================================================

export async function getJobStatus(jobId) {
  return request(`/jobs/${jobId}`);
}

export async function pollJob(jobId, onProgress = null, intervalMs = 1500, maxAttempts = 80) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const job = await getJobStatus(jobId);
    if (onProgress) onProgress(job);

    if (job.status === "completed") {
      return job.result;
    }
    if (job.status === "failed") {
      throw new ApiError(job.error || "Job processing failed", 500);
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    attempts++;
  }
  throw new ApiError("Job processing timed out", 408);
}
