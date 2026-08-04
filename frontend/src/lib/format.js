// Small display-formatting helpers shared across the views. Everything here
// returns "" (falsy) for missing data so callers can write
// `titleCase(x) || "—"` and render a clean placeholder.

// "cocktail dress" -> "Cocktail Dress". Hyphens are preserved as word breaks
// so "semi-formal" reads as "Semi-Formal" rather than "Semi-formal".
export function titleCase(value) {
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[a-z0-9]+/g, (word) => word[0].toUpperCase() + word.slice(1));
}

// Classification confidence -> "87%". The pipeline emits 0–1 floats, but the
// chatbot's confidence_score occasionally comes through as 0–100, so treat
// anything above 1 as already being a percentage.
export function confidencePct(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  const pct = n <= 1 ? n * 100 : n;
  return `${Math.round(Math.min(pct, 100))}%`;
}

// Fallback glyph for items whose cutout failed to load. Keys mirror the
// categories in config.js CATEGORY_LABELS.
const CATEGORY_EMOJI = {
  top: "👕",
  bottom: "👖",
  dress: "👗",
  eastern: "🥻",
  footwear: "👟",
  outerwear: "🧥",
  other: "🧵",
};

export function categoryEmoji(category) {
  if (typeof category !== "string") return CATEGORY_EMOJI.other;
  return CATEGORY_EMOJI[category.trim().toLowerCase()] || CATEGORY_EMOJI.other;
}
