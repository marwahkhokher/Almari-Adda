// Central runtime config. The backend base URL is injected at build time
// via Vite env vars (see .env.example). Falls back to localhost for dev.
export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

// Categories the classification pipeline can emit. Used for grouping/filtering.
export const CATEGORY_LABELS = {
  top: "Tops",
  bottom: "Bottoms",
  dress: "Dresses",
  eastern: "Eastern wear",
  footwear: "Footwear",
  outerwear: "Outerwear",
  other: "Other",
};

// Subcategories that count as a complete outfit on their own (mirrors the
// backend's SINGLE_PIECE_SUBCATEGORIES so the UI can label them correctly).
export const SINGLE_PIECE = new Set([
  "dress",
  "cocktail dress",
  "evening dress",
  "gown",
  "abaya",
  "saree",
  "sari",
  "jumpsuit",
  "lehenga",
]);
