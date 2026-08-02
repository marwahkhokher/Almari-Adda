import { categoryEmoji, confidencePct, titleCase } from "../lib/format";

// A single closet item tile: transparent PNG on a checkerboard so the
// background-removed cutout reads clearly, plus category/subcategory tags.
export default function ItemCard({ item, selected, onClick, compact = false }) {
  const conf = confidencePct(item.confidence);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-clay/50 ${
        selected ? "border-clay ring-2 ring-clay/60" : "border-sand"
      }`}
    >
      <div className="checker aspect-square w-full overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.subcategory || item.category || "clothing item"}
            loading="lazy"
            className="h-full w-full object-contain p-2 transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            {categoryEmoji(item.category)}
          </div>
        )}
        {selected && (
          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-clay text-xs font-bold text-white shadow">
            ✓
          </span>
        )}
      </div>
      {!compact && (
        <div className="flex flex-col gap-1 p-3">
          <span className="font-medium leading-tight">
            {titleCase(item.subcategory) || titleCase(item.category) || "Item"}
          </span>
          <div className="flex items-center gap-2 text-xs text-ink/60">
            <span className="rounded-full bg-sand px-2 py-0.5">
              {categoryEmoji(item.category)} {titleCase(item.category) || "—"}
            </span>
            {conf && <span title="Classification confidence">{conf}</span>}
          </div>
        </div>
      )}
    </button>
  );
}
