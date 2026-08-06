import React from 'react';
import Card from '../ui/Card.jsx';

export default function OutfitCard({ outfit, suggestion }) {
  const data = outfit || suggestion || {};
  const {
    title = 'Suggested Outfit',
    items = [],
    reasoning,
  } = data;

  return (
    <Card className="mb-5 overflow-hidden rounded-[24px] border border-[#DDD0C1] bg-[#FFFBF5] shadow-[0_10px_30px_rgba(74,44,29,0.08)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E9DED2] px-6 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#9B7C60]">
            Outfit Suggestion
          </p>

          <h3 className="mt-1 font-serif text-[22px] font-semibold text-[#4A2C1D]">
            {title}
          </h3>
        </div>
      </div>

      {/* Clothing */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-5 p-6 sm:grid-cols-4">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="group flex flex-col items-center"
            >
              <div
                className="
                  flex h-32 w-full items-center justify-center
                  rounded-2xl
                  border border-[#E7D8C7]
                  bg-[#FBF7F1]
                  p-3
                  transition
                  duration-300
                  group-hover:-translate-y-1
                  group-hover:border-[#B58B67]
                  group-hover:shadow-lg
                "
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.category}
                    className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="text-center text-xs text-[#9A8576]">
                    {item.category}
                  </span>
                )}
              </div>

              <span className="mt-3 text-center font-medium capitalize text-[#5F4638]">
                {item.subcategory || item.category}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* AI reasoning */}
      {reasoning && (
        <div className="mx-6 mb-6 rounded-2xl border border-[#E5D5C2] bg-[#F8F2EA] p-5">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#A87848]" />

            <span className="font-serif text-sm font-semibold text-[#6A4329]">
              Why this outfit works
            </span>
          </div>

          <p className="leading-7 text-[#6F5A4A]">
            {reasoning}
          </p>
        </div>
      )}
    </Card>
  );
}