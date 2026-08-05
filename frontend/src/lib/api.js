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
    const detail =
      (data && data.detail) ||
      (typeof data === "string" && data) ||
      res.statusText ||
      "Request failed";

    throw new ApiError(detail, res.status);
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
export async function deleteItem(itemId) {
  return request(`/catalogue/${itemId}`, {
    method: "DELETE",
  });
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

// ============================================================
// Upload
// ============================================================

// POST /upload
export async function uploadItem(file) {
  const form = new FormData();
  form.append("file", file);

  return request("/upload", {
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
export async function sendChatMessage(sessionId, message) {
  return request("/chatbot/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      message: message,
    }),
  });
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
