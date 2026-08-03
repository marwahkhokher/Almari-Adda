import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  loading = false, 
  disabled, 
  fullWidth, 
  children, 
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl px-5 py-2.5 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "gradient-accent text-white font-semibold shadow-soft hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0",
    secondary: "bg-white text-text-primary border border-surface-light hover:bg-secondary hover:border-accent-light",
    ghost: "bg-transparent text-text-secondary hover:bg-secondary hover:text-text-primary",
    danger: "bg-error/15 text-error border border-error/20 hover:bg-error/25"
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
