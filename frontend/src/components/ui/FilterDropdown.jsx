import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function FilterDropdown({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = value !== 'all';
  const displayValue = isActive ? value : label;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex items-center gap-1.5 pb-3 text-xs font-medium whitespace-nowrap capitalize transition-all ${
          isActive ? 'text-[#F4D9B8]' : 'text-[#C8A27F] hover:text-[#F0D4B5]'
        }`}
      >
        {displayValue}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        {isActive && (
          <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-pink-500 rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 min-w-[140px] max-h-56 overflow-y-auto bg-white rounded-xl shadow-lg border border-[#E8C9A4] py-1.5 z-30">
          <button
            onClick={() => {
              onChange('all');
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs capitalize hover:bg-pink-50 transition ${
              value === 'all' ? 'text-pink-600 font-semibold' : 'text-neutral-700'
            }`}
          >
            All {label}
            {value === 'all' && <Check className="w-3 h-3" />}
          </button>
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs capitalize hover:bg-pink-50 transition ${
                value === option ? 'text-pink-600 font-semibold' : 'text-neutral-700'
              }`}
            >
              {option}
              {value === option && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
