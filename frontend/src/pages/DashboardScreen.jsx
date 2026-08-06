import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import {
  AlertTriangle,
  Bell,
  Camera,
  ChevronDown,
  ChevronRight,
  CloudUpload,
  Grid2X2,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Shirt,
  Sparkles,
  User,
  Wand2,
  X,
  ShoppingBag,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext.jsx';
import {
  getCatalogue,
  toggleFavorite,
} from '../lib/api.js';

import { playWhoosh } from '../lib/soundEffects.js';
import ItemDetailModal from '../components/ItemDetailModal.jsx';
import ProfileDrawer from './ProfileScreen.jsx';
import Sidebar from '../components/Sidebar.jsx';


function Hanger() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 5.5C12 3.8 13.3 2.5 15 2.5C16.7 2.5 18 3.8 18 5.5C18 7.2 16.5 8 15.5 8.8L12 11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M12 11L3 17.5C2.4 18 2.8 19 3.6 19H20.4C21.2 19 21.6 18 21 17.5L12 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const NAV_ITEMS = [
  {
    label: 'Closet',
    icon: Home,
    action: 'closet',
  },
  {
    label: 'Visualizer',
    icon: Sparkles,
    route: '/visualize',
  },
  {
    label: 'Upload Item',
    icon: CloudUpload,
    route: '/upload',
  },
  {
    label: 'Build Outfit',
    icon: Hanger,
    route: '/build-outfit',
  },
  {
    label: 'Stylist AI',
    icon: Wand2,
    route: '/chatbot',
  },
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

/* =========================================================
   HELPERS
========================================================= */

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getItemCategory(item) {
  const category = normalize(item?.category);
  const subcategory = normalize(item?.subcategory);
  const combined = `${category} ${subcategory}`;

  if (
    combined.includes('shalwar') ||
    combined.includes('kameez') ||
    combined.includes('kurta') ||
    combined.includes('kurti') ||
    combined.includes('eastern') ||
    combined.includes('lehenga') ||
    combined.includes('saree')
  ) {
    return 'eastern';
  }

  if (
    combined.includes('dress') ||
    combined.includes('gown') ||
    combined.includes('jumpsuit')
  ) {
    return 'dresses';
  }

  if (
    combined.includes('jean') ||
    combined.includes('trouser') ||
    combined.includes('pant') ||
    combined.includes('skirt') ||
    combined.includes('short') ||
    combined.includes('bottom')
  ) {
    return 'bottoms';
  }

  if (
    combined.includes('coat') ||
    combined.includes('jacket') ||
    combined.includes('blazer') ||
    combined.includes('cardigan') ||
    combined.includes('outerwear')
  ) {
    return 'outerwear';
  }

  if (
    combined.includes('shirt') ||
    combined.includes('blouse') ||
    combined.includes('sweater') ||
    combined.includes('hoodie') ||
    combined.includes('top') ||
    combined.includes('t-shirt')
  ) {
    return 'tops';
  }

  return 'other';
}

function getDisplayName(item) {
  return (
    item?.name ||
    item?.subcategory ||
    item?.category ||
    'Closet item'
  );
}

/* =========================================================
   SMALL UI COMPONENTS
========================================================= */

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] =
    useState(false);

  // Horizontal scroller for the closet shelf — this replaces
  // the old vertically-growing grid. Everything that doesn't
  // fit in one row is reached with the arrow button, not by
  // scrolling the page.
  const closetScrollRef = useRef(null);
  const desktopClosetScrollRef = useRef(null);
  const bgImageRef = useRef(null);

  const firstName =
    user?.user_metadata?.first_name ||
    user?.email?.split('@')?.[0] ||
    'Maya';

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

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

      setItems(
        Array.isArray(catalogueItems)
          ? catalogueItems
          : []
      );
    } catch (fetchError) {
      console.error('Catalogue error:', fetchError);

      setError(
        fetchError?.message ||
          'We could not load your closet.'
      );
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

  // DEV-ONLY: click anywhere on the page to log that spot's
  // position as a percentage of the background image, so we
  // can pin new elements to exact spots on the artwork.
  useEffect(() => {
    const handleCoordinateClick = (event) => {
      const bgImage = bgImageRef.current;
      if (!bgImage) return;

      const rect = bgImage.getBoundingClientRect();
      const leftPercent = ((event.clientX - rect.left) / rect.width) * 100;
      const topPercent = ((event.clientY - rect.top) / rect.height) * 100;

      console.log(
        `[coord] left: ${leftPercent.toFixed(1)}%, top: ${topPercent.toFixed(1)}%`
      );
    };

    document.addEventListener('click', handleCoordinateClick);
    return () => document.removeEventListener('click', handleCoordinateClick);
  }, []);

  const handleItemClick = (item) => {
    playWhoosh?.();
    setSelectedItem(item);
  };

  const handleToggleFavorite = async (
    event,
    item
  ) => {
    event.stopPropagation();

    const newFavoriteValue = !item.is_favorite;

    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === item.id
          ? {
              ...currentItem,
              is_favorite: newFavoriteValue,
            }
          : currentItem
      )
    );

    try {
      await toggleFavorite(
        item.id,
        newFavoriteValue
      );
    } catch (favoriteError) {
      console.error(
        'Failed to update favorite:',
        favoriteError
      );

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                is_favorite: !newFavoriteValue,
              }
            : currentItem
        )
      );
    }
  };

  const colorOptions = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item?.color).filter(Boolean))
      ),
    [items]
  );

  // Item count per category tab — computed off the full,
  // unfiltered list so the numbers stay stable regardless of
  // which tab/color/season is currently selected.
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
    const query = normalize(searchQuery);

    return items.filter((item) => {
      const category = getItemCategory(item);

      const matchesCategory =
        activeCategory === 'all' || category === activeCategory;

      const matchesColor =
        activeColor === 'all' ||
        normalize(item?.color) === normalize(activeColor);

      const itemSeasons = (item?.season || []).map((s) => normalize(s));
      const matchesSeason =
        activeSeason === 'all' ||
        itemSeasons.includes(normalize(activeSeason)) ||
        itemSeasons.includes('all seasons');

      const searchableText = normalize(
        [
          item?.name,
          item?.category,
          item?.subcategory,
          item?.color,
          item?.brand,
          item?.occasion,
        ]
          .filter(Boolean)
          .join(' ')
      );

      const matchesSearch = !query || searchableText.includes(query);

      return (
        matchesCategory &&
        matchesColor &&
        matchesSeason &&
        matchesSearch
      );
    });
  }, [items, activeCategory, activeColor, activeSeason, searchQuery]);

  const favoriteItems = useMemo(
    () => items.filter((item) => item.is_favorite),
    [items]
  );

  const recentItems = useMemo(
    () => items.slice(0, 8),
    [items]
  );

  const handleNavItem = (navItem) => {
    setIsMobileSidebarOpen(false);

    if (navItem.route) {
  console.log("Going to:", navItem.route);

  navigate(navItem.route);

  setTimeout(() => {
    console.log("Current URL:", window.location.pathname);
  }, 100);

  return;
}

    if (navItem.action === 'favorites') {
      const favoriteSection =
        document.getElementById('favorites-section');

      favoriteSection?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }

    if (navItem.action === 'closet') {
      setActiveCategory('all');

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  const scrollClosetRight = () => {
    closetScrollRef.current?.scrollBy({
      left: 440,
      behavior: 'smooth',
    });
  };

  const scrollDesktopClosetRight = () => {
    desktopClosetScrollRef.current?.scrollBy({
      left: 440,
      behavior: 'smooth',
    });
  };

  return (
  <div className="min-h-screen bg-[#f7f0e7] text-[#38271f]">
    {/* =====================================================
        MOBILE TOP BAR
    ====================================================== */}

    <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#dfd2c2] bg-[#f9f4ec]/95 px-4 backdrop-blur lg:hidden">
      <button
        type="button"
        onClick={() => setIsMobileSidebarOpen(true)}
        className="rounded-full p-2 text-[#4a2c1d]"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      <div className="font-serif text-lg font-semibold tracking-[0.14em] text-[#6a452a]">
        ALMARI ADDA
      </div>

      <button
        type="button"
        onClick={() => setIsProfileOpen(true)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#d6c5b4] bg-white"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={firstName}
            className="h-full w-full object-cover"
          />
        ) : (
          <User size={17} />
        )}
      </button>
    </div>

    {/* =====================================================
        MOBILE SIDEBAR
    ====================================================== */}

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
            transition={{
              type: 'spring',
              damping: 28,
              stiffness: 260,
            }}
            className="fixed bottom-0 left-0 top-0 z-[80] w-[260px] max-w-[88vw] lg:hidden"
          >
            <Sidebar
              navItems={NAV_ITEMS}
              onNavigate={handleNavItem}
              onSignOut={handleSignOut}
              onClose={() => setIsMobileSidebarOpen(false)}
              mobile
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* =====================================================
        DESKTOP SIDEBAR
    ====================================================== */}

    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[260px] lg:block">
      <Sidebar
        navItems={NAV_ITEMS}
        onNavigate={handleNavItem}
        onSignOut={handleSignOut}
      />
    </aside>

    {/* =====================================================
        MAIN BACKGROUND
    ====================================================== */}

    <main className="min-h-screen pt-16 lg:ml-[260px] lg:pt-0">
      <div className="relative min-h-screen overflow-hidden">
        {/* Generated background template */}
        <img
          ref={bgImageRef}
          src="/dashboard-background.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed bottom-0 right-0 top-0 z-0 hidden h-screen w-[calc(100%-260px)] select-none object-fill lg:block"
          style={{
            width: 'calc(100vw - 260px)',
          }}
          draggable={false}
        />

        {/* Mobile background */}
        <div className="fixed inset-0 z-0 bg-[#f8f0e6] lg:hidden" />

        {/* All real content goes above the image */}
       <div className="relative z-10 mx-auto min-h-screen max-w-[1600px] px-5 pb-12 pt-5 sm:px-8 lg:px-10 xl:px-14">

          {/* =================================================
              WELCOME AND ACTIONS
          ================================================== */}

          <section className="-mt-1 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="font-serif text-[28px] font-semibold leading-none text-[#33231c] sm:text-[34px]">
                Welcome back,{' '}
                <span className="text-[#7d3f3d]">
                  {firstName}
                </span>
              </h1>
            </div>
          </section>

          {/* =================================================
              MAIN CLOSET CONTENT AREA
              (sits directly on the drawn card in the
              background artwork — pulled up close to the
              quick-actions row above, no large vertical gap)
          ================================================== */}

          <section className="mt-8 px-1 sm:px-4 lg:px-8 lg:min-h-[69vh] lg:pointer-events-none">
            {/* Heading and controls */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:pointer-events-auto" />

            {/* Categories (mobile) */}
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2 lg:hidden">
              {CATEGORY_TABS.map((category) => {
                const isActive =
                  activeCategory === category.key;

                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() =>
                      setActiveCategory(category.key)
                    }
                    className={`
                      relative min-w-[126px] rounded-[12px]
                      border px-5 py-3 font-sans text-sm font-semibold
                      transition
                      ${
                        isActive
                          ? 'border-[#783b38] bg-[#8d3d3d] text-white shadow-[0_5px_14px_rgba(103,49,45,0.18)]'
                          : 'border-[#ddcfc0] bg-[#fffaf3]/75 text-[#514036] hover:border-[#9c7154] hover:bg-white/90'
                      }
                    `}
                  >
                    {category.label}

                    <span
                      className={`
                        absolute -bottom-[7px] left-1/2 h-3 w-3
                        -translate-x-1/2 rotate-45 rounded-full
                        border
                        ${
                          isActive
                            ? 'border-[#69402b] bg-[#b18b53]'
                            : 'border-[#a98762] bg-[#cfaf78]'
                        }
                      `}
                    />
                  </button>
                );
              })}
            </div>

            {/* Error */}
            {error && (
              <div className="mt-5 flex items-center justify-between rounded-xl border border-[#d9aaa3] bg-[#fff2ee]/90 px-4 py-3 font-sans text-sm text-[#93463f] lg:pointer-events-auto">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} />
                  {error}
                </div>

                <button
                  type="button"
                  onClick={fetchCatalogue}
                  className="font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoading &&
              !error &&
              filteredItems.length === 0 && (
                <div className="mt-8 rounded-2xl border border-dashed border-[#cdb9a4] bg-[#fffaf2]/60 px-6 py-16 text-center backdrop-blur lg:pointer-events-auto">
                  <Shirt
                    size={42}
                    strokeWidth={1.2}
                    className="mx-auto text-[#9c7d65]"
                  />

                  <h3 className="mt-4 font-serif text-2xl font-semibold">
                    No pieces found
                  </h3>

                  <p className="mt-2 font-sans text-sm text-[#7d6d62]">
                    Try another category or upload a new
                    item.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate('/upload')}
                    className="mt-5 rounded-xl bg-[#82403e] px-5 py-2.5 font-sans text-sm font-semibold text-white transition hover:bg-[#693230]"
                  >
                    Add New Item
                  </button>
                </div>
              )}
          </section>

                    {/* =================================================
              LOWER SECTION — hidden on desktop for now, since
              it's duplicating the same first items as the main
              shelf. Still shows on mobile.
          ================================================== */}

          <section
            id="favorites-section"
            className="mt-10 px-8 py-6 lg:hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
              <div className="flex flex-wrap items-center gap-7">
                <button
                  type="button"
                  className="flex items-center gap-2 font-serif text-[17px] font-semibold text-[#853f3c]"
                >
                  <Hanger />
                  Recent Looks
                </button>

                <button
                  type="button"
                  className="flex items-center gap-2 font-serif text-[17px] font-semibold text-[#625047]"
                >
                  <Heart size={19} />
                  Favourites
                </button>

                <button
                  type="button"
                  className="flex items-center gap-2 font-serif text-[17px] font-semibold text-[#625047]"
                >
                  <Wand2 size={18} />
                  Style Notes
                </button>
              </div>

              <button
                type="button"
                className="font-sans text-sm font-medium text-[#665347]"
              >
                View all →
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {recentItems.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className="flex h-[160px] items-center justify-center p-4 transition hover:-translate-y-1"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={getDisplayName(item)}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Shirt
                      size={42}
                      strokeWidth={1.2}
                      className="text-[#a5846c]"
                    />
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* =================================================
            DESKTOP-ONLY OVERLAYS
            Deliberately placed AFTER the content div above,
            not before it — later in the DOM wins paint order
            when z-index ties, which is what makes these
            actually receive clicks/scroll instead of the
            (mostly transparent) content div swallowing them.
        ================================================== */}

        {/* Desktop category tabs, pinned to the background artwork's card */}
        <div
          className="pointer-events-none fixed top-0 right-0 bottom-0 z-30 hidden lg:block"
          style={{ width: 'calc(100vw - 260px)' }}
        >
          <p
           className="pointer-events-none absolute font-serif italic font-semibold text-[#f0d9a8] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
            style={{ top: '12.5%', right: '43%', fontSize: '35px' }}
          >
            {firstName}&rsquo;s Almari
          </p>
          <p
            className="pointer-events-none absolute font-serif font-bold text-[#8a3f3c]"
            style={{ right: '12%', top: '16%', fontSize: '20px' }}
          >
            {filteredItems.length}{' '}
            {filteredItems.length === 1 ? 'piece' : 'pieces'}
          </p>

          <div className="pointer-events-auto absolute flex items-center" style={{ top: '20px', right: '100px' }}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              aria-label="Profile"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#d5bda5] bg-[#dbc3aa] shadow-sm transition hover:bg-[#d3b89c]"
            >
              <User size={20} className="text-[#4d382d]" />
            </button>
          </div>

          {/*
            ===============================================
            CATEGORY TABS — redesigned as soft pill buttons
            with a per-category item count, instead of the
            old flat underlined text. Active pill is filled
            maroon; inactive pills are a quiet ghost/outline
            that fills in softly on hover. Kept intentionally
            simple: no icons, no extra ornamentation, just
            clearer buttons and a bit of useful information
            (the count) that wasn't there before.
            ===============================================
          */}
          <div
            className="pointer-events-auto absolute flex items-center rounded-2xl border border-[#d9cabb] bg-[#fffaf3]/85 shadow-[0_6px_18px_rgba(83,54,34,0.08)] backdrop-blur-sm"
            style={{ left: '11.1%', top: '20.5%', width: '77.3%' }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-3 py-2.5">
              {CATEGORY_TABS.map((category) => {
                const isActive = activeCategory === category.key;
                const count = categoryCounts[category.key] ?? 0;

                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => setActiveCategory(category.key)}
                    className={`
                      flex shrink-0 items-center gap-1.5 whitespace-nowrap
                      rounded-full px-4 py-2 font-sans text-xs font-semibold
                      transition-all
                      ${
                        isActive
                          ? 'bg-[#8d3d3d] text-white shadow-[0_4px_12px_rgba(141,61,61,0.3)]'
                          : 'text-[#7d6d62] hover:bg-[#f2e5d8] hover:text-[#5c4632]'
                      }
                    `}
                  >
                    {category.label}
                    <span
                      className={`
                        text-[10px] font-normal
                        ${isActive ? 'text-white/70' : 'text-[#a89383]'}
                      `}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-4 border-l border-[#e6d9c8] px-4 py-2.5">
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenFilterDropdown((current) =>
                      current === 'colors' ? null : 'colors'
                    )
                  }
                  className="flex items-center gap-1 font-sans text-xs font-medium text-[#624d40] hover:text-[#8d3d3d]"
                >
                  Colors
                  <span className="text-[10px]">▾</span>
                </button>

                {openFilterDropdown === 'colors' && (
                  <div className="absolute right-0 top-full z-30 mt-2 max-h-64 w-40 overflow-y-auto rounded-lg border border-[#ddcfc0] bg-white p-1.5 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveColor('all');
                        setOpenFilterDropdown(null);
                      }}
                      className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs capitalize ${
                        activeColor === 'all'
                          ? 'bg-[#f2e5d8] text-[#8d3d3d]'
                          : 'text-[#514036] hover:bg-[#f7f0e7]'
                      }`}
                    >
                      All colors
                    </button>

                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setActiveColor(color);
                          setOpenFilterDropdown(null);
                        }}
                        className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs capitalize ${
                          normalize(activeColor) === normalize(color)
                            ? 'bg-[#f2e5d8] text-[#8d3d3d]'
                            : 'text-[#514036] hover:bg-[#f7f0e7]'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenFilterDropdown((current) =>
                      current === 'seasons' ? null : 'seasons'
                    )
                  }
                  className="flex items-center gap-1 font-sans text-xs font-medium text-[#624d40] hover:text-[#8d3d3d]"
                >
                  Seasons
                  <span className="text-[10px]">▾</span>
                </button>

                {openFilterDropdown === 'seasons' && (
                  <div className="absolute right-0 top-full z-30 mt-2 max-h-64 w-36 overflow-y-auto rounded-lg border border-[#ddcfc0] bg-white p-1.5 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSeason('all');
                        setOpenFilterDropdown(null);
                      }}
                      className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs capitalize ${
                        activeSeason === 'all'
                          ? 'bg-[#f2e5d8] text-[#8d3d3d]'
                          : 'text-[#514036] hover:bg-[#f7f0e7]'
                      }`}
                    >
                      All seasons
                    </button>

                    {SEASON_OPTIONS.map((season) => (
                      <button
                        key={season}
                        type="button"
                        onClick={() => {
                          setActiveSeason(season);
                          setOpenFilterDropdown(null);
                        }}
                        className={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs capitalize ${
                          activeSeason === season
                            ? 'bg-[#f2e5d8] text-[#8d3d3d]'
                            : 'text-[#514036] hover:bg-[#f7f0e7]'
                        }`}
                      >
                        {season}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop clothing shelf, two rows, pinned to the background artwork's card */}
        <div
          className="pointer-events-none fixed top-0 right-0 bottom-0 z-10 hidden lg:block"
          style={{ width: 'calc(100vw - 260px)' }}
        >
          <div
            className="pointer-events-auto absolute"
            style={{ left: '10%', top: '28%', width: '78%', height: '41%' }}
          >
            <div
              ref={desktopClosetScrollRef}
              className="
                grid h-full grid-flow-col grid-rows-2 auto-cols-[150px]
                gap-4 overflow-x-auto scroll-smooth
                [-ms-overflow-style:none] [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
              "
            >
              {isLoading
                ? Array.from({ length: 12 }).map((_, index) => (
                    <div
                      key={index}
                      className="aspect-[0.82] w-[150px] animate-pulse rounded-2xl border border-[#ddd0c2] bg-white/50"
                    />
                  ))
                : filteredItems.map((item) => (
                    <motion.article
                      key={item.id}
                      whileHover={{ y: -5 }}
                      onClick={() => handleItemClick(item)}
                      style={{ pointerEvents: 'auto' }}
                      className="group relative flex aspect-[0.82] w-[150px] cursor-pointer items-center justify-center rounded-2xl border border-[#e6d9c8] bg-white/40 p-4 shadow-[0_4px_10px_rgba(70,45,30,0.08)] transition-shadow hover:bg-white/70 hover:shadow-[0_8px_18px_rgba(70,45,30,0.16)]"
                    >

                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={getDisplayName(item)}
                          className="h-full w-full object-contain drop-shadow-[0_8px_8px_rgba(70,45,30,0.13)] transition duration-300 group-hover:scale-[1.035]"
                        />
                      ) : (
                        <Shirt
                          size={50}
                          strokeWidth={1.2}
                          className="text-[#a5846c]"
                        />
                      )}
                    </motion.article>
                  ))}
            </div>

            {!isLoading && filteredItems.length > 0 && (
              <button
                type="button"
                onClick={scrollDesktopClosetRight}
                aria-label="Show more pieces"
                className="
                  pointer-events-auto absolute -right-8 top-1/2 z-20 flex h-11 w-11
                  -translate-y-1/2 items-center justify-center
                  rounded-full border border-[#d9c6b1]
                  bg-[#fffaf3]/95 text-[#6b4a34]
                  shadow-[0_7px_18px_rgba(70,45,25,.18)]
                  backdrop-blur transition hover:bg-white
                "
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
        
      </div>
    </main>

    {/* =====================================================
        MODALS
    ====================================================== */}

    <ItemDetailModal
      item={selectedItem}
      onClose={() => setSelectedItem(null)}
      onDeleted={(deletedId) => {
        setItems((currentItems) =>
          currentItems.filter(
            (item) => item.id !== deletedId
          )
        );

        setSelectedItem(null);
      }}
      onUpdated={(updatedId, changes) => {
        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === updatedId
              ? {
                  ...item,
                  ...changes,
                }
              : item
          )
        );

        setSelectedItem((currentItem) =>
          currentItem?.id === updatedId
            ? {
                ...currentItem,
                ...changes,
              }
            : currentItem
        );
      }}
    />

    <ProfileDrawer
      isOpen={isProfileOpen}
      onClose={() => setIsProfileOpen(false)}
    />
  </div>
  );
}
