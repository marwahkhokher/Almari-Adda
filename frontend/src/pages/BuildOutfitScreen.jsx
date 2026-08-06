import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Wand2,
  Palette,
  CalendarDays,
  Shirt,
  CloudUpload,
  Heart,
  Home,
  Menu,
  Sparkles,
  User,
} from 'lucide-react';

import { buildOutfit } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Sidebar from '../components/Sidebar2.jsx';

const COLORS = [
  'black', 'white', 'dark gray', 'gray', 'light gray',
  'beige', 'tan', 'brown', 'dark brown',
  'pink', 'dark red', 'red', 'orange', 'yellow',
  'dark green', 'green', 'teal', 'cyan',
  'navy blue', 'blue', 'purple', 'magenta',
];
const SEASONS = ['spring', 'summer', 'fall', 'winter', 'all seasons'];
const FORMALITY = ['casual', 'semi-formal', 'formal'];

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.4, ease: 'easeOut' },
  }),
};

/* Same little hanger mark used in the dashboard's sidebar nav —
   duplicated here since it's tiny; if it ends up in a third
   place, move it into its own shared file instead. */
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

/* Matches DashboardScreen's NAV_ITEMS. "Build Outfit" points at
   /build-outfit — that's the route your router actually
   registers this screen under. */
const NAV_ITEMS = [
  { label: 'Closet', icon: Home, action: 'closet' },
  { label: 'Visualizer', icon: Sparkles, route: '/visualize' },
  { label: 'Upload Item', icon: CloudUpload, route: '/upload' },
  { label: 'Build Outfit', icon: Hanger, route: '/build-outfit' },
  { label: 'Stylist AI', icon: Wand2, route: '/chatbot' },
];

function ChipGroup({ options, selected, onToggle, label, icon: Icon, index }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      className="rounded-2xl border border-[#e6d9c8] bg-[#fffaf3] shadow-[0_6px_22px_rgba(83,54,34,0.06)] p-6 mb-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#f2e5d8] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#8d3d3d]" />
        </div>
        <p className="text-xs font-semibold text-[#75655a] uppercase tracking-wider font-sans">
          {label}
        </p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {options.map((opt) => (
          <motion.button
            key={opt}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => onToggle(opt)}
            className={`px-4 py-2 rounded-full text-xs font-medium capitalize border transition-colors font-sans ${
              selected.includes(opt)
                ? 'bg-[#8d3d3d] border-[#8d3d3d] text-white shadow-sm'
                : 'bg-white border-[#e6d9c8] text-[#514036] hover:border-[#c9a876]'
            }`}
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default function BuildOutfitScreen() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [colors, setColors] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [formality, setFormality] = useState([]);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [hasAlternatives, setHasAlternatives] = useState(false);
  const [shownKeys, setShownKeys] = useState([]);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const firstName =
    user?.user_metadata?.first_name ||
    user?.email?.split('@')?.[0] ||
    'Maya';

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

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

    if (navItem.route) {
      navigate(navItem.route);
      return;
    }

    if (navItem.action === 'closet' || navItem.action === 'favorites') {
      navigate('/dashboard');
    }
  };

  /* ============================================================
     EVERYTHING BELOW IS UNCHANGED FROM THE ORIGINAL SCREEN —
     same buildOutfit calls, same exclude/regenerate logic.
     ============================================================ */

  const toggle = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const runGenerate = async (excludeList) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await buildOutfit({ colors, seasons, formality, exclude: excludeList });
      setResult(response.outfit);
      setMessage(response.message);
      setHasAlternatives(response.has_alternatives);
      setShownKeys((prev) => [...prev, response.outfit_key]);
    } catch (err) {
      setError(err.message || 'Could not build an outfit with those preferences');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    setResult(null);
    setMessage(null);
    setShownKeys([]);
    runGenerate([]);
  };

  const handleRegenerate = () => {
    runGenerate(shownKeys);
  };

  return (
    <div className="min-h-screen bg-[#f7f0e7] text-[#38271f]">
      {/* =====================================================
          MOBILE TOP BAR — identical to the dashboard's
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
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
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
          DESKTOP SIDEBAR — same component, same positions
      ====================================================== */}

      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[260px] lg:block">
        <Sidebar
          navItems={NAV_ITEMS}
          onNavigate={handleNavItem}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* =====================================================
          BACKGROUND — pinned to the viewport with `fixed`, not
          `absolute`. An absolute image inside a container whose
          height changes with content (min-h-screen + growing
          content) gets its object-cover crop recalculated every
          time that height changes, which looked like "zooming."
          `fixed` sizes against the viewport only, so it never
          moves regardless of how tall the page content gets.
      ====================================================== */}

      <img
        src="/bg.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-screen w-screen object-cover lg:left-[260px] lg:w-[calc(100vw-260px)]"
      />

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="relative z-10 min-h-screen pt-16 lg:ml-[260px] lg:pt-0">
        {/*
          Pulled the container width and padding back down —
          max-w-6xl plus pt-24/mb-20 was wider and taller than
          the frame in your background art, which is what was
          overflowing past its edges. This sits inside it cleanly.
        */}
        <div className="mx-auto max-w-5xl px-6 pb-14 pt-36 lg:pb-16 lg:pt-32">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-8"
          >
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-[#33231c] mb-2">
              Design your look
            </h1>
            <p className="text-sm text-[#75655a] font-sans">
              Pick what you&rsquo;re feeling, and we&rsquo;ll pull it from your closet.
            </p>
          </motion.div>

          <ChipGroup index={0} icon={Palette} options={COLORS} selected={colors} onToggle={(v) => toggle(colors, setColors, v)} label="Colors" />
          <ChipGroup index={1} icon={CalendarDays} options={SEASONS} selected={seasons} onToggle={(v) => toggle(seasons, setSeasons, v)} label="Season" />
          <ChipGroup index={2} icon={Shirt} options={FORMALITY} selected={formality} onToggle={(v) => toggle(formality, setFormality, v)} label="Style" />

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold font-sans bg-[#8d3d3d] hover:bg-[#6f2f2f] text-white transition-colors disabled:opacity-50 shadow-[0_6px_22px_rgba(83,54,34,0.15)]"
            >
              <Wand2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Building outfit...' : 'Generate outfit'}
            </motion.button>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-sm text-red-600 text-center font-sans"
              >
                {error}
              </motion.p>
            )}

            {message && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-sm text-[#8a5c3c] text-center bg-[#f2e5d8]/70 rounded-lg py-2 px-3 font-sans"
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={result.type === 'top_bottom' ? `${result.top.id}-${result.bottom.id}` : result.item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="mt-10"
              >
                {result.type === 'top_bottom' ? (
                  <div className="grid grid-cols-2 gap-5">
                    {[result.top, result.bottom].map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.12, duration: 0.35, ease: 'easeOut' }}
                        whileHover={{ y: -6 }}
                        className="border border-[#e6d9c8] rounded-2xl p-4 bg-white shadow-[0_6px_22px_rgba(83,54,34,0.06)]"
                      >
                        <img src={item.image_url} alt={item.subcategory} className="w-full aspect-square object-contain" />
                        <p className="text-xs text-center mt-3 capitalize text-[#75655a] font-sans">{item.subcategory}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    whileHover={{ y: -6 }}
                    className="max-w-[240px] mx-auto border border-[#e6d9c8] rounded-2xl p-4 bg-white shadow-[0_6px_22px_rgba(83,54,34,0.06)]"
                  >
                    <img src={result.item.image_url} alt={result.item.subcategory} className="w-full aspect-square object-contain" />
                    <p className="text-xs text-center mt-3 capitalize text-[#75655a] font-sans">{result.item.subcategory}</p>
                  </motion.div>
                )}

                {hasAlternatives && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold font-sans border border-[#8d3d3d] text-[#8d3d3d] hover:bg-[#f2e5d8] transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Finding another...' : 'Show me another'}
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
