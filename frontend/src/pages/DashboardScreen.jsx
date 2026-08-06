import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import {
  AlertTriangle,
  CloudUpload,
  Heart,
  Home,
  Menu,
  Shirt,
  Sparkles,
  User,
  Wand2,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext.jsx';
import {
  getCatalogue,
  toggleFavorite,
} from '../lib/api.js';

import { playWhoosh } from '../lib/soundEffects.js';
import ItemDetailModal from '../components/ItemDetailModal.jsx';
import ProfileDrawer from './ProfileScreen.jsx';
import Sidebar from '../components/Sidebar2.jsx';

function Hanger() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5.5C12 3.8 13.3 2.5 15 2.5C16.7 2.5 18 3.8 18 5.5C18 7.2 16.5 8 15.5 8.8L12 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 11L3 17.5C2.4 18 2.8 19 3.6 19H20.4C21.2 19 21.6 18 21 17.5L12 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/* Matches Visualize/Chatbot/BuildOutfit's NAV_ITEMS (5 entries —
   Sidebar2's buttonPositions array only has 5 slots). */
const NAV_ITEMS = [
  { label: 'Closet', icon: Home, action: 'closet' },
  { label: 'Visualizer', icon: Sparkles, route: '/visualize' },
  { label: 'Upload Item', icon: CloudUpload, route: '/upload' },
  { label: 'Build Outfit', icon: Hanger, route: '/build-outfit' },
  { label: 'Stylist AI', icon: Wand2, route: '/chatbot' },
];

const CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'tops', label: 'Tops' },
  { key: 'bottoms', label: 'Bottoms' },
  { key: 'dresses', label: 'Dresses' },
  { key: 'eastern', label: 'Eastern Wear' },
  { key: 'outerwear', label: 'Outerwear' },
  { key: 'other', label: 'Other' },
];
const SEASON_OPTIONS = ['spring', 'summer', 'fall', 'winter'];

/* Front-page shortcuts to the app's four main tools. */
const QUICK_ACTIONS = [
  { title: 'Visualizer', desc: 'Try on outfits', icon: Sparkles, route: '/visualize' },
  { title: 'Upload Item', desc: 'Add to your closet', icon: CloudUpload, route: '/upload' },
  { title: 'Build Outfit', desc: 'Mix & match looks', icon: Hanger, route: '/build-outfit' },
  { title: 'Stylist AI', desc: 'Ask for style advice', icon: Wand2, route: '/chatbot' },
];

/* =========================================================
   HELPERS
========================================================= */

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function getItemCategory(item) {
  const category = normalize(item?.category);
  const subcategory = normalize(item?.subcategory);
  const combined = `${category} ${subcategory}`;

  if (combined.includes('shalwar') || combined.includes('kameez') || combined.includes('kurta') || combined.includes('kurti') || combined.includes('eastern') || combined.includes('lehenga') || combined.includes('saree')) {
    return 'eastern';
  }
  if (combined.includes('dress') || combined.includes('gown') || combined.includes('jumpsuit')) {
    return 'dresses';
  }
  if (combined.includes('jean') || combined.includes('trouser') || combined.includes('pant') || combined.includes('skirt') || combined.includes('short') || combined.includes('bottom')) {
    return 'bottoms';
  }
  if (combined.includes('coat') || combined.includes('jacket') || combined.includes('blazer') || combined.includes('cardigan') || combined.includes('outerwear')) {
    return 'outerwear';
  }
  if (combined.includes('shirt') || combined.includes('blouse') || combined.includes('sweater') || combined.includes('hoodie') || combined.includes('top') || combined.includes('t-shirt')) {
    return 'tops';
  }
  return 'other';
}

function getDisplayName(item) {
  return item?.name || item?.subcategory || item?.category || 'Closet item';
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function DashboardScreen() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeColor, setActiveColor] = useState('all');
  const [activeSeason, setActiveSeason] = useState('all');
  const [openFilterDropdown, setOpenFilterDropdown] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')?.[0] || 'Maya';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  const fetchCatalogue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getCatalogue();
      const catalogueItems = response?.items ?? response?.data ?? response ?? [];
      setItems(Array.isArray(catalogueItems) ? catalogueItems : []);
    } catch (fetchError) {
      console.error('Catalogue error:', fetchError);
      setError(fetchError?.message || 'We could not load your closet.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogue();
  }, [fetchCatalogue]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (signOutError) {
      console.error('Error signing out:', signOutError);
    }
  };

  const handleItemClick = (item) => {
    playWhoosh?.();
    setSelectedItem(item);
  };

  const handleToggleFavorite = async (event, item) => {
    event.stopPropagation();
    const newFavoriteValue = !item.is_favorite;

    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === item.id ? { ...currentItem, is_favorite: newFavoriteValue } : currentItem
      )
    );

    try {
      await toggleFavorite(item.id, newFavoriteValue);
    } catch (favoriteError) {
      console.error('Failed to update favorite:', favoriteError);
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id ? { ...currentItem, is_favorite: !newFavoriteValue } : currentItem
        )
      );
    }
  };

  const colorOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item?.color).filter(Boolean))),
    [items]
  );

  const categoryCounts = useMemo(() => {
    const counts = { all: items.length };
    CATEGORY_TABS.forEach((tab) => {
      if (tab.key !== 'all') counts[tab.key] = 0;
    });
    items.forEach((item) => {
      const category = getItemCategory(item);
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const category = getItemCategory(item);
      const matchesCategory = activeCategory === 'all' || category === activeCategory;
      const matchesColor = activeColor === 'all' || normalize(item?.color) === normalize(activeColor);

      const itemSeasons = (item?.season || []).map((s) => normalize(s));
      const matchesSeason =
        activeSeason === 'all' ||
        itemSeasons.includes(normalize(activeSeason)) ||
        itemSeasons.includes('all seasons');

      return matchesCategory && matchesColor && matchesSeason;
    });
  }, [items, activeCategory, activeColor, activeSeason]);

  const recentItems = useMemo(() => items.slice(0, 4), [items]);

  const handleNavItem = (navItem) => {
    setIsMobileSidebarOpen(false);
    if (navItem.route) {
      navigate(navItem.route);
      return;
    }
    if (navItem.action === 'closet') {
      setActiveCategory('all');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF3E7]">
      {/* MOBILE TOP BAR */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#e6d5b8] bg-[#FBF3E7]/95 px-4 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setIsMobileSidebarOpen(true)} className="rounded-full p-2 text-[#3d2417]" aria-label="Open menu">
          <Menu size={22} />
        </button>
        <div className="font-serif text-lg font-semibold tracking-[0.14em] text-[#7a2331]">ALMARI ADDA</div>
        <button
  onClick={() => setIsProfileOpen(true)}
  aria-label="Profile"
  className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#e6d5b8] hover:bg-[#f3e6cf] text-[#3d2417] transition"
>
  <User className="w-4 h-4" />
</button>
      </div>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 z-[70] bg-black/40 lg:hidden"
              aria-label="Close menu"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed bottom-0 left-0 top-0 z-[80] w-[260px] max-w-[88vw] lg:hidden"
            >
              <Sidebar navItems={NAV_ITEMS} onNavigate={handleNavItem} onSignOut={handleSignOut} onClose={() => setIsMobileSidebarOpen(false)} mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[260px] lg:block">
        <Sidebar navItems={NAV_ITEMS} onNavigate={handleNavItem} onSignOut={handleSignOut} />
      </aside>

      {/* MAIN CONTENT — same shape as the other screens */}
      <div className="flex min-h-screen flex-col pt-16 lg:ml-[260px] lg:pt-0">
        <main className="flex-1 px-4 md:px-10 py-8 max-w-[1440px] w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-8">
            <div className="hidden md:block" />

            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-[#3d2417]">
                Welcome back, <span className="text-[#7a2331]">{firstName}</span>
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2.5 mb-2">
                <span className="w-8 h-px bg-[#c9a769]" />
                <span className="w-1.5 h-1.5 rotate-45 bg-[#c9a769]" />
                <span className="w-8 h-px bg-[#c9a769]" />
              </div>
              <p className="text-[#8a7360] text-sm">What are we wearing today?</p>
            </div>

            <div className="flex items-center justify-center md:justify-end">
              <button
  onClick={() => setIsProfileOpen(true)}
  aria-label="Profile"
  className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#e6d5b8] hover:bg-[#f3e6cf] text-[#3d2417] transition"
>
  <User className="w-4 h-4" />
</button>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.route)}
                className="group flex items-center gap-3 bg-white border border-[#e6d5b8] rounded-2xl p-4 text-left shadow-sm hover:shadow-md hover:border-[#7a2331]/40 hover:-translate-y-0.5 transition-all"
              >
                <div className="w-10 h-10 shrink-0 rounded-xl bg-[#f3e6cf] flex items-center justify-center group-hover:bg-[#7a2331] transition-colors">
                  <action.icon className="w-4.5 h-4.5 text-[#7a2331] group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#3d2417] truncate">{action.title}</p>
                  <p className="text-xs text-[#8a7360] truncate">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* CLOSET CARD — same border/shadow/radius treatment as the other screens */}
          <div className="bg-[#FCF6EC] rounded-3xl border border-[#e6d5b8] shadow-[0_8px_30px_rgba(61,36,23,0.08)] p-4 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2 text-[#6b5645] text-sm">
                <Shirt className="w-4 h-4 text-[#7a2331]" />
                <span>{filteredItems.length} pieces in your almari</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setOpenFilterDropdown((c) => (c === 'colors' ? null : 'colors'))}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#e6d5b8] bg-white text-[#6b5645] hover:border-[#7a2331] hover:text-[#7a2331] transition"
                  >
                    Colors <span className="text-[10px]">▾</span>
                  </button>
                  {openFilterDropdown === 'colors' && (
                    <div className="absolute right-0 mt-2 w-40 max-h-64 overflow-y-auto bg-white border border-[#e6d5b8] rounded-xl shadow-lg p-1.5 z-20">
                      <button
                        onClick={() => { setActiveColor('all'); setOpenFilterDropdown(null); }}
                        className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs capitalize ${activeColor === 'all' ? 'bg-[#f3e6cf] text-[#7a2331]' : 'text-[#3d2417] hover:bg-[#f3e6cf]'}`}
                      >
                        All colors
                      </button>
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          onClick={() => { setActiveColor(color); setOpenFilterDropdown(null); }}
                          className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs capitalize ${normalize(activeColor) === normalize(color) ? 'bg-[#f3e6cf] text-[#7a2331]' : 'text-[#3d2417] hover:bg-[#f3e6cf]'}`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setOpenFilterDropdown((c) => (c === 'seasons' ? null : 'seasons'))}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#e6d5b8] bg-white text-[#6b5645] hover:border-[#7a2331] hover:text-[#7a2331] transition"
                  >
                    Seasons <span className="text-[10px]">▾</span>
                  </button>
                  {openFilterDropdown === 'seasons' && (
                    <div className="absolute right-0 mt-2 w-36 bg-white border border-[#e6d5b8] rounded-xl shadow-lg p-1.5 z-20">
                      <button
                        onClick={() => { setActiveSeason('all'); setOpenFilterDropdown(null); }}
                        className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs capitalize ${activeSeason === 'all' ? 'bg-[#f3e6cf] text-[#7a2331]' : 'text-[#3d2417] hover:bg-[#f3e6cf]'}`}
                      >
                        All seasons
                      </button>
                      {SEASON_OPTIONS.map((season) => (
                        <button
                          key={season}
                          onClick={() => { setActiveSeason(season); setOpenFilterDropdown(null); }}
                          className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs capitalize ${activeSeason === season ? 'bg-[#f3e6cf] text-[#7a2331]' : 'text-[#3d2417] hover:bg-[#f3e6cf]'}`}
                        >
                          {season}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CATEGORY TABS */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {CATEGORY_TABS.map((category) => {
                const isActive = activeCategory === category.key;
                const count = categoryCounts[category.key] ?? 0;
                return (
                  <button
                    key={category.key}
                    onClick={() => setActiveCategory(category.key)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                      isActive ? 'bg-[#7a2331] text-white shadow-sm' : 'bg-white border border-[#e6d5b8] text-[#8a7360] hover:border-[#7a2331] hover:text-[#7a2331]'
                    }`}
                  >
                    {category.label}
                    <span className={isActive ? 'text-white/70' : 'text-[#a89478]'}>{count}</span>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} />
                  {error}
                </div>
                <button onClick={fetchCatalogue} className="font-semibold underline">Retry</button>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-white/60 border border-[#e6d5b8] animate-pulse" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 border border-dashed border-[#e6d5b8] rounded-xl">
                <Shirt size={42} strokeWidth={1.2} className="text-[#a89478] mb-3" />
                <h3 className="font-display text-lg font-bold text-[#3d2417] mb-1">No pieces found</h3>
                <p className="text-sm text-[#8a7360] mb-5">Try another category or upload a new item.</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="rounded-xl bg-[#7a2331] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#631b28]"
                >
                  Add New Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -3 }}
                    onClick={() => handleItemClick(item)}
                    className="relative aspect-square rounded-xl bg-white border border-[#e6d5b8] overflow-hidden cursor-pointer hover:border-[#7a2331] transition-all"
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt={getDisplayName(item)} className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Shirt size={32} strokeWidth={1.2} className="text-[#a89478]" />
                      </div>
                    )}

                    <button
                      onClick={(e) => handleToggleFavorite(e, item)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-[#a89478] hover:text-[#7a2331] transition shadow-sm"
                    >
                      <Heart className={`w-3.5 h-3.5 ${item.is_favorite ? 'fill-[#7a2331] text-[#7a2331]' : ''}`} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* RECENTLY ADDED */}
          {recentItems.length > 0 && (
            <div className="mt-6 bg-[#FCF6EC] rounded-3xl border border-[#e6d5b8] shadow-[0_8px_30px_rgba(61,36,23,0.08)] p-4 md:p-6">
              <p className="text-sm font-semibold text-[#3d2417] mb-4">Recently Added</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {recentItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="aspect-square rounded-xl bg-white border border-[#e6d5b8] cursor-pointer hover:border-[#7a2331] transition flex items-center justify-center"
                  >
                    {item.image_url ? (
                      <img src={item.image_url} alt={getDisplayName(item)} className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <Shirt size={32} strokeWidth={1.2} className="text-[#a89478]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* AI STYLIST FAB — same as VisualizeScreen */}
      <button
        onClick={() => navigate('/chatbot')}
        title="AI Stylist"
        className="fixed bottom-6 right-6 z-30 flex flex-col items-center justify-center w-20 h-20 rounded-full bg-[#7a2331] hover:bg-[#631b28] text-white shadow-lg transition"
      >
        <Sparkles className="w-5 h-5 mb-0.5" />
        <span className="text-[9px] font-semibold">AI Stylist</span>
      </button>

      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onDeleted={(deletedId) => {
          setItems((currentItems) => currentItems.filter((item) => item.id !== deletedId));
          setSelectedItem(null);
        }}
        onUpdated={(updatedId, changes) => {
          setItems((currentItems) =>
            currentItems.map((item) => (item.id === updatedId ? { ...item, ...changes } : item))
          );
          setSelectedItem((currentItem) =>
            currentItem?.id === updatedId ? { ...currentItem, ...changes } : currentItem
          );
        }}
      />

      <ProfileDrawer isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}
