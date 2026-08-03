import React from 'react';

export default function Card({ children, hover = false, onClick, className = '', ...rest }) {
  const hoverClasses = hover ? "hover:scale-[1.015] hover:shadow-medium cursor-pointer border-accent-light/50" : "";
  
  return (
    <div
      className={`bg-white rounded-2xl shadow-soft border border-surface-light overflow-hidden transition-all duration-300 ${hoverClasses} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
}
