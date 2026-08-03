import React from 'react';

export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: "bg-accent-light/60 text-accent-hover border border-accent/20",
    success: "bg-pastel-sage text-success border border-success/30",
    neutral: "bg-secondary text-text-secondary border border-surface-light",
    pink: "bg-pastel-pink text-accent-hover border border-accent-light",
    lavender: "bg-pastel-lavender text-purple-700 border border-purple-200",
    blue: "bg-pastel-blue text-blue-700 border border-blue-200"
  };

  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1 ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
