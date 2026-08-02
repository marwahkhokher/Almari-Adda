import { useState } from "react";
import { suggestOutfits } from "../api";
import { useToast } from "../components/Toast";
import { useCatalogue } from "../store/CatalogueContext";
import { formalityLabel, normalizeOutfit } from "../lib/outfit";
import { titleCase } from "../lib/format";

export default function OutfitsView({ onVisualize }) {
  const toast = useToast();
  const { items } = useCatalogue();
  const [outfits, setOutfits] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const raw = await suggestOutfits();
      const normalized = raw.map(normalizeOutfit).filter(Boolean);
      setOutfits(normalized);
      if (normalized.length === 0) {
        toast("No valid combinations yet — add more items to your closet.", "info");
      }
    } catch (err) {
      toast(err.message || "Couldn't generate outfits", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Outfit Suggestions</h2>
          <p className="text-sm text-ink/60">
            Combinations matched on color, formality and completeness.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-full bg-clay px-5 py-2 text-sm font-medium text-white transition enabled:hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Matching…" : outfits ? "↻ Regenerate" : "✨ Suggest outfits"}
        </button>
      </div>

      {outfits === null && !loading && (
        <div className="rounded-2xl border border-dashed border-sand bg-white/60 p-12 text-center">
          <div className="text-5xl">✨</div>
          <p className="mx-auto mt-3 max-w-sm text-sm text-ink/60">
            {items.length < 2
              ? "Add at least a top and a bottom (or one dress) to get suggestions."
              : "Tap “Suggest outfits” to see combinations from your closet."}
          </p>
        </div>
      )}

      {outfits && outfits.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {outfits.map((o, i) => (
            <OutfitCard key={i} outfit={o} onVisualize={() => onVisualize(o)} />
          ))}
        </div>
      )}
    </div>
  );
}

function OutfitCard({ outfit, onVisualize }) {
  return (
    <div className="animate-fade-in-up flex flex-col rounded-2xl border border-sand bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium">
          {outfit.kind === "single" ? "Single piece" : "Top + Bottom"}
        </span>
        {formalityLabel(outfit.formality) && (
          <span className="text-xs text-ink/50">
            {formalityLabel(outfit.formality)}
          </span>
        )}
      </div>

      <div className="checker flex flex-1 items-center justify-center gap-2 rounded-xl border border-sand p-3">
        {outfit.pieces.map((p, idx) => (
          <img
            key={idx}
            src={p.image_url}
            alt={p.subcategory || p.category}
            className="h-32 w-full max-w-[46%] object-contain"
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {outfit.pieces.map((p, idx) => (
          <span key={idx} className="text-xs text-ink/60">
            {titleCase(p.subcategory) || titleCase(p.category)}
            {idx < outfit.pieces.length - 1 ? " ·" : ""}
          </span>
        ))}
      </div>

      <button
        onClick={onVisualize}
        className="mt-4 rounded-full border border-ink/15 bg-ink px-4 py-2 text-sm text-cream transition hover:opacity-90"
      >
        🪞 Visualize this look
      </button>
    </div>
  );
}
