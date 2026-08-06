import React, { useMemo } from 'react';
import {
  BarChart3,
  ChevronRight,
  Lightbulb,
  Sparkles,
  Trophy,
} from 'lucide-react';

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

function getItemCategory(item) {
  const category = normalize(item?.category);
  const subcategory = normalize(item?.subcategory);
  const combined = `${category} ${subcategory}`;

  if (
    combined.includes('shalwar') ||
    combined.includes('kameez') ||
    combined.includes('kurta') ||
    combined.includes('kurti') ||
    combined.includes('eastern') ||
    combined.includes('lehenga') ||
    combined.includes('saree')
  ) {
    return 'Eastern Wear';
  }

  if (
    combined.includes('dress') ||
    combined.includes('gown') ||
    combined.includes('jumpsuit')
  ) {
    return 'Dresses';
  }

  if (
    combined.includes('jean') ||
    combined.includes('trouser') ||
    combined.includes('pant') ||
    combined.includes('skirt') ||
    combined.includes('short') ||
    combined.includes('bottom')
  ) {
    return 'Bottoms';
  }

  if (
    combined.includes('coat') ||
    combined.includes('jacket') ||
    combined.includes('blazer') ||
    combined.includes('cardigan') ||
    combined.includes('outerwear')
  ) {
    return 'Outerwear';
  }

  if (
    combined.includes('shirt') ||
    combined.includes('blouse') ||
    combined.includes('sweater') ||
    combined.includes('hoodie') ||
    combined.includes('top') ||
    combined.includes('t-shirt')
  ) {
    return 'Tops';
  }

  if (
    combined.includes('shoe') ||
    combined.includes('sneaker') ||
    combined.includes('heel') ||
    combined.includes('boot') ||
    combined.includes('sandal')
  ) {
    return 'Shoes';
  }

  if (
    combined.includes('bag') ||
    combined.includes('jewelry') ||
    combined.includes('jewellery') ||
    combined.includes('scarf') ||
    combined.includes('belt') ||
    combined.includes('accessor')
  ) {
    return 'Accessories';
  }

  return 'Other';
}

function getDisplayName(item) {
  return item?.name || item?.subcategory || item?.category || 'Closet item';
}

function getWearCount(item) {
  const value = Number(item?.times_worn ?? item?.wear_count ?? 0);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value.map(normalize).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .replace(/[{}\[\]"]/g, '')
      .split(',')
      .map(normalize)
      .filter(Boolean);
  }

  return [];
}

function getItemSeasons(item) {
  return toArray(item?.season);
}

function getItemEvents(item) {
  return toArray(item?.events ?? item?.event);
}

function arraysAreCompatible(first, second, universalValues = []) {
  if (!first.length || !second.length) {
    return true;
  }

  if (
    first.some((value) => universalValues.includes(value)) ||
    second.some((value) => universalValues.includes(value))
  ) {
    return true;
  }

  return first.some((value) => second.includes(value));
}

function seasonsAreCompatible(firstItem, secondItem) {
  return arraysAreCompatible(
    getItemSeasons(firstItem),
    getItemSeasons(secondItem),
    ['all seasons', 'all-season', 'all season']
  );
}

function eventsAreCompatible(firstItem, secondItem) {
  return arraysAreCompatible(
    getItemEvents(firstItem),
    getItemEvents(secondItem),
    ['all', 'any', 'everyday']
  );
}

const NEUTRAL_COLORS = new Set([
  'black',
  'white',
  'cream',
  'beige',
  'brown',
  'grey',
  'gray',
  'navy',
  'denim',
  'tan',
  'khaki',
]);

const COLOR_FAMILIES = [
  new Set(['blue', 'navy', 'denim', 'light blue', 'dark blue']),
  new Set(['red', 'maroon', 'burgundy', 'pink', 'rose']),
  new Set(['green', 'olive', 'sage', 'emerald']),
  new Set(['brown', 'beige', 'cream', 'tan', 'camel', 'khaki']),
  new Set(['purple', 'lavender', 'lilac']),
  new Set(['yellow', 'mustard', 'gold']),
];

function colorsAreCompatible(firstItem, secondItem) {
  const firstColor = normalize(firstItem?.color);
  const secondColor = normalize(secondItem?.color);

  if (!firstColor || !secondColor) {
    return true;
  }

  if (firstColor === secondColor) {
    return true;
  }

  if (
    NEUTRAL_COLORS.has(firstColor) ||
    NEUTRAL_COLORS.has(secondColor)
  ) {
    return true;
  }

  return COLOR_FAMILIES.some(
    (family) =>
      family.has(firstColor) &&
      family.has(secondColor)
  );
}

function itemsAreCompatible(...outfitItems) {
  const validItems = outfitItems.filter(Boolean);

  for (let firstIndex = 0; firstIndex < validItems.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < validItems.length;
      secondIndex += 1
    ) {
      const firstItem = validItems[firstIndex];
      const secondItem = validItems[secondIndex];

      if (
        !colorsAreCompatible(firstItem, secondItem) ||
        !seasonsAreCompatible(firstItem, secondItem) ||
        !eventsAreCompatible(firstItem, secondItem)
      ) {
        return false;
      }
    }
  }

  return true;
}

function calculateOutfitPotential(items) {
  const safeItems = Array.isArray(items) ? items : [];

  const tops = safeItems.filter(
    (item) => getItemCategory(item) === 'Tops'
  );
  const bottoms = safeItems.filter(
    (item) => getItemCategory(item) === 'Bottoms'
  );
  const outerwear = safeItems.filter(
    (item) => getItemCategory(item) === 'Outerwear'
  );
  const fullBodyPieces = safeItems.filter((item) =>
    ['Dresses', 'Eastern Wear'].includes(getItemCategory(item))
  );

  let total = 0;

  tops.forEach((top) => {
    bottoms.forEach((bottom) => {
      if (!itemsAreCompatible(top, bottom)) {
        return;
      }

      total += 1;

      outerwear.forEach((layer) => {
        if (itemsAreCompatible(top, bottom, layer)) {
          total += 1;
        }
      });
    });
  });

  fullBodyPieces.forEach((piece) => {
    total += 1;

    outerwear.forEach((layer) => {
      if (itemsAreCompatible(piece, layer)) {
        total += 1;
      }
    });
  });

  return total;
}

function getAiTip(items, categoryEntries) {
  if (!items.length) {
    return 'Add a few pieces to your almari to unlock personalised wardrobe advice.';
  }

  const neverWornCount = items.filter(
    (item) => getWearCount(item) === 0
  ).length;

  if (neverWornCount >= 3) {
    return `You have ${neverWornCount} pieces that have not been worn yet. Try styling one this week.`;
  }

  const tops =
    categoryEntries.find(([name]) => name === 'Tops')?.[1] || 0;
  const bottoms =
    categoryEntries.find(([name]) => name === 'Bottoms')?.[1] || 0;

  if (tops >= bottoms * 2 && tops >= 4) {
    return 'You own many more tops than bottoms. One versatile bottom could unlock more outfits.';
  }

  if (bottoms >= tops * 2 && bottoms >= 4) {
    return 'Your wardrobe is bottom-heavy. A versatile top could make it easier to style.';
  }

  return 'Your wardrobe is nicely balanced. Rotate in a less-worn piece to keep your looks fresh.';
}

export default function WardrobeInsights({
  items = [],
  onItemClick,
  onBuildOutfit,
  onAskStylist,
}) {
  const safeItems = Array.isArray(items) ? items : [];

  const mostWornItems = useMemo(
    () =>
      [...safeItems]
        .sort((a, b) => getWearCount(b) - getWearCount(a))
        .slice(0, 3),
    [safeItems]
  );

  const categoryEntries = useMemo(() => {
    const counts = safeItems.reduce((result, item) => {
      const category = getItemCategory(item);
      result[category] = (result[category] || 0) + 1;
      return result;
    }, {});

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topFour = sorted.slice(0, 4);
    const remainingCount = sorted
      .slice(4)
      .reduce((total, [, count]) => total + count, 0);

    return remainingCount > 0
      ? [...topFour, ['Other', remainingCount]]
      : topFour;
  }, [safeItems]);

  const outfitPotential = useMemo(
    () => calculateOutfitPotential(safeItems),
    [safeItems]
  );

  const aiTip = useMemo(
    () => getAiTip(safeItems, categoryEntries),
    [safeItems, categoryEntries]
  );

  return (
    <section className="mt-6 rounded-3xl border border-[#e6d5b8] bg-[#FCF6EC] p-5 shadow-[0_8px_30px_rgba(61,36,23,0.08)]">
      <div className="mb-4">
        <p className="text-sm font-semibold text-[#3d2417]">
          Wardrobe Insights
        </p>
        <p className="mt-0.5 text-xs text-[#9a846e]">
          A quick look at how your almari is working for you.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-h-[170px] rounded-2xl border border-[#eadcc6] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3e6cf] text-[#7a2331]">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#3d2417]">
                Wardrobe Rotation
              </p>
              <p className="text-[11px] text-[#9a846e]">
                Your most-worn pieces
              </p>
            </div>
          </div>

          {mostWornItems.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {mostWornItems.map((item, index) => {
                const wearCount = getWearCount(item);

                return (
                  <button
                    key={item?.id || index}
                    type="button"
                    onClick={() => onItemClick?.(item)}
                    className="group min-w-0 rounded-xl border border-[#eee1cf] bg-[#fffdf9] p-2 text-left transition hover:border-[#7a2331]/45"
                  >
                    <div className="relative mb-1.5 flex h-14 items-center justify-center overflow-hidden rounded-lg bg-white">
                      {item?.image_url ? (
                        <img
                          src={item.image_url}
                          alt={getDisplayName(item)}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <div className="text-xs text-[#a89478]">
                          No image
                        </div>
                      )}

                      <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#7a2331] text-[10px] font-bold text-white">
                        {index + 1}
                      </span>
                    </div>

                    <p className="truncate text-[11px] font-semibold capitalize text-[#3d2417]">
                      {getDisplayName(item)}
                    </p>

                    <p className="mt-0.5 text-[10px] text-[#9a846e]">
                      {wearCount === 0
                        ? 'Never worn'
                        : `${wearCount} ${wearCount === 1 ? 'wear' : 'wears'}`}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[92px] items-center justify-center rounded-xl border border-dashed border-[#e6d5b8] px-3 text-center text-xs text-[#9a846e]">
              Wear an outfit to start tracking your rotation.
            </div>
          )}
        </div>

        <div className="min-h-[170px] rounded-2xl border border-[#eadcc6] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3e6cf] text-[#7a2331]">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#3d2417]">
                Closet Breakdown
              </p>
              <p className="text-[11px] text-[#9a846e]">
                Top categories in your almari
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {categoryEntries.length > 0 ? (
              categoryEntries.map(([name, count]) => {
                const percentage = safeItems.length
                  ? Math.round((count / safeItems.length) * 100)
                  : 0;

                return (
                  <div key={name}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-[#6b5645]">
                        {name}
                      </span>
                      <span className="font-semibold text-[#3d2417]">
                        {count}
                      </span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-[#f3e6cf]">
                      <div
                        className="h-full rounded-full bg-[#7a2331]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-[92px] items-center justify-center rounded-xl border border-dashed border-[#e6d5b8] text-xs text-[#9a846e]">
                Add items to see your closet breakdown.
              </div>
            )}
          </div>
        </div>

        <div className="min-h-[125px] rounded-2xl border border-[#eadcc6] bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3e6cf] text-[#7a2331]">
              <Lightbulb className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-[#3d2417]">
              AI Closet Tip
            </p>
          </div>

          <p className="line-clamp-3 text-xs leading-relaxed text-[#6b5645]">
            {aiTip}
          </p>

          <button
            type="button"
            onClick={onAskStylist}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#7a2331] transition hover:underline"
          >
            Ask AI Stylist
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="min-h-[125px] rounded-2xl border border-[#eadcc6] bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f3e6cf] text-[#7a2331]">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-[#3d2417]">
              Outfit Potential
            </p>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-3xl font-bold text-[#7a2331]">
                {outfitPotential}
              </p>
              <p className="mt-0.5 text-[11px] text-[#9a846e]">
                compatible outfit combinations
              </p>
            </div>

            <button
              type="button"
              onClick={onBuildOutfit}
              className="inline-flex items-center gap-1 rounded-xl bg-[#7a2331] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-[#631b28]"
            >
              Build Outfit
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}