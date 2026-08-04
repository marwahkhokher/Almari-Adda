import { titleCase } from "./format";

// The backend's /outfit-suggest returns two shapes (see backend
// app/outfit_matching.py get_valid_outfits):
//
//   { type: "top_bottom",   top: item, bottom: item, formality }
//   { type: "single_piece", item: item,              formality }
//
// The UI works with one normalized shape instead:
//
//   { kind: "top_bottom" | "single", pieces: [item, ...], formality }
//
// `pieces` is ordered top-then-bottom, which is what VisualizeView relies on
// when it seeds a selection from a handed-over outfit.

// An item is only renderable if we have a cutout to show for it.
function usablePiece(item) {
  return item && typeof item.image_url === "string" && item.image_url
    ? item
    : null;
}

export function normalizeOutfit(raw) {
  if (!raw || typeof raw !== "object") return null;

  // Already normalized (e.g. handed over from the Stylist view) — pass through.
  if (Array.isArray(raw.pieces)) {
    const pieces = raw.pieces.map(usablePiece).filter(Boolean);
    if (pieces.length === 0) return null;
    return {
      kind: raw.kind === "single" ? "single" : "top_bottom",
      pieces,
      formality: raw.formality ?? null,
    };
  }

  if (raw.type === "single_piece") {
    const item = usablePiece(raw.item);
    if (!item) return null;
    return { kind: "single", pieces: [item], formality: raw.formality ?? null };
  }

  if (raw.type === "top_bottom") {
    const pieces = [usablePiece(raw.top), usablePiece(raw.bottom)].filter(
      Boolean,
    );
    if (pieces.length === 0) return null;
    return { kind: "top_bottom", pieces, formality: raw.formality ?? null };
  }

  return null;
}

// "semi-formal" -> "Semi-Formal". "unknown"/missing returns "" so the caller's
// `&&` guard hides the badge entirely rather than showing a useless label.
export function formalityLabel(formality) {
  if (typeof formality !== "string") return "";
  const key = formality.trim().toLowerCase();
  if (!key || key === "unknown") return "";
  return titleCase(key);
}
