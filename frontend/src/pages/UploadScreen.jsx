import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, Bell, HelpCircle, UploadCloud, Smartphone,
  Camera, Lightbulb, Tag, Lock, Sparkles, AlertCircle, CheckCircle,
  CloudUpload, Home, Menu, User, Wand2,
} from 'lucide-react';
import {
  getCatalogue,
  uploadClothingItem,
  getItemMetadata,
  updateItemMetadata,
  updateItemCategory,
} from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import Sidebar from '../components/Sidebar2.jsx';
import ProfileDrawer from './ProfileScreen.jsx';

const CATEGORY_OPTIONS = {
  top: ['t-shirt', 'blouse', 'sweater', 'hoodie', 'shirt'],
  bottom: ['jeans', 'trousers', 'shorts', 'skirt'],
  dress: ['casual dress', 'formal dress'],
  'eastern wear': ['shalwar kameez', 'kurta'],
  outerwear: ['jacket', 'blazer', 'suit jacket', 'coat', 'cardigan'],
  shoes: ['heels', 'flats', 'sneakers', 'sandals', 'boots'],
  accessories: ['bag', 'handbag', 'jewelry', 'scarf', 'belt'],
};

const COLOR_OPTIONS = [
  { label: 'Maroon', hex: '#7a2331' },
  { label: 'Beige', hex: '#d9c6a5' },
  { label: 'Black', hex: '#1c1c1c' },
  { label: 'Navy', hex: '#1f2a44' },
  { label: 'Blush', hex: '#e3b7ae' },
  { label: 'Olive', hex: '#6b6b3a' },
  { label: 'White', hex: '#f5f0e6' },
  { label: 'Denim', hex: '#4a6a8a' },
];

const SEASON_OPTIONS = ['Summer', 'Winter', 'Spring', 'Fall', 'All season'];

/* Same little hanger mark used in the other screens' sidebar
   nav — duplicated here since it's tiny; if it ends up in a
   sixth place, move it into its own shared file instead. */
function Hanger() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5.5C12 3.8 13.3 2.5 15 2.5C16.7 2.5 18 3.8 18 5.5C18 7.2 16.5 8 15.5 8.8L12 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 11L3 17.5C2.4 18 2.8 19 3.6 19H20.4C21.2 19 21.6 18 21 17.5L12 11Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/* Matches the other screens' NAV_ITEMS (5 entries — Sidebar2's
   buttonPositions array only has 5 slots). */
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

// Best-effort swatch color for a detected color name that isn't in COLOR_OPTIONS —
// lets the browser resolve any valid CSS color keyword (e.g. "gray", "maroon").
// Normalizes a detected value to the exact casing of a matching option
// (so <select> can actually select it), falling back to the raw value.
function matchOption(raw, options) {
  if (!raw) return '';
  const found = options.find(opt => opt.toLowerCase() === String(raw).toLowerCase());
  return found || raw;
}

function resolveColorSwatch(label) {
  if (!label) return '#e6d5b8';
  const known = COLOR_OPTIONS.find(c => c.label.toLowerCase() === label.toLowerCase());
  if (known) return known.hex;
  if (typeof document !== 'undefined') {
    const probe = document.createElement('div');
    probe.style.color = label.replace(/\s+/g, '');
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    if (computed && computed !== 'rgba(0, 0, 0, 0)') return computed;
  }
  return '#c9b8a3';
}

// Selects normally only show a value if it exactly matches one of `options`.
// Detected values from the API can have different casing/wording, so we
// inject the raw detected value as an extra option when it doesn't match —
// this guarantees whatever was auto-detected actually shows up selected.
function SelectField({ label, value, onChange, options, placeholder }) {
  const needsInjectedOption = value && !options.some(opt => opt.toLowerCase() === value.toLowerCase());
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-[#6b5645] mb-1.5">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white border border-[#e6d5b8] rounded-xl px-3 py-2.5 text-sm text-[#3d2417] focus:outline-none focus:ring-2 focus:ring-[#7a2331]/20 focus:border-[#7a2331] transition capitalize"
      >
        <option value="">{placeholder}</option>
        {needsInjectedOption && <option value={value}>{value}</option>}
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}

function formatErrorMessage(err) {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (err && err.message && typeof err.message === 'string') return err.message;
  if (typeof err === 'object') {
    try {
      return JSON.stringify(err);
    } catch {
      return 'Something went wrong. Please try again.';
    }
  }
  return String(err) || 'Something went wrong. Please try again.';
}

export default function UploadScreen() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const userAvatar = user?.user_metadata?.avatar_url || null;
  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';


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

  const [recentItems, setRecentItems] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [color, setColor] = useState('');
  const [season, setSeason] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadedItemId, setUploadedItemId] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const loadRecent = async () => {
    try {
      const response = await getCatalogue();
      const items = response?.items || response?.data || response || [];
      const sorted = [...(Array.isArray(items) ? items : [])].sort((a, b) => {
        const aTime = new Date(a.created_at || a.createdAt || a.date_added || 0).getTime();
        const bTime = new Date(b.created_at || b.createdAt || b.date_added || 0).getTime();
        if (aTime !== bTime) return bTime - aTime;
        // Fall back to id ordering if there's no usable timestamp on the item.
        return String(b.id).localeCompare(String(a.id));
      });
      setRecentItems(sorted.slice(0, 4));
    } catch (error) {
      console.error('Failed to load recent uploads', error);
    }
  };

  useEffect(() => {
    loadRecent();
  }, []);

  const subcategoryOptions = category ? CATEGORY_OPTIONS[category.toLowerCase()] || [] : [];

  const handlePhotoSelect = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (JPG, PNG).');
      return;
    }

    setPhotoPreview(URL.createObjectURL(file));
    setUploadError(null);
    setIsAnalyzing(true);
    try {
      const response = await uploadClothingItem(file);
      const item = response?.item || {};
      setUploadedItemId(item.id || null);
      const detectedCategory = matchOption(item.category, Object.keys(CATEGORY_OPTIONS));
      setCategory(detectedCategory);
      const subOptions = CATEGORY_OPTIONS[detectedCategory.toLowerCase()] || [];
      setSubcategory(matchOption(item.subcategory, subOptions));

      let detectedColor = response?.color || item.color || '';
      let detectedSeason = Array.isArray(response?.season) ? response.season[0] : response?.season || item.season || '';

      if (item.id) {
        try {
          const meta = await getItemMetadata(item.id);
          if (!detectedColor) detectedColor = meta?.color || '';
          if (!detectedSeason) detectedSeason = Array.isArray(meta?.season) ? meta.season[0] : meta?.season || '';
        } catch (metaError) {
          console.error('Failed to load item metadata', metaError);
        }
      }

      setColor(matchOption(detectedColor, COLOR_OPTIONS.map(c => c.label)));
      setSeason(matchOption(detectedSeason, SEASON_OPTIONS));
    } catch (error) {
      console.error('Failed to analyze item', error);
      setUploadError(formatErrorMessage(error));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCancel = () => {
    // Note: the item is already saved server-side as soon as it's uploaded/analyzed.
    // This just clears the form for a new upload — wire in a delete call here if you
    // want "Cancel" to also remove the just-created item.
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setUploadedItemId(null);
    setCategory('');
    setSubcategory('');
    setColor('');
    setSeason('');
    setIsAnalyzing(false);
    setIsSuccess(false);
    setUploadError(null);
  };

  // Same reset as Cancel, used from the success screen's "Upload another item" button.
  const handleUploadAnother = () => handleCancel();

  const handleSubmit = async () => {
    if (!photoPreview) return;
    setUploadError(null);
    setIsSaving(true);
    try {
      if (uploadedItemId) {
        await updateItemCategory(uploadedItemId, { category, subcategory });
        await updateItemMetadata(uploadedItemId, { color, season });
      }
      await loadRecent();
      setIsSuccess(true);
    } catch (error) {
      console.error('Failed to save item', error);
      setUploadError(formatErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const hasPhoto = Boolean(photoPreview);

  return (
    <div className="min-h-screen bg-[#FBF3E7]">
      {/* MOBILE TOP BAR */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-[#e6d5b8] bg-[#FBF3E7]/95 px-4 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setIsMobileSidebarOpen(true)} className="rounded-full p-2 text-[#3d2417]" aria-label="Open menu">
          <Menu size={22} />
        </button>
        <div className="font-serif text-lg font-semibold tracking-[0.14em] text-[#7a2331]">ALMARI ADDA</div>
        <button
  type="button"
  onClick={() => setIsProfileOpen(true)}
  aria-label="Profile"
  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e6d5b8] bg-white text-[#3d2417] transition hover:bg-[#f3e6cf]"
>
  <User size={17} />
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

      <div className="flex min-h-screen flex-col pt-16 lg:ml-[260px] lg:pt-0">

        <main className="flex-1 px-4 md:px-10 pt-8 pb-5 max-w-[1440px] w-full mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 mb-8">

  {/* Left spacer */}
  <div className="hidden md:block" />

  {/* Center title */}
  <div className="text-center">

    <h1 className="text-3xl md:text-4xl font-display font-bold text-[#3d2417]">
      Upload <span className="text-[#7a2331]">Your Items</span>
    </h1>

    <div className="flex items-center justify-center gap-2 mt-2.5 mb-2">
      <span className="w-8 h-px bg-[#c9a769]" />
      <span className="w-1.5 h-1.5 rotate-45 bg-[#c9a769]" />
      <span className="w-8 h-px bg-[#c9a769]" />
    </div>

    <p className="text-[#8a7360] text-sm">
      Ask for outfit ideas, styling tips and wardrobe help.
    </p>

  </div>

  {/* Right buttons */}
  <div className="flex justify-end items-center gap-3">

   <button
  onClick={() => setIsProfileOpen(true)}
  aria-label="Profile"
  className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#e6d5b8] hover:bg-[#f3e6cf] text-[#3d2417] transition"
>
  <User className="w-4 h-4" />
</button>

  </div>

</div>

          {uploadError && (
            <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-xs font-medium flex-1">{uploadError}</p>
              <button onClick={() => setUploadError(null)} className="text-xs font-semibold hover:underline shrink-0">
                Dismiss
              </button>
            </div>
          )}

          <div className="bg-[#FCF6EC] rounded-3xl border border-[#e6d5b8] shadow-[0_8px_30px_rgba(61,36,23,0.08)] p-4 md:p-6">
            {isSuccess ? (
              <div className="flex flex-col items-center text-center py-14">
                <div className="w-14 h-14 rounded-2xl bg-[#7a2331]/10 flex items-center justify-center mb-5">
                  <CheckCircle className="w-7 h-7 text-[#7a2331]" />
                </div>
                <h2 className="text-xl font-display font-bold text-[#3d2417] mb-1.5">Added to your Almari!</h2>
                <p className="text-sm text-[#8a7360] mb-8 max-w-sm">
                  Your item is saved and ready to be styled into an outfit.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleUploadAnother}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#6b5645] border border-[#e6d5b8] hover:bg-[#f3e6cf] transition"
                  >
                    Upload another item
                  </button>
                  <button
                    onClick={() => navigate('/closet')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#7a2331] hover:bg-[#631b28] text-white shadow-sm transition"
                  >
                    View in Closet
                  </button>
                </div>
              </div>
            ) : !hasPhoto ? (
              <div className="flex flex-col items-center text-center py-10">
                <h2 className="text-xl font-display font-bold text-[#3d2417] mb-1.5">Add a new item</h2>
                <p className="text-sm text-[#8a7360] mb-8">Snap a photo of any clothing item and we'll handle the rest.</p>

                <label className="cursor-pointer w-full max-w-lg border-2 border-dashed border-[#e6d5b8] hover:border-[#7a2331] rounded-2xl bg-white/60 hover:bg-white transition flex flex-col items-center justify-center py-14 px-8">
                  <div className="w-14 h-14 rounded-2xl bg-[#7a2331]/10 flex items-center justify-center mb-5">
                    <UploadCloud className="w-7 h-7 text-[#7a2331]" />
                  </div>
                  <p className="text-base font-display font-bold text-[#3d2417] mb-1">Drag and drop or click to upload</p>
                  <p className="text-xs text-[#a89478]">Supports JPG, PNG photos</p>
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                </label>

                <div className="grid grid-cols-3 gap-6 mt-10 max-w-lg w-full">
                  {[
                    { n: 1, title: 'Upload a photo', sub: 'One item at a time' },
                    { n: 2, title: 'We tag it', sub: 'Background removed, categorised' },
                    { n: 3, title: "It's in your closet", sub: 'Ready for outfits' },
                  ].map(s => (
                    <div key={s.n} className="text-center">
                      <div className="w-7 h-7 mx-auto rounded-lg bg-[#7a2331]/10 text-[#7a2331] text-xs font-bold flex items-center justify-center mb-2">
                        {s.n}
                      </div>
                      <p className="text-xs font-semibold text-[#3d2417] mb-0.5">{s.title}</p>
                      <p className="text-[11px] text-[#a89478]">{s.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-10 max-w-lg w-full bg-white/70 border border-[#e6d5b8] rounded-2xl p-4 text-left">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-[#3d2417] mb-2.5">
                    <Lightbulb className="w-3.5 h-3.5 text-[#c9a769]" />
                    Helpful tips
                  </p>
                  <ul className="space-y-2 text-[11px] text-[#6b5645] list-disc list-inside">
                    <li>Use natural light for true colors</li>
                    <li>Show the full item in frame</li>
                    <li>Avoid busy or cluttered backgrounds</li>
                    <li>Multiple angles help us understand better</li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Once a photo has been selected, the dropzone/recent-uploads panel goes
                 away entirely and details + preview take up the full width. */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-display font-bold text-[#3d2417]">Item details</h3>
                    {isAnalyzing ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#a89478]">
                        <span className="w-3 h-3 border-2 border-[#e6d5b8] border-t-[#7a2331] rounded-full animate-spin" />
                        Detecting details from your photo...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#7a2331]">
                        <Sparkles className="w-3 h-3" />
                        Auto-filled — edit anything that's off
                      </span>
                    )}
                  </div>

                  <div className={`grid grid-cols-2 gap-4 transition-opacity ${isAnalyzing ? 'opacity-40 pointer-events-none' : ''}`}>
                    <SelectField
                      label="Category"
                      value={category}
                      onChange={val => { setCategory(val); setSubcategory(''); }}
                      options={Object.keys(CATEGORY_OPTIONS)}
                      placeholder="Select category"
                    />
                    <SelectField
                      label="Subcategory"
                      value={subcategory}
                      onChange={setSubcategory}
                      options={subcategoryOptions}
                      placeholder="Select subcategory"
                    />

                    <label className="block">
                      <span className="block text-xs font-semibold text-[#6b5645] mb-1.5">Color</span>
                      <div className="relative">
                        <select
                          value={color}
                          onChange={e => setColor(e.target.value)}
                          className="w-full bg-white border border-[#e6d5b8] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#3d2417] focus:outline-none focus:ring-2 focus:ring-[#7a2331]/20 focus:border-[#7a2331] transition capitalize"
                        >
                          <option value="">Select color</option>
                          {color && !COLOR_OPTIONS.some(c => c.label.toLowerCase() === color.toLowerCase()) && (
                            <option value={color}>{color}</option>
                          )}
                          {COLOR_OPTIONS.map(c => (
                            <option key={c.label} value={c.label}>{c.label}</option>
                          ))}
                        </select>
                        <span
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-[#e6d5b8]"
                          style={{ backgroundColor: resolveColorSwatch(color) }}
                        />
                      </div>
                    </label>

                    <SelectField label="Season" value={season} onChange={setSeason} options={SEASON_OPTIONS} placeholder="Select season" />
                  </div>
                </div>

                {/* RIGHT: preview */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div>
                    <div className="flex justify-center mb-2">
                      <span className="bg-[#2b1810] text-[#d4b16a] text-[10px] font-bold tracking-wider px-3 py-1 rounded-full border border-[#c9a769]">
                        PREVIEW
                      </span>
                    </div>
                    <div className="h-64 md:h-72 bg-white rounded-2xl border border-[#e6d5b8] overflow-hidden flex items-center justify-center">
                      <img src={photoPreview} alt="Item preview" className="w-full h-full object-contain p-3" />
                    </div>
                    <label className="cursor-pointer w-full mt-2.5 inline-flex items-center justify-center gap-2 text-[#7a2331] border border-[#7a2331]/30 hover:bg-[#7a2331]/5 text-xs font-semibold px-4 py-2 rounded-xl transition">
                      <Camera className="w-3.5 h-3.5" />
                      Change photo
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {hasPhoto && !isSuccess && (
              <div className="mt-6 pt-4 border-t border-[#e6d5b8] flex flex-col items-center gap-2.5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#6b5645] border border-[#e6d5b8] hover:bg-[#f3e6cf] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSaving || isAnalyzing}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition ${
                      isSaving || isAnalyzing ? 'bg-[#e6d5b8] text-[#a89478] cursor-not-allowed' : 'bg-[#7a2331] hover:bg-[#631b28] text-white'
                    }`}
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Tag className="w-4 h-4" />
                    )}
                    {isSaving ? 'Adding...' : 'Add to Almari'}
                  </button>
                </div>
                <p className="flex items-center gap-1.5 text-[11px] text-[#a89478]">
                  <Lock className="w-3 h-3" />
                  Your items are private and secure
                </p>
              </div>
            )}
          </div>

          {recentItems.length > 0 && (
            <div className="bg-[#FCF6EC] rounded-3xl border border-[#e6d5b8] shadow-[0_8px_30px_rgba(61,36,23,0.08)] p-4 md:p-6 mt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-display font-bold text-[#3d2417]">Recent uploads</p>
                <button onClick={() => navigate('/closet')} className="text-xs font-semibold text-[#7a2331] hover:underline">
                  View all
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-3">
                {recentItems.map(item => (
                  <div key={item.id} className="aspect-square rounded-xl bg-white border border-[#e6d5b8] overflow-hidden">
                    <img src={item.image_url} alt={item.subcategory} className="w-full h-full object-contain p-1.5" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <button
        onClick={() => navigate('/chatbot')}
        title="AI Stylist"
        className="fixed bottom-6 right-6 z-30 flex flex-col items-center justify-center w-20 h-20 rounded-full bg-[#7a2331] hover:bg-[#631b28] text-white shadow-lg transition"
      >
        <Sparkles className="w-5 h-5 mb-0.5" />
        <span className="text-[9px] font-semibold">AI Stylist</span>
      </button>
      <ProfileDrawer
  isOpen={isProfileOpen}
  onClose={() => setIsProfileOpen(false)}
/>
    </div>
  );
}
