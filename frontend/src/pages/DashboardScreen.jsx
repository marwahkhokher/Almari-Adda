import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Sparkles, Camera, MessageCircle, ShoppingBag, AlertTriangle, RefreshCw, LayoutGrid, Shirt, PanelBottom, Gem, Layers } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getCatalogue } from '../lib/api.js';
import { playWhoosh } from '../lib/soundEffects.js';
import ItemDetailModal from '../components/ItemDetailModal.jsx';

const WOOD_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='60' viewBox='0 0 300 60'%3E%3Cg stroke='%23000000' stroke-opacity='0.08' fill='none'%3E%3Cpath d='M0 10 Q75 5 150 10 T300 10'/%3E%3Cpath d='M0 25 Q75 30 150 22 T300 28'/%3E%3Cpath d='M0 42 Q75 38 150 45 T300 40'/%3E%3Cpath d='M0 55 Q75 50 150 56 T300 52'/%3E%3C/g%3E%3C/svg%3E\")";

const BG_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg transform='rotate(-10 100 100)' fill='none' stroke='%23D4537E' stroke-width='2'%3E%3Cpath d='M28 18l-8 6-8-6-8 6v8l8-2v22h16V26l8 2v-8z'/%3E%3Cg transform='translate(90 10)'%3E%3Cpath d='M2 2h26v14l-6 2v50h-6V34l-2 2-2-2v34h-6V18l-6-2z'/%3E%3C/g%3E%3Cg transform='translate(20 100)'%3E%3Cpath d='M2 20c0-10 8-18 18-18s18 8 18 18H2z'/%3E%3Cellipse cx='20' cy='20' rx='24' ry='4'/%3E%3C/g%3E%3Cg transform='translate(110 105)'%3E%3Ccircle cx='8' cy='10' r='8'/%3E%3Ccircle cx='32' cy='10' r='8'/%3E%3Cpath d='M16 10h8M0 8l-6-4M40 8l6-4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

const CLOTHING_TAXONOMY = {
  top: ['t-shirt', 'blouse', 'sweater', 'hoodie', 'blazer', 'jacket', 'suit jacket'],
  bottom: ['jeans', 'trousers', 'shorts', 'skirt'],
  dress: ['casual dress', 'formal dress'],
  'eastern wear': ['shalwar kameez', 'kurta'],
};

const SUBCATEGORY_TO_CATEGORY = {};
Object.entries(CLOTHING_TAXONOMY).forEach(([category, subs]) => {
  subs.forEach((sub) => {
    SUBCATEGORY_TO_CATEGORY[sub] = category;
  });
});

const shelfLabels = {
  top: 'Tops',
  bottom: 'Bottoms',
  dress: 'Dresses',
  'eastern wear': 'Eastern wear',
  other: 'Other',
};

const parentCategories = [
  { key: 'all', label: 'All', icon: 'LayoutGrid' },
  { key: 'top', label: 'Top', icon: 'Shirt' },
  { key: 'bottom', label: 'Bottom', icon: 'PanelBottom' },
  { key: 'dress', label: 'Dress', icon: 'Gem' },
  { key: 'eastern wear', label: 'Eastern wear', icon: 'Layers' },
  { key: 'other', label: 'Other', icon: 'ShoppingBag' },
];

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const firstName = user?.user_metadata?.first_name || 'there';
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategories, setActiveSubcategories] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);

  const handleItemClick = (item) => {
    playWhoosh();
    setSelectedItem(item);
  };

  const fetchCatalogue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getCatalogue();
      const catalogueItems = response?.items || response?.data || response || [];
      setItems(Array.isArray(catalogueItems) ? catalogueItems : []);
    } catch (err) {
      setError(err.message || 'Could not load your wardrobe.');
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
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const username = user?.email ? user.email.split('@')[0] : 'Stylist';

  const quickActions = [
    { title: "Visualize", desc: "Try on outfits", icon: Sparkles, route: "/visualize" },
    { title: "Upload", desc: "Add new items", icon: Camera, route: "/upload" },
    { title: "Chatbot", desc: "Ask the AI stylist", icon: MessageCircle, route: "/chatbot" },
  ];

  const groups = { top: [], bottom: [], dress: [], 'eastern wear': [], other: [] };
  items.forEach((item) => {
    const sub = item.subcategory?.toLowerCase() || '';
    const category = SUBCATEGORY_TO_CATEGORY[sub] || 'other';
    groups[category].push(item);
  });

  const visibleGroups = activeCategory === 'all'
    ? groups
    : { [activeCategory]: groups[activeCategory] || [] };

  const filterBySubcategory = (list, key) => {
    const activeSub = activeSubcategories[key] || 'all';
    if (activeSub === 'all') return list;
    return list.filter((item) => (item.subcategory?.toLowerCase() || '') === activeSub);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.14]"
        style={{ backgroundImage: BG_PATTERN, backgroundSize: '200px 200px' }}
      />
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 relative z-10">
        {/* Greeting header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-pink-600 uppercase tracking-wider mb-1">Welcome to your closet</p>
            <h1 className="font-display text-3xl font-bold text-neutral-900">
              Hi {user?.user_metadata?.first_name || user?.email?.split('@')[0]}, ready to get dressed?
            </h1>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2.5 text-neutral-500 hover:text-pink-600 transition-colors rounded-full border border-neutral-200 hover:border-pink-300"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.route)}
              className="flex flex-col items-center gap-2 bg-pink-50 hover:bg-pink-100 rounded-xl p-4 text-center transition"
            >
              <div className="w-9 h-9 rounded-lg bg-pink-600 flex items-center justify-center">
                <action.icon className="w-4.5 h-4.5 text-white" size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {action.title}
                </p>
                <p className="text-xs text-neutral-500">
                  {action.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Parent category tabs */}
        <div className="flex gap-6 mb-6 border-b border-neutral-200 overflow-x-auto">
          {parentCategories.map(({ key, label, icon }) => {
            const icons = { LayoutGrid, Shirt, PanelBottom, Gem, Layers, ShoppingBag };
            const Icon = icons[icon];
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`flex items-center gap-1.5 pb-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  isActive
                    ? 'text-pink-600 border-pink-600'
                    : 'text-neutral-400 border-transparent hover:text-neutral-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Refresh + count */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">My closet</p>
          <button
            onClick={fetchCatalogue}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-pink-600 text-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col items-center gap-3 text-center mb-6">
            <AlertTriangle className="text-red-600" size={24} />
            <p className="text-red-700 text-sm font-medium">{error}</p>
            <button onClick={fetchCatalogue} className="text-sm font-medium text-pink-600 hover:underline">
              Retry
            </button>
          </div>
        )}

        {/* Wooden shelf closet */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-[#4B2E1F] rounded-xl p-3">
                <div className="h-4 w-24 bg-[#6B4530] rounded animate-pulse mb-2 ml-1" />
                <div className="h-24 bg-pink-50 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        ) : !error && items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center bg-[#4B2E1F] rounded-xl"
          >
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-pink-300" />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2">Your closet is empty</h3>
            <p className="text-[#C9A98A] mb-6 max-w-sm text-sm">Upload clothing items to start filling your shelves.</p>
            <button
              onClick={() => navigate('/upload')}
              className="bg-pink-600 text-white font-medium text-sm px-6 py-2.5 rounded-lg hover:bg-pink-700 transition"
            >
              Add first item
            </button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              {/* Top cornice trim */}
              <div className="h-4 bg-gradient-to-b from-[#B8875C] via-[#A67744] to-[#8B6234] mx-1 shadow-sm" />

              {/* Frame body with side posts */}
              <div
                className="bg-gradient-to-br from-[#A67744] to-[#8B6234] border-x-[8px] border-[#6B4E28] px-3 pt-3 pb-4 space-y-5"
                style={{ backgroundImage: `${WOOD_GRAIN}, linear-gradient(to bottom right, #A67744, #8B6234)`, backgroundSize: '300px 60px, cover' }}
              >
                {Object.entries(visibleGroups).map(([key, rawItems]) => {
                  if (rawItems.length === 0) return null;
                  const groupItems = filterBySubcategory(rawItems, key);
                  return (
                    <div key={key}>
                      <div className="flex items-center gap-2 px-1 pb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4B2E1F]" />
                        <p className="text-xs font-bold text-[#4B2E1F] uppercase tracking-widest">{shelfLabels[key]}</p>
                        <div className="flex-1 h-px bg-[#6B4E28]/50" />
                        <p className="text-[11px] text-[#5A3D24]">{groupItems.length} {groupItems.length === 1 ? 'item' : 'items'}</p>
                      </div>

                      {CLOTHING_TAXONOMY[key] && (
                        <div className="flex flex-wrap gap-1.5 px-1 pb-2">
                          <button
                            onClick={() => setActiveSubcategories((prev) => ({ ...prev, [key]: 'all' }))}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize transition ${
                              (activeSubcategories[key] || 'all') === 'all'
                                ? 'bg-neutral-900 text-white'
                                : 'bg-white/70 text-neutral-700 hover:bg-white'
                            }`}
                          >
                            All
                          </button>
                          {CLOTHING_TAXONOMY[key].map((sub) => (
                            <button
                              key={sub}
                              onClick={() => setActiveSubcategories((prev) => ({ ...prev, [key]: sub }))}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-medium capitalize transition ${
                                activeSubcategories[key] === sub
                                  ? 'bg-neutral-900 text-white'
                                  : 'bg-white/70 text-neutral-700 hover:bg-white'
                              }`}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Shelf board with 3D front edge */}
                      <div className="relative">
                        <div className="bg-pink-100 p-3 flex gap-3 overflow-x-auto shadow-inner border-t-2 border-[#6B4E28]">
                          {groupItems.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleItemClick(item)}
                              className="shrink-0 w-32 h-40 bg-white border border-pink-200 flex items-center justify-center p-2.5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                            >
                              <img
                                src={item.image_url}
                                alt={item.subcategory || item.category}
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                          ))}
                          {groupItems.length === 0 && (
                            <p className="text-xs text-[#5A3D24] py-4 px-2">No items in this subcategory yet.</p>
                          )}
                        </div>
                        {/* Thick shelf board front edge, physical depth */}
                        <div className="h-3 bg-gradient-to-b from-[#8B6234] via-[#6B4E28] to-[#4B3618] mx-0" style={{ backgroundImage: `${WOOD_GRAIN}, linear-gradient(to bottom, #8B6234, #4B3618)`, backgroundSize: '300px 60px, cover' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom base */}
              <div className="h-4 bg-gradient-to-b from-[#6B4E28] to-[#4B3618] mx-1" />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} onDeleted={(id) => setItems((prev) => prev.filter((i) => i.id !== id))} />
    </div>
  );
}
