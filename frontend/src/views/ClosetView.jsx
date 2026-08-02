import { useMemo, useState } from "react";
import { useCatalogue } from "../store/CatalogueContext";
import ItemCard from "../components/ItemCard";
import Spinner from "../components/Spinner";
import { titleCase } from "../lib/format";

export default function ClosetView({ onAddClick }) {
  const { items, loading, error, refresh } = useCatalogue();
  const [filter, setFilter] = useState("all");

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [items]);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );

  if (loading) return <Spinner label="Loading your closet…" />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-700">Couldn't load your closet</p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
        <button
          onClick={refresh}
          className="mt-4 rounded-full bg-ink px-4 py-2 text-sm text-cream hover:opacity-90"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Your Closet</h2>
          <p className="text-sm text-ink/60">
            {items.length} {items.length === 1 ? "item" : "items"} catalogued
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="rounded-full border border-sand bg-white px-3 py-1.5 text-sm hover:bg-sand"
          >
            ↻ Refresh
          </button>
          <button
            onClick={onAddClick}
            className="rounded-full bg-clay px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            + Add item
          </button>
        </div>
      </div>

      {categories.length > 2 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === c
                  ? "bg-ink text-cream"
                  : "bg-white text-ink/70 hover:bg-sand"
              }`}
            >
              {c === "all" ? "All" : titleCase(c)}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyCloset onAddClick={onAddClick} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visible.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyCloset({ onAddClick }) {
  return (
    <div className="rounded-2xl border border-dashed border-sand bg-white/60 p-12 text-center">
      <div className="text-5xl">🧺</div>
      <h3 className="mt-3 font-display text-xl font-semibold">
        Your closet is empty
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-ink/60">
        Snap or upload a photo of a clothing item. We'll cut out the background
        and tag it automatically.
      </p>
      <button
        onClick={onAddClick}
        className="mt-5 rounded-full bg-clay px-5 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        📸 Add your first item
      </button>
    </div>
  );
}
