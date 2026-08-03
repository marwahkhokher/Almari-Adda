import React from 'react';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';

export default function OutfitCard({ outfit, suggestion }) {
  const data = outfit || suggestion || {};
  const { title = "Suggested Outfit", items = [], reasoning, confidence, confidence_score } = data;
  const matchScore = confidence || confidence_score;

  return (
    <Card className="p-4 mb-4 border-accent-light/60 bg-white/90 shadow-soft">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-display text-base font-bold text-accent-hover">{title}</h3>
        {matchScore && (
          <Badge variant={matchScore > 0.8 ? 'success' : 'default'}>
            {Math.round(matchScore * 100)}% Match
          </Badge>
        )}
      </div>
      
      {items && items.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 w-[80px]">
              <div className="w-20 h-20 rounded-xl bg-primary/70 border border-surface-light overflow-hidden flex items-center justify-center p-1.5 shadow-inner">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.category} className="w-full h-full object-contain filter drop-shadow-sm" />
                ) : (
                  <span className="text-xs text-text-muted text-center px-1">{item.category}</span>
                )}
              </div>
              <span className="text-[11px] text-text-secondary truncate w-full text-center font-medium capitalize">
                {item.subcategory || item.category}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {reasoning && (
        <div className="bg-secondary/60 rounded-xl p-3 text-xs md:text-sm text-text-secondary border border-surface-light">
          <p>{reasoning}</p>
        </div>
      )}
    </Card>
  );
}
