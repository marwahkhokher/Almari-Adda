import React, { forwardRef } from 'react';

const Input = forwardRef(({ label, error, type = 'text', className = '', ...rest }, ref) => {
  return (
    <div className="flex flex-col w-full">
      {label && (
        <label className="text-sm font-medium text-text-primary mb-1.5 font-body">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`w-full bg-white/90 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition font-body text-text-primary placeholder:text-text-muted shadow-soft ${
          error 
            ? 'border-error/60 focus:ring-error/30' 
            : 'border-surface-light focus:border-accent/60 focus:ring-accent/25'
        } ${className}`}
        {...rest}
      />
      {error && (
        <span className="text-xs text-error mt-1.5 font-body">{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
