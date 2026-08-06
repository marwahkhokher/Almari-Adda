import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Sparkles, Sparkle, ArrowLeft, Upload, Image as ImageIcon, X, WandSparkles,
  Heart, Search, Bell, Plus, RotateCcw, Maximize2, SlidersHorizontal,
  ArrowUpDown, LayoutGrid, List, ShoppingBag,
  CloudUpload, Home, Menu, User, Wand2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getCatalogue, visualizeOutfit, pollJob } from '../lib/api.js';
import Sidebar from '../components/Sidebar2.jsx';
import ProfileDrawer from './ProfileScreen.jsx';

const CLOTHING_TAXONOMY = {
  top: ['t-shirt', 'blouse', 'sweater', 'hoodie', 'shirt'],
  bottom: ['jeans', 'trousers', 'shorts', 'skirt'],
  dress: ['casual dress', 'formal dress'],
  'eastern wear': ['shalwar kameez', 'kurta'],
  outerwear: ['jacket', 'blazer', 'suit jacket', 'coat', 'cardigan'],
  shoes: ['heels', 'flats', 'sneakers', 'sandals', 'boots'],
  accessories: ['bag', 'handbag', 'jewelry', 'scarf', 'belt'],
};

const SUBCATEGORY_TO_CATEGORY = {};
Object.entries(CLOTHING_TAXONOMY).forEach(([category, subs]) => {
  subs.forEach(sub => { SUBCATEGORY_TO_CATEGORY[sub] = category; });
});

const parentCategories = [
  { key: 'all', label: 'All' },
  { key: 'top', label: 'Tops' },
  { key: 'bottom', label: 'Bottoms' },
  { key: 'dress', label: 'Dresses' },
  { key: 'eastern wear', label: 'Eastern Wear' },
  { key: 'outerwear', label: 'Outerwear' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'accessories', label: 'Accessories' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'name-asc', label: 'Name (A-Z)' },
  { key: 'name-desc', label: 'Name (Z-A)' },
];

/* Same little hanger mark used in the other screens' sidebar
   nav — duplicated here since it's tiny; if it ends up in a
   fifth place, move it into its own shared file instead. */
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

/* Matches the other screens' NAV_ITEMS. "Visualizer" points at
   /visualize — this screen. */
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

export default function VisualizeScreen() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [personPhotoFile, setPersonPhotoFile] = useState(null);
  const [personPhotoPreview, setPersonPhotoPreview] = useState(null);
  const [resultImageUrl, setResultImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  const [favorites, setFavorites] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navigate = useNavigate();
  const { gender: userGenderContext, user, signOut } = useAuth();
  const gender = (userGenderContext || user?.user_metadata?.gender || 'female').toLowerCase();

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

  useEffect(() => {
    const fetchCatalogue = async () => {
      setIsLoading(true);
      try {
        const response = await getCatalogue();
        const catalogueItems = response?.items || response?.data || response || [];
        setItems(Array.isArray(catalogueItems) ? catalogueItems : []);
      } catch (error) {
        console.error('Failed to load wardrobe for visualization', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalogue();
  }, []);

  const handlePhotoUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPersonPhotoFile(file);
    setPersonPhotoPreview(URL.createObjectURL(file));
    setResultImageUrl(null);
    setGenError(null);
  };

  const removePhoto = () => {
    if (personPhotoPreview) URL.revokeObjectURL(personPhotoPreview);
    setPersonPhotoFile(null);
    setPersonPhotoPreview(null);
    setResultImageUrl(null);
    setGenError(null);
  };

  const handleUndo = () => {
    if (resultImageUrl) {
      setResultImageUrl(null);
    } else if (personPhotoPreview) {
      removePhoto();
    }
  };

  const handleExpand = () => {
    const src = resultImageUrl || personPhotoPreview;
    if (src) window.open(src, '_blank');
  };

  const handleCategoryChange = category => {
    setActiveCategory(category);
    setActiveSubcategory('all');
  };

  const toggleItem = item => {
    setResultImageUrl(null);
    setGenError(null);

    const isDressType = item.category === 'dress' || item.category === 'eastern wear';

    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
      return;
    }

    if (isDressType) {
      setSelectedItems([item]);
    } else {
      const filtered = selectedItems.filter(i => {
        if (i.category === 'dress' || i.category === 'eastern wear') return false;
        if (i.category === item.category) return false;
        return true;
      });
      setSelectedItems([...filtered, item]);
    }
  };

  const toggleFavorite = id => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selectedItems.length === 0) return;
    setIsGenerating(true);
    setGenError(null);
    try {
      const itemIds = selectedItems.map(i => i.id);
      let response = await visualizeOutfit(itemIds, gender, personPhotoFile);
      console.log('visualizeOutfit response:', response);

      // The backend runs this as an async job — a first response with a
      // job_id and no image field yet means it's still processing, so poll
      // until it's actually done instead of treating this as the final result.
      const hasDirectUrl = response?.visualization_url || response?.image_url || response?.result_url || response?.output_url || response?.url;
      if (!hasDirectUrl && response?.job_id) {
        console.log('Job is async, polling for completion:', response.job_id);
        response = await pollJob(response.job_id);
        console.log('pollJob final response:', response);
      }

      const url =
        response?.visualization_url ||
        response?.image_url ||
        response?.result_url ||
        response?.output_url ||
        response?.url;
      if (!url) {
        throw new Error(
          'The job finished but no image URL was found in the response. Check the console log for the raw shape.'
        );
      }
      setResultImageUrl(url);
    } catch (error) {
      console.error('Visualization failed', error);
      setGenError(error.message || 'Failed to generate visualization');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredItems = items.filter(item => {
    const sub = item.subcategory?.toLowerCase() || '';
    const category = SUBCATEGORY_TO_CATEGORY[sub] || 'other';

    if (activeCategory !== 'all' && category !== activeCategory) return false;
    if (activeSubcategory !== 'all' && sub !== activeSubcategory) return false;
    if (searchQuery.trim() && !sub.includes(searchQuery.trim().toLowerCase())) return false;

    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name-asc') return (a.subcategory || '').localeCompare(b.subcategory || '');
    if (sortBy === 'name-desc') return (b.subcategory || '').localeCompare(a.subcategory || '');
    return 0;
  });

  const visibleItems = favoritesOnly ? sortedItems.filter(i => favorites.has(i.id)) : sortedItems;

  const availableSubcategories =
    activeCategory !== 'all' && CLOTHING_TAXONOMY[activeCategory]
      ? CLOTHING_TAXONOMY[activeCategory]
      : [];

  return (
    <div className="min-h-screen bg-[#FBF3E7]">
      {/* =====================================================
          MOBILE TOP BAR
      ====================================================== */}

      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#e6d5b8] bg-[#FBF3E7]/95 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="rounded-full p-2 text-[#3d2417]"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="font-serif text-lg font-semibold tracking-[0.14em] text-[#7a2331]">
          ALMARI ADDA
        </div>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#e6d5b8] bg-white"
        >
          <User size={17} />
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
          DESKTOP SIDEBAR — same component, same positions as
          your other screens
      ====================================================== */}

      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[260px] lg:block">
        <Sidebar
          navItems={NAV_ITEMS}
          onNavigate={handleNavItem}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="flex min-h-screen flex-col pt-16 lg:ml-[260px] lg:pt-0">

        {/* MAIN */}
        <main className="flex-1 px-4 md:px-10 pt-8 pb-5 max-w-[1440px] w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-8">
            <div className="hidden md:block" />

            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-[#3d2417]">
                Visualize <span className="text-[#7a2331]">Your Look</span>
              </h1>
              <div className="flex items-center justify-center gap-2 mt-2.5 mb-2">
                <span className="w-8 h-px bg-[#c9a769]" />
                <span className="w-1.5 h-1.5 rotate-45 bg-[#c9a769]" />
                <span className="w-8 h-px bg-[#c9a769]" />
              </div>
              <p className="text-[#8a7360] text-sm">See how your selected pieces come together.</p>
            </div>

            <div className="flex items-center justify-center md:justify-end gap-2">
  <button
    onClick={() => navigate('/build-outfit')}
    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#7a2331]/30 px-3 py-2 text-xs font-semibold text-[#7a2331] transition hover:bg-[#7a2331]/5"
  >
    <WandSparkles className="h-4 w-4" />
    Build an Outfit
  </button>

  <button
    onClick={() => navigate('/upload')}
    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#e6d5b8] px-3 py-2 text-xs font-semibold text-[#3d2417] transition hover:bg-[#f3e6cf]"
  >
    <Plus className="h-4 w-4" />
    Add New Item
  </button>

  <button
    type="button"
    onClick={() => setIsProfileOpen(true)}
    aria-label="Profile"
    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e6d5b8] text-[#3d2417] transition hover:bg-[#f3e6cf]"
  >
    <User className="h-4 w-4" />
  </button>
</div>
          </div>

          <div className="bg-[#FCF6EC] rounded-3xl border border-[#e6d5b8] shadow-[0_8px_30px_rgba(61,36,23,0.08)] p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {/* LEFT: photo / result panel */}
              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="aspect-[3/4] bg-white rounded-2xl border border-[#e6d5b8] relative overflow-hidden flex items-center justify-center">
                  <button
                    onClick={handleUndo}
                    disabled={!personPhotoPreview && !resultImageUrl}
                    title="Reset"
                    className="absolute top-4 left-4 z-10 w-9 h-9 bg-white/95 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-[#6b5645] border border-[#e6d5b8] rounded-full flex items-center justify-center shadow-sm transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleExpand}
                    disabled={!personPhotoPreview && !resultImageUrl}
                    title="Expand"
                    className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/95 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-[#6b5645] border border-[#e6d5b8] rounded-full flex items-center justify-center shadow-sm transition"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-[#e6d5b8] border-t-[#7a2331] rounded-full animate-spin" />
                      <p className="text-[#8a7360] text-xs font-medium">Generating your try-on...</p>
                    </div>
                  ) : resultImageUrl ? (
                    <img src={resultImageUrl} alt="Try-on result" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      {personPhotoPreview && (
                        <img
                          src={personPhotoPreview}
                          alt="Your photo"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}

                      <div
                        className="relative z-[5] flex flex-col items-center justify-center text-center px-8 w-full h-full"
                      >
                        {!personPhotoPreview && (
                          <div className="w-16 h-16 rounded-2xl bg-[#f3e6cf] flex items-center justify-center mb-5">
                            <ImageIcon className="w-8 h-8 text-[#7a2331]" />
                          </div>
                        )}
                        {!personPhotoPreview && (
                          <>
                            <h2 className="text-lg font-display font-bold text-[#3d2417] mb-2">
                              Visualize your outfit
                            </h2>
                            <p className="text-sm text-[#8a7360] max-w-xs mb-6">
                              Upload a full body photo to see how your selected pieces look together, or use the default model.
                            </p>
                          </>
                        )}

                        <label className="cursor-pointer inline-flex items-center gap-2.5 bg-white hover:bg-[#FCF6EC] border border-[#e6d5b8] rounded-xl shadow-md px-4 py-3 transition">
                          <span className="w-8 h-8 rounded-lg bg-[#7a2331]/10 flex items-center justify-center text-[#7a2331] shrink-0">
                            <Upload className="w-4 h-4" />
                          </span>
                          <span className="text-left">
                            <span className="block text-xs font-semibold text-[#7a2331]">
                              {personPhotoPreview ? 'Change photo' : 'Upload your photo'}
                            </span>
                            <span className="block text-[10px] text-[#a89478]">JPG, PNG or WEBP</span>
                          </span>
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        </label>
                      </div>
                    </>
                  )}

                  {genError && (
                    <div className="absolute top-16 left-4 right-4 z-10 text-red-600 text-xs text-center font-medium bg-white/95 backdrop-blur px-4 py-2 rounded-full border border-red-200 shadow-sm">
                      {genError}
                    </div>
                  )}

                  {personPhotoPreview && !resultImageUrl && (
                    <button
                      onClick={removePhoto}
                      title="Remove photo"
                      className="absolute bottom-4 right-4 z-10 w-9 h-9 bg-white/95 hover:bg-white text-[#6b5645] hover:text-red-500 border border-[#e6d5b8] rounded-full flex items-center justify-center shadow-sm transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT: wardrobe grid */}
              <div className="md:col-span-3 flex flex-col h-full max-h-[65vh]">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-2 text-[#6b5645] text-sm">
                    <ShoppingBag className="w-4 h-4 text-[#7a2331]" />
                    <span>{items.length} pieces in your almari</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      
                      {showFilterMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-[#e6d5b8] rounded-xl shadow-lg p-2 z-20">
                          <button
                            onClick={() => { setFavoritesOnly(f => !f); setShowFilterMenu(false); }}
                            className="w-full flex items-center justify-between text-left text-xs font-medium text-[#3d2417] px-3 py-2 rounded-lg hover:bg-[#f3e6cf]"
                          >
                            Favourites only
                            {favoritesOnly && <Check className="w-3.5 h-3.5 text-[#7a2331]" />}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => { setShowSortMenu(v => !v); setShowFilterMenu(false); }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-[#e6d5b8] bg-white text-[#6b5645] hover:border-[#7a2331] hover:text-[#7a2331] transition"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        Sort
                      </button>
                      {showSortMenu && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border border-[#e6d5b8] rounded-xl shadow-lg p-1 z-20">
                          {SORT_OPTIONS.map(opt => (
                            <button
                              key={opt.key}
                              onClick={() => { setSortBy(opt.key); setShowSortMenu(false); }}
                              className={`w-full text-left text-xs font-medium px-3 py-2 rounded-lg hover:bg-[#f3e6cf] flex items-center justify-between ${
                                sortBy === opt.key ? 'text-[#7a2331]' : 'text-[#3d2417]'
                              }`}
                            >
                              {opt.label}
                              {sortBy === opt.key && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center bg-white border border-[#e6d5b8] rounded-lg p-0.5">
                      <button
                        onClick={() => setViewMode('grid')}
                        title="Grid view"
                        className={`p-1.5 rounded-md transition ${
                          viewMode === 'grid' ? 'bg-[#7a2331] text-white' : 'text-[#a89478] hover:text-[#7a2331]'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        title="List view"
                        className={`p-1.5 rounded-md transition ${
                          viewMode === 'list' ? 'bg-[#7a2331] text-white' : 'text-[#a89478] hover:text-[#7a2331]'
                        }`}
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {parentCategories.map(({ key, label }) => {
                    const isActive = activeCategory === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleCategoryChange(key)}
                        className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                          isActive
                            ? 'bg-[#7a2331] text-white shadow-sm'
                            : 'bg-white border border-[#e6d5b8] text-[#8a7360] hover:border-[#7a2331] hover:text-[#7a2331]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {availableSubcategories.length > 0 && (
                  <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
                    <button
                      onClick={() => setActiveSubcategory('all')}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium transition ${
                        activeSubcategory === 'all'
                          ? 'bg-[#7a2331] text-white'
                          : 'bg-white border border-[#e6d5b8] text-[#8a7360] hover:border-[#7a2331] hover:text-[#7a2331]'
                      }`}
                    >
                      All
                    </button>
                    {availableSubcategories.map(subcategory => (
                      <button
                        key={subcategory}
                        onClick={() => setActiveSubcategory(subcategory)}
                        className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium capitalize transition ${
                          activeSubcategory === subcategory
                            ? 'bg-[#7a2331] text-white'
                            : 'bg-white border border-[#e6d5b8] text-[#8a7360] hover:border-[#7a2331] hover:text-[#7a2331]'
                        }`}
                      >
                        {subcategory}
                      </button>
                    ))}
                  </div>
                )}

                {isLoading ? (
                  <div className="flex-1 flex justify-center items-center">
                    <div className="w-8 h-8 border-2 border-[#e6d5b8] border-t-[#7a2331] rounded-full animate-spin" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#e6d5b8] rounded-xl">
                    <p className="text-[#6b5645] mb-2 text-sm font-medium">Your wardrobe is empty.</p>
                    <p className="text-[#a89478] text-xs">Upload items first to preview them here.</p>
                  </div>
                ) : visibleItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#e6d5b8] rounded-xl">
                    <p className="text-[#6b5645] mb-2 text-sm font-medium">No items found.</p>
                    <p className="text-[#a89478] text-xs">Try another category, filter or search term.</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                      {visibleItems.map(item => {
                        const isSelected = selectedItems.some(i => i.id === item.id);
                        const isFav = favorites.has(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`relative aspect-square rounded-xl bg-white border overflow-hidden transition-all duration-200 cursor-pointer ${
                              isSelected
                                ? 'ring-2 ring-[#7a2331] border-transparent shadow-md scale-95'
                                : 'border-[#e6d5b8] hover:border-[#7a2331]'
                            }`}
                            onClick={() => toggleItem(item)}
                          >
                            <img
                              src={item.image_url}
                              alt={item.subcategory || item.category}
                              className="w-full h-full object-contain p-1.5"
                            />
                            {isSelected && <div className="absolute inset-0 bg-[#7a2331]/10 pointer-events-none" />}

                            <button
                              onClick={e => { e.stopPropagation(); toggleFavorite(item.id); }}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-[#a89478] hover:text-[#7a2331] transition shadow-sm"
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-[#7a2331] text-[#7a2331]' : ''}`} />
                            </button>

                            {isSelected && (
                              <div className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-[#7a2331] rounded-full flex items-center justify-center text-white shadow-sm">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2">
                    {visibleItems.map(item => {
                      const isSelected = selectedItems.some(i => i.id === item.id);
                      const isFav = favorites.has(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleItem(item)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                            isSelected ? 'border-[#7a2331] bg-[#7a2331]/5' : 'border-[#e6d5b8] bg-white hover:border-[#7a2331]/50'
                          }`}
                        >
                          <div className="w-14 h-14 rounded-lg bg-[#FCF6EC] border border-[#e6d5b8] shrink-0 overflow-hidden flex items-center justify-center">
                            <img src={item.image_url} alt={item.subcategory} className="w-full h-full object-contain p-1" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#3d2417] capitalize truncate">
                              {item.subcategory || item.category || 'Item'}
                            </p>
                            <p className="text-xs text-[#a89478] capitalize">
                              {item.category || SUBCATEGORY_TO_CATEGORY[item.subcategory?.toLowerCase()] || 'other'}
                            </p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); toggleFavorite(item.id); }}
                            className="p-1.5 text-[#a89478] hover:text-[#7a2331] transition shrink-0"
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-[#7a2331] text-[#7a2331]' : ''}`} />
                          </button>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[#7a2331] flex items-center justify-center text-white shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* BOTTOM: selected pieces tray */}
            {selectedItems.length > 0 && (
              <div className="mt-6 pt-5 border-t border-[#e6d5b8] flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[#6b5645]">
                    <Sparkle className="w-3.5 h-3.5 text-[#c9a769]" />
                    Selected Pieces ({selectedItems.length})
                  </span>
                  <div className="flex gap-2">
                    {selectedItems.map(item => (
                      <div key={item.id} className="relative w-14 h-14 rounded-lg bg-white border border-[#e6d5b8] overflow-hidden">
                        <img src={item.image_url} alt={item.subcategory} className="w-full h-full object-contain p-1" />
                        <button
                          onClick={() => toggleItem(item)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-[#3d2417] text-white rounded-full flex items-center justify-center text-[9px]"
                          title="Remove"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={selectedItems.length === 0 || isGenerating}
                  className={`flex flex-col items-start px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                    isGenerating
                      ? 'bg-[#e6d5b8] text-[#a89478] cursor-not-allowed'
                      : 'bg-[#7a2331] hover:bg-[#631b28] text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isGenerating ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <WandSparkles className="w-4 h-4" />
                    )}
                    {isGenerating ? 'Generating...' : 'Visualize Look'}
                  </span>
                  {!isGenerating && (
                    <span className="text-[10px] font-normal opacity-80">See your outfit come to life</span>
                  )}
                </button>
              </div>
            )}

            {selectedItems.length === 0 && (
              <p className="mt-4 text-[11px] text-[#a89478] text-center">
                Select at least one wardrobe item to visualize.
              </p>
            )}
          </div>
        </main>
      </div>

      {/* AI STYLIST FAB */}
      <button
        onClick={() => navigate('/chatbot')}
        title="AI Stylist"
        className="fixed bottom-6 right-6 z-30 flex flex-col items-center justify-center w-20 h-20 rounded-full bg-[#7a2331] hover:bg-[#631b28] text-white shadow-lg transition"
      >
        <Sparkles className="w-5 h-5 mb-0.5" />
        <span className="text-[9px] font-semibold">AI Stylist</span>
      </button>
    </div>
  );
}