import { useRef } from "react";

// A neutral dress-form silhouette drawn as inline SVG. Kept light so the
// clothing cutouts layered on top are the focus.
function Silhouette() {
  return (
    <svg
      viewBox="0 0 200 320"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="form" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8ded0" />
          <stop offset="100%" stopColor="#d8cbb8" />
        </linearGradient>
      </defs>
      {/* head */}
      <circle cx="100" cy="34" r="20" fill="url(#form)" />
      {/* neck */}
      <rect x="92" y="50" width="16" height="16" fill="url(#form)" />
      {/* torso + hips (dress-form shape) */}
      <path
        d="M62 70 Q100 60 138 70 L150 150 Q150 180 128 190 L128 250 Q128 264 118 264 L82 264 Q72 264 72 250 L72 190 Q50 180 50 150 Z"
        fill="url(#form)"
      />
      {/* legs */}
      <rect x="80" y="262" width="16" height="52" rx="6" fill="url(#form)" />
      <rect x="104" y="262" width="16" height="52" rx="6" fill="url(#form)" />
    </svg>
  );
}

// Regions expressed as % of the frame, per garment role.
const REGIONS = {
  single: { top: "16%", left: "15%", width: "70%", height: "66%" },
  top: { top: "18%", left: "18%", width: "64%", height: "38%" },
  bottom: { top: "48%", left: "22%", width: "56%", height: "46%" },
};

function Layer({ src, region, z }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      style={{ ...region, zIndex: z }}
      className="pointer-events-none absolute object-contain drop-shadow-md"
    />
  );
}

// `outfit` is a normalized shape: { top, bottom, single } of image URLs.
export default function Mannequin({ outfit, className = "" }) {
  const frameRef = useRef(null);
  const empty = !outfit?.top && !outfit?.bottom && !outfit?.single;

  return (
    <div
      ref={frameRef}
      className={`checker relative mx-auto aspect-[200/320] w-full max-w-[280px] overflow-hidden rounded-2xl border border-sand bg-white ${className}`}
    >
      <Silhouette />
      {outfit?.single ? (
        <Layer src={outfit.single} region={REGIONS.single} z={20} />
      ) : (
        <>
          <Layer src={outfit?.bottom} region={REGIONS.bottom} z={10} />
          <Layer src={outfit?.top} region={REGIONS.top} z={20} />
        </>
      )}
      {empty && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-ink/50">
          Pick an outfit to preview it here
        </div>
      )}
    </div>
  );
}
