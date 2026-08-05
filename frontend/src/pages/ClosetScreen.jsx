import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, AlertTriangle, RefreshCw, SearchX } from 'lucide-react';
import { getFilteredCatalogue, getFilterOptions } from '../lib/api.js';
import { SEASON_EMOJI, colorSwatch } from '../lib/attributes.js';
import Header from '../components/layout/Header.jsx';
import Button from '../components/ui/Button.jsx';
import AttributeFilters from '../components/closet/AttributeFilters.jsx';

export default function ClosetScreen() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Colour / season / event filters (dynamic, from the backend).
  const [options, setOptions] = useState({ colors: [], seasons: [], events: [] });
  const [selColors, setSelColors] = useState([]);
  const [selSeasons, setSelSeasons] = useState([]);
  const [selEvents, setSelEvents] = useState([]);

  const navigate = useNavigate();

  // Load the available filter options once (independent of the current
  // selection, so chips don't disappear as you narrow things down).
  useEffect(() => {
    getFilterOptions()
      .then(setOptions)
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  // Fetch the catalogue, filtered server-side by the active attribute
  // selections. Re-runs whenever a colour/season/event chip is toggled.
  const fetchCatalogue = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const catalogueItems = await getFilteredCatalogue({
        colors: selColors,
        seasons: selSeasons,
        events: selEvents,
      });
      setItems(Array.isArray(catalogueItems) ? catalogueItems : []);
    } catch (err) {
      console.error('Failed to load catalogue:', err);
      setError(
        err.message ||
          'Could not load your wardrobe from backend. Please ensure backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [selColors, selSeasons, selEvents]);

  useEffect(() => {
    fetchCatalogue();
  }, [fetchCatalogue]);

  const handleToggle = (dimension, value) => {
    const setter = {
      colors: setSelColors,
      seasons: setSelSeasons,
      events: setSelEvents,
    }[dimension];
    setter((list) =>
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    );
  };

  const clearAttributeFilters = () => {
    setSelColors([]);
    setSelSeasons([]);
    setSelEvents([]);
  };

  const attributeFilterCount =
    selColors.length + selSeasons.length + selEvents.length;

  const categories = ['all', 'tops', 'bottoms', 'full-body'];

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'all') return true;
    const cat = item.category?.toLowerCase() || '';
    const sub = item.subcategory?.toLowerCase() || '';
    if (activeFilter === 'full-body') {
      return ['dress', 'gown', 'jumpsuit', 'saree', 'abaya', 'lehenga'].includes(sub);
    }
    if (activeFilter === 'tops') {
      return cat === 'top' || cat === 'tops' || sub === 't-shirt' || sub === 'blouse' || sub === 'blazer' || sub === 'jacket' || sub === 'sweater' || sub === 'hoodie';
    }
    if (activeFilter === 'bottoms') {
      return cat === 'bottom' || cat === 'bottoms' || sub === 'jeans' || sub === 'trousers' || sub === 'shorts' || sub === 'skirt';
    }
    return cat === activeFilter || cat === activeFilter.slice(0, -1);
  });

  const getGroupedItems = () => {
    const grouped = { tops: [], bottoms: [], 'full-body': [], other: [] };
    const fullBodySubs = ['dress', 'gown', 'jumpsuit', 'saree', 'abaya', 'lehenga'];

    items.forEach(item => {
      const cat = item.category?.toLowerCase() || '';
      const sub = item.subcategory?.toLowerCase() || '';

      if (fullBodySubs.includes(sub)) {
        grouped['full-body'].push(item);
      } else if (cat === 'top' || cat === 'tops' || sub === 't-shirt' || sub === 'blouse' || sub === 'blazer' || sub === 'jacket' || sub === 'sweater' || sub === 'hoodie') {
        grouped.tops.push(item);
      } else if (cat === 'bottom' || cat === 'bottoms' || sub === 'jeans' || sub === 'trousers' || sub === 'shorts' || sub === 'skirt') {
        grouped.bottoms.push(item);
      } else {
        grouped.other.push(item);
      }
    });
    return grouped;
  };

  const groupedItems = getGroupedItems();

  const renderCard = (item) => {
    const seasons = (item.season || []).filter((s) => s && s !== 'all seasons');
    const events = item.events || [];
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="shrink-0 snap-start flex flex-col bg-white border border-surface-light rounded-2xl overflow-hidden hover:shadow-medium transition-all duration-300 w-[180px]"
      >
        <div className="h-[220px] bg-secondary/50 p-3 flex items-center justify-center relative group">
          <img
            src={item.image_url}
            alt={item.subcategory || item.category}
            className="max-h-full max-w-full object-contain filter drop-shadow-sm"
          />
        </div>
        <div className="p-3 border-t border-surface-light bg-white flex justify-between items-center">
          <div className="min-w-0">
            <p className="text-text-primary font-semibold truncate text-sm capitalize">
              {item.subcategory || item.category || 'Clothing Item'}
            </p>
            <p className="text-text-muted text-xs capitalize flex items-center gap-1">
              {item.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                  style={{ background: colorSwatch(item.color) }}
                  title={item.color}
                />
              )}
              <span className="truncate">{item.color || item.category}</span>
            </p>
          </div>
          {item.confidence && (
            <span className="text-[10px] text-accent-hover bg-pastel-pink px-2 py-0.5 rounded-full font-semibold border border-accent-light/50 shrink-0">
              {Math.round(item.confidence * 100)}%
            </span>
          )}
        </div>
        {(seasons.length > 0 || events.length > 0) && (
          <div className="px-3 pb-3 -mt-0.5 flex flex-wrap items-center gap-1">
            {seasons.map((s) => (
              <span key={s} title={s} className="text-[11px] leading-none">
                {SEASON_EMOJI[s.toLowerCase()] || ''}
              </span>
            ))}
            {events.slice(0, 2).map((e) => (
              <span
                key={e}
                className="text-[9px] font-semibold text-accent-hover bg-accent-light/50 border border-accent-light rounded-full px-1.5 py-0.5"
              >
                {e}
              </span>
            ))}
            {events.length > 2 && (
              <span className="text-[9px] text-text-muted font-semibold">
                +{events.length - 2}
              </span>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-primary gradient-pastel flex flex-col">
      <Header
        title="My Wardrobe"
        showBack={true}
        rightAction={
          <button
            onClick={fetchCatalogue}
            className="p-2 text-text-secondary hover:text-accent transition-colors rounded-full hover:bg-white/80"
            title="Refresh Wardrobe"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-accent' : ''}`} />
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto pb-12">
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

          <div className="p-3.5 bg-amber-50/80 border border-amber-200 text-amber-800 rounded-2xl flex items-start gap-3 shadow-soft">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs md:text-sm font-medium">Currently showing all wardrobe items in catalogue. User-scoped filtering coming soon.</p>
          </div>

          <AttributeFilters
            options={options}
            selected={{ colors: selColors, seasons: selSeasons, events: selEvents }}
            onToggle={handleToggle}
            onClear={clearAttributeFilters}
            resultCount={items.length}
          />

          <div className="flex items-center justify-between gap-4">
            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
                    activeFilter === cat
                      ? 'gradient-accent text-white shadow-soft'
                      : 'bg-white text-text-secondary border border-surface-light hover:bg-secondary hover:text-text-primary'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
            {!isLoading && (
              <span className="text-text-muted text-xs whitespace-nowrap hidden sm:block font-semibold">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-error/10 border border-error/20 flex flex-col items-center gap-3 text-center">
              <AlertTriangle className="text-error" size={24} />
              <p className="text-error text-sm font-medium">{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchCatalogue} className="mt-1">
                Retry Fetching
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-8">
              {[1, 2].map((section) => (
                <div key={section}>
                  <div className="h-6 w-32 bg-white rounded-full animate-pulse mb-4"></div>
                  <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="shrink-0 w-[180px] h-[280px] bg-white rounded-2xl animate-pulse shadow-soft"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : !error && items.length === 0 && attributeFilterCount > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-pastel-lavender flex items-center justify-center mb-4 border border-purple-100">
                <SearchX className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-2xl font-display font-bold text-text-primary mb-2">No items match these filters</h3>
              <p className="text-text-secondary mb-6 max-w-sm text-sm">Try removing a colour, season or event to widen your search.</p>
              <Button variant="secondary" onClick={clearAttributeFilters} className="px-6 font-semibold">
                Clear filters
              </Button>
            </motion.div>
          ) : !error && items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-pastel-pink flex items-center justify-center mb-4 border border-accent-light/40">
                <ShoppingBag className="w-10 h-10 text-accent-hover" />
              </div>
              <h3 className="text-2xl font-display font-bold text-text-primary mb-2">Your closet is empty</h3>
              <p className="text-text-secondary mb-8 max-w-sm text-sm">Upload clothing items to start building your personal virtual wardrobe.</p>
              <Button onClick={() => navigate('/upload')} className="gradient-accent text-white px-8 font-semibold shadow-soft">
                Add First Item
              </Button>
            </motion.div>
          ) : !error && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {activeFilter === 'all' ? (
                  <>
                    {groupedItems.tops.length > 0 && (
                      <section className="bg-white/80 p-5 rounded-3xl border border-surface-light shadow-soft">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="font-display text-xl font-bold text-accent-hover pl-1">Tops & Shirts</h2>
                          <span className="text-xs text-text-muted font-medium">{groupedItems.tops.length} items</span>
                        </div>
                        <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar snap-x snap-mandatory">
                          {groupedItems.tops.map(renderCard)}
                        </div>
                      </section>
                    )}
                    {groupedItems.bottoms.length > 0 && (
                      <section className="bg-white/80 p-5 rounded-3xl border border-surface-light shadow-soft">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="font-display text-xl font-bold text-accent-hover pl-1">Pants & Bottoms</h2>
                          <span className="text-xs text-text-muted font-medium">{groupedItems.bottoms.length} items</span>
                        </div>
                        <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar snap-x snap-mandatory">
                          {groupedItems.bottoms.map(renderCard)}
                        </div>
                      </section>
                    )}
                    {groupedItems['full-body'].length > 0 && (
                      <section className="bg-white/80 p-5 rounded-3xl border border-surface-light shadow-soft">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="font-display text-xl font-bold text-accent-hover pl-1">Full-Body & Dresses</h2>
                          <span className="text-xs text-text-muted font-medium">{groupedItems['full-body'].length} items</span>
                        </div>
                        <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar snap-x snap-mandatory">
                          {groupedItems['full-body'].map(renderCard)}
                        </div>
                      </section>
                    )}
                    {groupedItems.other.length > 0 && (
                      <section className="bg-white/80 p-5 rounded-3xl border border-surface-light shadow-soft">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="font-display text-xl font-bold text-accent-hover pl-1">Accessories & Other</h2>
                          <span className="text-xs text-text-muted font-medium">{groupedItems.other.length} items</span>
                        </div>
                        <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar snap-x snap-mandatory">
                          {groupedItems.other.map(renderCard)}
                        </div>
                      </section>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredItems.map(item => (
                      <div key={item.id} className="w-full justify-self-center">
                         {renderCard(item)}
                      </div>
                    ))}
                    {filteredItems.length === 0 && (
                      <div className="col-span-full py-12 text-center text-text-muted">
                        No items found in this category.
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
