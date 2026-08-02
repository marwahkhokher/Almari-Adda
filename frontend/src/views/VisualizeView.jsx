import { useEffect, useMemo, useState } from "react";
import { useCatalogue } from "../store/CatalogueContext";
import Mannequin from "../components/Mannequin";
import ItemCard from "../components/ItemCard";
import { SINGLE_PIECE } from "../config";
import { titleCase } from "../lib/format";

export default function VisualizeView({ initialOutfit }) {
  const { items } = useCatalogue();

  const tops = useMemo(() => items.filter((i) => i.category === "top"), [items]);
  const bottoms = useMemo(
    () => items.filter((i) => i.category === "bottom"),
    [items],
  );
  const singles = useMemo(
    () =>
      items.filter(
        (i) =>
          i.category === "dress" ||
          SINGLE_PIECE.has((i.subcategory || "").toLowerCase()),
      ),
    [items],
  );

  const [topId, setTopId] = useState(null);
  const [bottomId, setBottomId] = useState(null);
  const [singleId, setSingleId] = useState(null);

  // Seed selection when an outfit is handed over from the Outfits/Stylist view.
  useEffect(() => {
    if (!initialOutfit) return;
    if (initialOutfit.kind === "single") {
      setSingleId(initialOutfit.pieces[0]?.id ?? null);
      setTopId(null);
      setBottomId(null);
    } else {
      setTopId(initialOutfit.pieces[0]?.id ?? null);
      setBottomId(initialOutfit.pieces[1]?.id ?? null);
      setSingleId(null);
    }
  }, [initialOutfit]);

  const find = (id) => items.find((i) => i.id === id);
  const outfit = singleId
    ? { single: find(singleId)?.image_url }
    : { top: find(topId)?.image_url, bottom: find(bottomId)?.image_url };

  function toggleTop(id) {
    setSingleId(null);
    setTopId((cur) => (cur === id ? null : id));
  }
  function toggleBottom(id) {
    setSingleId(null);
    setBottomId((cur) => (cur === id ? null : id));
  }
  function toggleSingle(id) {
    setTopId(null);
    setBottomId(null);
    setSingleId((cur) => (cur === id ? null : id));
  }
  function clear() {
    setTopId(null);
    setBottomId(null);
    setSingleId(null);
  }

  const hasItems = items.length > 0;

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-2xl font-bold">Visualize</h2>
        <p className="text-sm text-ink/60">
          Layer your items on a mannequin to preview the look.
        </p>
      </div>

      {!hasItems ? (
        <div className="rounded-2xl border border-dashed border-sand bg-white/60 p-12 text-center text-sm text-ink/60">
          Add items to your closet first, then come back to build a look.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[280px,1fr]">
          {/* Preview column */}
          <div className="md:sticky md:top-20 md:self-start">
            <Mannequin outfit={outfit} />
            <div className="mt-3 flex justify-center gap-2">
              <button
                onClick={clear}
                className="rounded-full border border-sand bg-white px-4 py-1.5 text-sm hover:bg-sand"
              >
                Clear look
              </button>
            </div>
          </div>

          {/* Selector column */}
          <div className="space-y-6">
            {singles.length > 0 && (
              <Picker
                title="Dresses & single pieces"
                items={singles}
                selectedId={singleId}
                onPick={toggleSingle}
              />
            )}
            <Picker
              title="Tops"
              items={tops}
              selectedId={topId}
              onPick={toggleTop}
              emptyHint="No tops catalogued yet."
            />
            <Picker
              title="Bottoms"
              items={bottoms}
              selectedId={bottomId}
              onPick={toggleBottom}
              emptyHint="No bottoms catalogued yet."
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Picker({ title, items, selectedId, onPick, emptyHint }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-ink/70">
        {title}{" "}
        <span className="font-normal text-ink/40">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-ink/40">{emptyHint}</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              compact
              selected={selectedId === item.id}
              onClick={() => onPick(item.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
