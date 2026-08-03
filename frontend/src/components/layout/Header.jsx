import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Header({ title, showBack = false, rightAction, className }) {
  const navigate = useNavigate();

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full bg-primary/85 backdrop-blur-xl border-b border-surface-light px-4 py-3 h-16 flex items-center justify-between shadow-soft",
      className
    )}>
      <div className="flex items-center w-1/4">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-text-secondary hover:text-accent transition-colors focus:outline-none rounded-full hover:bg-secondary"
            aria-label="Back"
          >
            <ChevronLeft size={24} />
          </button>
        )}
      </div>
      
      <div className="flex-1 text-center">
        {title && (
          <h1 className="font-display text-lg font-bold text-text-primary truncate">
            {title}
          </h1>
        )}
      </div>
      
      <div className="flex items-center justify-end w-1/4">
        {rightAction}
      </div>
    </header>
  );
}
