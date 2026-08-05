// Shared presentation helpers for the colour / season / event attributes,
// used by both the filter panel and the closet cards.

// Best-effort swatch colours for the named colours the backend emits.
// Unknown/edge values fall back to a neutral swatch — the UI still works.
export const COLOR_HEX = {
  black: '#1c1c1c',
  white: '#ffffff',
  gray: '#9ca3af',
  'dark gray': '#4b5563',
  'light gray': '#d1d5db',
  beige: '#e8dcc0',
  tan: '#d2b48c',
  brown: '#8b5a2b',
  'dark brown': '#5c4033',
  pink: '#ec4899',
  red: '#dc2626',
  'dark red': '#7f1d1d',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#16a34a',
  'dark green': '#14532d',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  blue: '#2563eb',
  'navy blue': '#1e3a8a',
  purple: '#7c3aed',
  magenta: '#d946ef',
};

export const SEASON_EMOJI = {
  spring: '🌸',
  summer: '☀️',
  fall: '🍂',
  winter: '❄️',
};

// A CSS background value for a colour name — a solid swatch when known,
// otherwise a neutral gradient so unknown values still render a chip.
export function colorSwatch(name) {
  if (!name) return 'linear-gradient(135deg,#e5e7eb,#9ca3af)';
  return COLOR_HEX[name.toLowerCase()] || 'linear-gradient(135deg,#e5e7eb,#9ca3af)';
}
