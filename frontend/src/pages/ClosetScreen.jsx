import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ItemDetailModal from '../components/ItemDetailModal.jsx';

import {
  AlertTriangle,
  ArrowUpDown,
  Check,
  CloudUpload,
  Grid2X2,
  Heart,
  Home,
  LayoutGrid,
  List,
  Menu,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  User,
  Wand2,
  WandSparkles,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext.jsx';
import {
  getCatalogue,
  getFilterOptions,
  getItemMetadata,
} from '../lib/api.js';
import { SEASON_EMOJI, colorSwatch } from '../lib/attributes.js';
import Sidebar from '../components/Sidebar2.jsx';
import ProfileDrawer from './ProfileScreen.jsx';
import AttributeFilters from '../components/closet/AttributeFilters.jsx';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'tops', label: 'Tops' },
  { key: 'bottoms', label: 'Bottoms' },
  { key: 'full-body', label: 'Dresses' },
  { key: 'eastern', label: 'Eastern Wear' },
  { key: 'outerwear', label: 'Outerwear' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'accessories', label: 'Accessories' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'name-asc', label: 'Name (A–Z)' },
  { key: 'name-desc', label: 'Name (Z–A)' },
];

function Hanger() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5.5C12 3.8 13.3 2.5 15 2.5C16.7 2.5 18 3.8 18 5.5C18 7.2 16.5 8 15.5 8.8L12 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 11L3 17.5C2.4 18 2.8 19 3.6 19H20.4C21.2 19 21.6 18 21 17.5L12 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    route: '/dashboard',
  },
  {
    label: 'Closet',
    route: '/closet',
  },
  {
    label: 'Visualizer',
    route: '/visualize',
  },
  {
    label: 'Upload Item',
    route: '/upload',
  },
  {
    label: 'Build Outfit',
    route: '/build-outfit',
  },
  {
    label: 'AI Stylist',
    route: '/chatbot',
  },
];

function normalizeCategory(item) {
  const category = (item.category || '').toLowerCase();
  const subcategory = (item.subcategory || '').toLowerCase();

  if (['dress', 'gown', 'jumpsuit', 'saree', 'abaya', 'lehenga', 'casual dress', 'formal dress'].includes(subcategory)) return 'full-body';
  if (['shalwar kameez', 'kurta', 'kurti'].includes(subcategory) || category.includes('eastern')) return 'eastern';
  if (['jacket', 'blazer', 'coat', 'cardigan', 'suit jacket'].includes(subcategory) || category.includes('outerwear')) return 'outerwear';
  if (['heels', 'flats', 'sneakers', 'sandals', 'boots', 'shoes'].includes(subcategory) || category.includes('shoe')) return 'shoes';
  if (['bag', 'handbag', 'jewelry', 'scarf', 'belt', 'accessory', 'accessories'].includes(subcategory) || category.includes('accessor')) return 'accessories';
  if (category === 'top' || category === 'tops' || ['t-shirt', 'shirt', 'blouse', 'sweater', 'hoodie'].includes(subcategory)) return 'tops';
  if (category === 'bottom' || category === 'bottoms' || ['jeans', 'trousers', 'shorts', 'skirt', 'pants'].includes(subcategory)) return 'bottoms';
  return category || 'other';
}

export default function ClosetScreen() {
  const [items, setItems] = useState(() => {
  try {
    const cachedItems = sessionStorage.getItem(
      'almari-closet-items'
    );

    const parsedItems = cachedItems
      ? JSON.parse(cachedItems)
      : [];

    return Array.isArray(parsedItems)
      ? parsedItems
      : [];
  } catch {
    return [];
  }
});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [favorites, setFavorites] = useState(new Set());
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [options, setOptions] = useState({ colors: [], seasons: [], events: [] });
  const [selColors, setSelColors] = useState([]);
  const [selSeasons, setSelSeasons] = useState([]);
  const [selEvents, setSelEvents] = useState([]);

  // Wear-count filter: equal to, less than or equal to, or greater than or equal to.
  const [wearComparison, setWearComparison] = useState('eq');
  const [wearCountInput, setWearCountInput] = useState('');

  const navigate = useNavigate();
  const { signOut } = useAuth();
  const handleItemClick = (item) => {
  setSelectedItem(item);
};

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleNavItem = (navItem) => {
  setIsMobileSidebarOpen(false);

  if (navItem?.route) {
    navigate(navItem.route);
  }
};

  useEffect(() => {
    getFilterOptions()
      .then(setOptions)
      .catch(err => console.error('Failed to load filter options:', err));
  }, []);

  const fetchCatalogue = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getCatalogue();

      const catalogueItems =
        response?.items ??
        response?.data ??
        response ??
        [];

      const safeItems = Array.isArray(catalogueItems)
        ? catalogueItems
        : [];

      // Wear count lives in item_metadata, so merge it into each catalogue item.
      // Individual metadata failures fall back to zero without breaking the closet.
      const enrichedItems = await Promise.all(
        safeItems.map(async (item) => {
          try {
            const metadata = await getItemMetadata(item.id);

            return {
              ...item,
              color: metadata?.color ?? item?.color ?? null,
              season: metadata?.season ?? item?.season ?? [],
              events: metadata?.events ?? item?.events ?? [],
              times_worn: Number(metadata?.times_worn ?? item?.times_worn ?? 0),
            };
          } catch (metadataError) {
            console.error(
              `Failed to load metadata for item ${item.id}:`,
              metadataError
            );

            return {
              ...item,
              times_worn: Number(item?.times_worn ?? 0),
            };
          }
        })
      );

      setItems(enrichedItems);

sessionStorage.setItem(
  'almari-closet-items',
  JSON.stringify(enrichedItems)
);
    } catch (err) {
      console.error('Failed to load catalogue:', err);

      setError(
        err?.message ||
          'Could not load your wardrobe. Please make sure the backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogue();
  }, [fetchCatalogue]);

  const handleToggle = (dimension, value) => {
    const setter = { colors: setSelColors, seasons: setSelSeasons, events: setSelEvents }[dimension];
    setter(list => (list.includes(value) ? list.filter(v => v !== value) : [...list, value]));
  };

  const clearAttributeFilters = () => {
    setSelColors([]);
    setSelSeasons([]);
    setSelEvents([]);
    setFavoritesOnly(false);
    setWearComparison('eq');
    setWearCountInput('');
  };

  const toggleFavorite = id => {
    setFavorites(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const requestedWearCount =
      wearCountInput === '' ? null : Number(wearCountInput);

    const filtered = items.filter(item => {
      const itemCategory = normalizeCategory(item);
      const name = `${item.subcategory || ''} ${item.category || ''} ${item.color || ''}`.toLowerCase();

      if (activeFilter !== 'all' && itemCategory !== activeFilter) {
        return false;
      }

      if (favoritesOnly && !favorites.has(item.id)) {
        return false;
      }

      if (query && !name.includes(query)) {
        return false;
      }

      const itemColor = String(item?.color || '').trim().toLowerCase();
      if (
        selColors.length > 0 &&
        !selColors.some(
          color => String(color).trim().toLowerCase() === itemColor
        )
      ) {
        return false;
      }

      const rawSeasons = item?.season;
      const itemSeasons = Array.isArray(rawSeasons)
        ? rawSeasons.map(season => String(season).trim().toLowerCase())
        : typeof rawSeasons === 'string'
          ? rawSeasons
              .replace(/[{}[\]"]/g, '')
              .split(',')
              .map(season => season.trim().toLowerCase())
              .filter(Boolean)
          : [];

      if (
        selSeasons.length > 0 &&
        !selSeasons.some(season =>
          itemSeasons.includes(String(season).trim().toLowerCase())
        ) &&
        !itemSeasons.includes('all seasons')
      ) {
        return false;
      }

      const rawEvents = item?.events;
      const itemEvents = Array.isArray(rawEvents)
        ? rawEvents.map(event => String(event).trim().toLowerCase())
        : typeof rawEvents === 'string'
          ? rawEvents
              .replace(/[{}[\]"]/g, '')
              .split(',')
              .map(event => event.trim().toLowerCase())
              .filter(Boolean)
          : [];

      if (
        selEvents.length > 0 &&
        !selEvents.some(event =>
          itemEvents.includes(String(event).trim().toLowerCase())
        )
      ) {
        return false;
      }

      if (
        requestedWearCount !== null &&
        Number.isFinite(requestedWearCount) &&
        requestedWearCount >= 0
      ) {
        const timesWorn = Number(item?.times_worn ?? 0);

        if (wearComparison === 'eq' && timesWorn !== requestedWearCount) {
          return false;
        }

        if (wearComparison === 'lte' && timesWorn > requestedWearCount) {
          return false;
        }

        if (wearComparison === 'gte' && timesWorn < requestedWearCount) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      const aName = (a.subcategory || a.category || '').toLowerCase();
      const bName = (b.subcategory || b.category || '').toLowerCase();

      if (sortBy === 'name-asc') {
        return aName.localeCompare(bName);
      }

      if (sortBy === 'name-desc') {
        return bName.localeCompare(aName);
      }

      return 0;
    });
  }, [
    items,
    activeFilter,
    favoritesOnly,
    favorites,
    searchQuery,
    sortBy,
    selColors,
    selSeasons,
    selEvents,
    wearComparison,
    wearCountInput,
  ]);

  const hasWearCountFilter =
    wearCountInput !== '' &&
    Number.isFinite(Number(wearCountInput)) &&
    Number(wearCountInput) >= 0;

  const attributeFilterCount =
    selColors.length +
    selSeasons.length +
    selEvents.length +
    (hasWearCountFilter ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#FBF3E7]">
      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#e6d5b8] bg-[#FBF3E7]/95 px-4 backdrop-blur lg:hidden">
        <button onClick={() => setIsMobileSidebarOpen(true)} className="rounded-full p-2 text-[#3d2417]" aria-label="Open menu">
          <Menu size={22} />
        </button>
        <div className="font-serif text-lg font-semibold tracking-[0.14em] text-[#7a2331]">ALMARI ADDA</div>
        <button onClick={() => setIsProfileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e6d5b8] bg-white" aria-label="Profile">
          <User size={17} />
        </button>
      </div>

      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileSidebarOpen(false)} className="fixed inset-0 z-[70] bg-black/40 lg:hidden" aria-label="Close menu" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }} className="fixed bottom-0 left-0 top-0 z-[80] w-[260px] max-w-[88vw] lg:hidden">
              <Sidebar navItems={NAV_ITEMS} onNavigate={handleNavItem} onSignOut={handleSignOut} onClose={() => setIsMobileSidebarOpen(false)} mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[260px] lg:block">
        <Sidebar navItems={NAV_ITEMS} onNavigate={handleNavItem} onSignOut={handleSignOut} />
      </aside>

      <div className="flex min-h-screen flex-col pt-16 lg:ml-[260px] lg:pt-0">
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-8 pt-8 md:px-10">
          <div className="mb-8 grid grid-cols-1 items-center gap-4 md:grid-cols-3">
            <div className="hidden md:block" />

            <div className="text-center">
              <h1 className="text-3xl font-display font-bold text-[#3d2417] md:text-4xl">
                Your <span className="text-[#7a2331]">Almari</span>
              </h1>
              <div className="mb-2 mt-2.5 flex items-center justify-center gap-2">
                <span className="h-px w-8 bg-[#c9a769]" />
                <span className="h-1.5 w-1.5 rotate-45 bg-[#c9a769]" />
                <span className="h-px w-8 bg-[#c9a769]" />
              </div>
              <p className="text-sm text-[#8a7360]">Everything you own, beautifully organised.</p>
            </div>

            <div className="flex items-center justify-center gap-2 md:justify-end">
              <button onClick={() => navigate('/visualize')} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#7a2331]/30 px-3 py-2 text-xs font-semibold text-[#7a2331] transition hover:bg-[#7a2331]/5">
                <WandSparkles className="h-4 w-4" />
                Visualize Look
              </button>
              <button onClick={() => navigate('/upload')} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#e6d5b8] px-3 py-2 text-xs font-semibold text-[#3d2417] transition hover:bg-[#f3e6cf]">
                <Plus className="h-4 w-4" />
                Add New Item
              </button>
              <button onClick={() => setIsProfileOpen(true)} aria-label="Profile" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e6d5b8] text-[#3d2417] transition hover:bg-[#f3e6cf]">
                <User className="h-4 w-4" />
              </button>
            </div>
          </div>

          <section className="rounded-3xl border border-[#e6d5b8] bg-[#FCF6EC] p-4 shadow-[0_8px_30px_rgba(61,36,23,0.08)] md:p-6">
            <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-2 text-sm text-[#6b5645]">
                <ShoppingBag className="h-4 w-4 text-[#7a2331]" />
                <span>
  {isLoading && items.length === 0
    ? 'Loading your almari...'
    : `${items.length} pieces in your almari`}
</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[210px] flex-1 sm:flex-none">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a89478]" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search your closet" className="h-10 w-full rounded-xl border border-[#e6d5b8] bg-white pl-9 pr-3 text-xs text-[#3d2417] outline-none transition placeholder:text-[#b9a58a] focus:border-[#7a2331] sm:w-[220px]" />
                </div>


                <button
                  type="button"
                  onClick={() => setShowFilterPanel(value => !value)}
                  className={`relative inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
                    showFilterPanel || attributeFilterCount > 0 || favoritesOnly
                      ? 'border-[#7a2331]/40 bg-[#7a2331]/5 text-[#7a2331]'
                      : 'border-[#e6d5b8] bg-white text-[#6b5645] hover:border-[#7a2331] hover:text-[#7a2331]'
                  }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                  {(attributeFilterCount > 0 || favoritesOnly) && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7a2331] px-1 text-[10px] text-white">
                      {attributeFilterCount + (favoritesOnly ? 1 : 0)}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <button onClick={() => setShowSortMenu(v => !v)} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#e6d5b8] bg-white px-3 text-xs font-semibold text-[#6b5645] transition hover:border-[#7a2331] hover:text-[#7a2331]">
                    <ArrowUpDown className="h-3.5 w-3.5" /> Sort
                  </button>
                  {showSortMenu && (
                    <div className="absolute right-0 z-30 mt-2 w-44 rounded-xl border border-[#e6d5b8] bg-white p-1 shadow-lg">
                      {SORT_OPTIONS.map(option => (
                        <button key={option.key} onClick={() => { setSortBy(option.key); setShowSortMenu(false); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium hover:bg-[#f3e6cf] ${sortBy === option.key ? 'text-[#7a2331]' : 'text-[#3d2417]'}`}>
                          {option.label}
                          {sortBy === option.key && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={fetchCatalogue} title="Refresh closet" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6d5b8] bg-white text-[#6b5645] transition hover:border-[#7a2331] hover:text-[#7a2331]">
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>

                <div className="flex h-10 items-center rounded-xl border border-[#e6d5b8] bg-white p-0.5">
                  <button onClick={() => setViewMode('grid')} title="Grid view" className={`rounded-lg p-2 transition ${viewMode === 'grid' ? 'bg-[#7a2331] text-white' : 'text-[#a89478] hover:text-[#7a2331]'}`}><LayoutGrid className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setViewMode('list')} title="List view" className={`rounded-lg p-2 transition ${viewMode === 'list' ? 'bg-[#7a2331] text-white' : 'text-[#a89478] hover:text-[#7a2331]'}`}><List className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>

            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map(category => (
                <button key={category.key} onClick={() => setActiveFilter(category.key)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${activeFilter === category.key ? 'bg-[#7a2331] text-white shadow-sm' : 'border border-[#e6d5b8] bg-white text-[#8a7360] hover:border-[#7a2331] hover:text-[#7a2331]'}`}>
                  {category.label}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {showFilterPanel && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
                  <div className="rounded-2xl border border-[#e6d5b8] bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <button onClick={() => setFavoritesOnly(v => !v)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${favoritesOnly ? 'border-[#7a2331] bg-[#7a2331]/5 text-[#7a2331]' : 'border-[#e6d5b8] text-[#6b5645]'}`}>
                        <Heart className={`h-4 w-4 ${favoritesOnly ? 'fill-[#7a2331]' : ''}`} /> Favourites only
                      </button>
                      {(attributeFilterCount > 0 || favoritesOnly) && <button onClick={clearAttributeFilters} className="text-xs font-semibold text-[#7a2331] hover:underline">Clear all</button>}
                    </div>
                    <AttributeFilters
                      options={options}
                      selected={{
                        colors: selColors,
                        seasons: selSeasons,
                        events: selEvents,
                      }}
                      onToggle={handleToggle}
                      onClear={clearAttributeFilters}
                      resultCount={visibleItems.length}
                    />

                    <div className="mt-4 border-t border-[#eee1cf] pt-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-[#3d2417]">
                            Times worn
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#9a846e]">
                            Compare each item's wear count with any number.
                          </p>
                        </div>

                        {hasWearCountFilter && (
                          <button
                            type="button"
                            onClick={() => {
                              setWearComparison('eq');
                              setWearCountInput('');
                            }}
                            className="text-[11px] font-semibold text-[#7a2331] hover:underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {[
                          { key: "lte", label: "≤" },
                          { key: "eq", label: "=" },
                          { key: "gte", label: "≥" },
                        ].map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setWearComparison(option.key)}
                            className={`flex h-9 w-14 items-center justify-center rounded-lg border transition ${
                              wearComparison === option.key
                                ? "border-[#7a2331] bg-[#7a2331] text-white"
                                : "border-[#e6d5b8] bg-white text-[#7a2331] hover:bg-[#f8efe4]"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}

                        <input
                        type="number"
                        min="0"
                        step="1"
                        value={wearCountInput}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (
                            value === '' ||
                            (/^\d+$/.test(value) && Number(value) >= 0)
                          ) {
                            setWearCountInput(value);
                          }
                        }}
                        placeholder="0"
                        aria-label="Times worn value"
                        className="h-9 w-16 rounded-full border border-[#e6d5b8] bg-white text-center text-sm font-semibold text-[#3d2417] outline-none transition focus:border-[#7a2331] focus:ring-2 focus:ring-[#7a2331]/10"
                      />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" /><span>{error}</span></div>
                <button onClick={fetchCatalogue} className="shrink-0 font-semibold hover:underline">Retry</button>
              </div>
            )}

            {isLoading && items.length === 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl border border-[#eadcc6] bg-white" />)}
              </div>
            ) : !error && visibleItems.length === 0 ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#e6d5b8] bg-white/60 px-6 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3e6cf] text-[#7a2331]">
                  {items.length === 0 ? <ShoppingBag className="h-7 w-7" /> : <SearchX className="h-7 w-7" />}
                </div>
                <h3 className="mb-2 font-display text-xl font-bold text-[#3d2417]">{items.length === 0 ? 'Your almari is waiting' : 'No pieces found'}</h3>
                <p className="mb-6 max-w-sm text-sm text-[#8a7360]">{items.length === 0 ? 'Upload your first clothing item to begin building your digital closet.' : 'Try another category, search, or filter combination.'}</p>
                {items.length === 0 ? (
                  <button onClick={() => navigate('/upload')} className="inline-flex items-center gap-2 rounded-xl bg-[#7a2331] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#631b28]"><Plus className="h-4 w-4" /> Add First Item</button>
                ) : (
                  <button onClick={() => { setActiveFilter('all'); setSearchQuery(''); clearAttributeFilters(); }} className="rounded-xl border border-[#7a2331]/30 px-5 py-2.5 text-sm font-semibold text-[#7a2331] hover:bg-[#7a2331]/5">Reset filters</button>
                )}
              </div>
            ) : !error && viewMode === 'grid' ? (
              <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                <AnimatePresence>
                  {visibleItems.map((item) => (
  <motion.div
    key={item.id}
    whileHover={{ y: -3 }}
    onClick={() => handleItemClick(item)}
    className="relative w-[92%] h-[200px] cursor-pointer overflow-hidden rounded-xl border border-[#e6d5b8] bg-white transition-all hover:border-[#7a2331]"
  >
    {item.image_url ? (
      <img
        src={item.image_url}
        alt={item.subcategory || item.category || 'Clothing item'}
        className="h-full w-full object-contain p-1.5"
      />
    ) : (
      <div className="flex h-full items-center justify-center">
        <ShoppingBag
          size={32}
          strokeWidth={1.2}
          className="text-[#a89478]"
        />
      </div>
    )}
  </motion.div>
))}
                </AnimatePresence>
              </motion.div>
            ) : !error ? (
              <div className="space-y-2.5">
                {visibleItems.map(item => {
                  const isFavorite = favorites.has(item.id);
                  return (
                    <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 rounded-2xl border border-[#e6d5b8] bg-white p-3 transition hover:border-[#7a2331]/45">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#f0e5d3] bg-[#fffdf9] p-1.5"><img src={item.image_url} alt={item.subcategory || item.category} className="h-full w-full object-contain" /></div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold capitalize text-[#3d2417]">{item.subcategory || item.category || 'Clothing item'}</h3>
                        <p className="mt-1 text-xs capitalize text-[#9a846e]">{item.color || normalizeCategory(item)}</p>
                      </div>
                      <button onClick={() => toggleFavorite(item.id)} className="rounded-full p-2 text-[#b19b7e] transition hover:bg-[#f3e6cf] hover:text-[#7a2331]" aria-label="Toggle favourite"><Heart className={`h-4 w-4 ${isFavorite ? 'fill-[#7a2331] text-[#7a2331]' : ''}`} /></button>
                    </motion.div>
                  );
                })}
              </div>
            ) : null}

            {!isLoading && !error && visibleItems.length > 0 && <p className="mt-5 text-center text-[11px] text-[#a89478]">Showing {visibleItems.length} of {items.length} pieces.</p>}
          </section>
        </main>
      </div>

      <button onClick={() => navigate('/chatbot')} title="AI Stylist" className="fixed bottom-6 right-6 z-30 flex h-20 w-20 flex-col items-center justify-center rounded-full bg-[#7a2331] text-white shadow-lg transition hover:bg-[#631b28]">
        <Sparkles className="mb-0.5 h-5 w-5" />
        <span className="text-[9px] font-semibold">AI Stylist</span>
      </button>

     <ItemDetailModal
  item={selectedItem}
  onClose={() => setSelectedItem(null)}
  onDeleted={(deletedId) => {
  setItems((currentItems) => {
    const updatedItems = currentItems.filter(
      (item) => item.id !== deletedId
    );

    sessionStorage.setItem(
      'almari-closet-items',
      JSON.stringify(updatedItems)
    );

    return updatedItems;
  });

  setSelectedItem(null);
}}
 onUpdated={(updatedId, changes) => {
  setItems((currentItems) => {
    const updatedItems = currentItems.map((item) =>
      item.id === updatedId
        ? { ...item, ...changes }
        : item
    );

    sessionStorage.setItem(
      'almari-closet-items',
      JSON.stringify(updatedItems)
    );

    return updatedItems;
  });

  setSelectedItem((currentItem) =>
    currentItem?.id === updatedId
      ? { ...currentItem, ...changes }
      : currentItem
  );
}}
/>
      <ProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}
