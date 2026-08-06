import { SlidersHorizontal, X } from 'lucide-react';
import { titleCase } from '../../lib/format.js';
import { SEASON_EMOJI, colorSwatch } from '../../lib/attributes.js';

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
        active
          ? 'gradient-accent text-white shadow-soft'
          : 'bg-white text-text-secondary border border-surface-light hover:bg-secondary hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function Group({ label, values, selected, renderChip }) {
  if (!values || values.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-text-muted pl-1">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => renderChip(value, selected.includes(value)))}
      </div>
    </div>
  );
}

/**
 * Dynamic colour / season / event filter panel.
 *
 * Props:
 *  - options:  { colors, seasons, events }  (from GET /filters/options)
 *  - selected: { colors, seasons, events }  (currently active values)
 *  - onToggle(dimension, value)             (toggle one value)
 *  - onClear()                              (clear every selection)
 *  - resultCount                            (items after filtering)
 */
export default function AttributeFilters({
  options,
  selected,
  onToggle,
  onClear,
  resultCount,
}) {
  const totalOptions =
    (options.colors?.length || 0) +
    (options.seasons?.length || 0) +
    (options.events?.length || 0);

  if (totalOptions === 0) return null;

  const activeCount =
    selected.colors.length + selected.seasons.length + selected.events.length;

  return (
    <div className="bg-white/80 border border-surface-light rounded-3xl shadow-soft p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-accent-hover" />
          <h3 className="font-display text-base font-bold text-text-primary">
            Filter by colour, season & event
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-muted font-semibold whitespace-nowrap">
            {resultCount} {resultCount === 1 ? 'match' : 'matches'}
          </span>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent-hover hover:text-accent transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear ({activeCount})
            </button>
          )}
        </div>
      </div>

      <Group
        label="Colour"
        values={options.colors}
        selected={selected.colors}
        onToggle={onToggle}
        renderChip={(value, active) => (
          <Chip key={value} active={active} onClick={() => onToggle('colors', value)}>
            <span
              className="w-3 h-3 rounded-full border border-black/10 shrink-0"
              style={{ background: colorSwatch(value) }}
            />
            {titleCase(value)}
          </Chip>
        )}
      />

      <Group
        label="Season"
        values={options.seasons}
        selected={selected.seasons}
        onToggle={onToggle}
        renderChip={(value, active) => (
          <Chip key={value} active={active} onClick={() => onToggle('seasons', value)}>
            <span>{SEASON_EMOJI[value.toLowerCase()] || '•'}</span>
            {titleCase(value)}
          </Chip>
        )}
      />

      <Group
        label="Event"
        values={options.events}
        selected={selected.events}
        onToggle={onToggle}
        renderChip={(value, active) => (
          <Chip key={value} active={active} onClick={() => onToggle('events', value)}>
            {value}
          </Chip>
        )}
      />
    </div>
  );
}
