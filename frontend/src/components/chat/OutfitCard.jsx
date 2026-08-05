import React from 'react';
import Card from '../ui/Card.jsx';

export default function OutfitCard({ outfit, suggestion }) {
  const data = outfit || suggestion || {};
  const { title = "Suggested Outfit", items = [], reasoning } = data;

  return (
    <Card className="p-4 mb-4 border-pink-200 bg-white shadow-soft">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-display text-base font-bold text-pink-700">
          {title}
        </h3>
      </div>

      {items && items.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 w-[80px]">
              <div className="w-20 h-20 rounded-xl bg-pink-50 border border-pink-100 overflow-hidden flex items-center justify-center p-1.5 shadow-inner">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.category}
                    className="w-full h-full object-contain filter drop-shadow-sm"
                  />
                ) : (
                  <span className="text-xs text-neutral-400 text-center px-1">
                    {item.category}
                  </span>
                )}
              </div>

              <span className="text-[11px] text-neutral-600 truncate w-full text-center font-medium capitalize">
                {item.subcategory || item.category}
              </span>
            </div>
          ))}
        </div>
      )}

      {reasoning && (
        <div className="bg-pink-50 rounded-xl p-3 text-xs md:text-sm text-neutral-600 border border-pink-100">
          <p>{reasoning}</p>
        </div>
      )}
    </Card>
  );
}