import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  Sparkles,
  Camera,
  MessageCircle,
  ShoppingBag,
  AlertTriangle,
  LayoutGrid,
  Shirt,
  PanelBottom,
  Gem,
  Layers,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext.jsx';
import { getCatalogue } from '../lib/api.js';
import { playWhoosh } from '../lib/soundEffects.js';
import ItemDetailModal from '../components/ItemDetailModal.jsx';

const WOOD_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='60' viewBox='0 0 300 60'%3E%3Cg stroke='%23000000' stroke-opacity='0.07' fill='none'%3E%3Cpath d='M0 10 Q75 5 150 10 T300 10'/%3E%3Cpath d='M0 25 Q75 30 150 22 T300 28'/%3E%3Cpath d='M0 42 Q75 38 150 45 T300 40'/%3E%3Cpath d='M0 55 Q75 50 150 56 T300 52'/%3E%3C/g%3E%3C/svg%3E\")";

const BG_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg transform='rotate(-10 100 100)' fill='none' stroke='%23D4537E' stroke-width='2'%3E%3Cpath d='M28 18l-8 6-8-6-8 6v8l8-2v22h16V26l8 2v-8z'/%3E%3Cg transform='translate(90 10)'%3E%3Cpath d='M2 2h26v14l-6 2v50h-6V34l-2 2-2-2v34h-6V18l-6-2z'/%3E%3C/g%3E%3Cg transform='translate(20 100)'%3E%3Cpath d='M2 20c0-10 8-18 18-18s18 8 18 18H2z'/%3E%3Cellipse cx='20' cy='20' rx='24' ry='4'/%3E%3C/g%3E%3Cg transform='translate(110 105)'%3E%3Ccircle cx='8' cy='10' r='8'/%3E%3Ccircle cx='32' cy='10' r='8'/%3E%3Cpath d='M16 10h8M0 8l-6-4M40 8l6-4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

const CLOTHING_TAXONOMY = {
  top: [
    't-shirt',
    'blouse',
    'sweater',
    'hoodie',
    'blazer',
    'jacket',
    'suit jacket',
  ],
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
  'eastern wear': 'Eastern Wear',
  other: 'Other',
};

const parentCategories = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'top', label: 'Top', icon: Shirt },
  { key: 'bottom', label: 'Bottom', icon: PanelBottom },
  { key: 'dress', label: 'Dress', icon: Gem },
  { key: 'eastern wear', label: 'Eastern Wear', icon: Layers },
  { key: 'other', label: 'Other', icon: ShoppingBag },
];

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
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

      const catalogueItems =
        response?.items ||
        response?.data ||
        response ||
        [];

      setItems(
        Array.isArray(catalogueItems)
          ? catalogueItems
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          'Could not load your wardrobe.'
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
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const quickActions = [
    {
      title: 'Visualize',
      desc: 'Try on outfits',
      icon: Sparkles,
      route: '/visualize',
    },
    {
      title: 'Upload',
      desc: 'Add new items',
      icon: Camera,
      route: '/upload',
    },
    {
      title: 'Chatbot',
      desc: 'Ask the AI stylist',
      icon: MessageCircle,
      route: '/chatbot',
    },
  ];

  const groups = {
    top: [],
    bottom: [],
    dress: [],
    'eastern wear': [],
    other: [],
  };

  items.forEach((item) => {
    const sub =
      item.subcategory?.toLowerCase() || '';

    const category =
      SUBCATEGORY_TO_CATEGORY[sub] || 'other';

    groups[category].push(item);
  });

  const visibleGroups =
    activeCategory === 'all'
      ? groups
      : {
          [activeCategory]:
            groups[activeCategory] || [],
        };

  const filterBySubcategory = (list, key) => {
    const activeSub =
      activeSubcategories[key] || 'all';

    if (activeSub === 'all') {
      return list;
    }

    return list.filter(
      (item) =>
        (item.subcategory?.toLowerCase() || '') ===
        activeSub
    );
  };

  return (
    <div className="min-h-screen bg-[#fffafc] relative overflow-hidden">

      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage: BG_PATTERN,
          backgroundSize: '200px 200px',
        }}
      />

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 relative z-10">

        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-pink-600 uppercase tracking-wider mb-1">
              Welcome to your closet
            </p>

            <h1 className="font-display text-3xl font-bold text-neutral-900">
              Hi{' '}
              {user?.user_metadata?.first_name ||
                user?.email?.split('@')[0] ||
                'there'}
              , ready to get dressed?
            </h1>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2.5 text-neutral-500 hover:text-pink-600 transition-colors rounded-full border border-neutral-200 hover:border-pink-300 bg-white"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* ================= QUICK ACTIONS ================= */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.route)}
              className="group flex flex-col items-center gap-2 bg-white border border-pink-200 rounded-xl p-4 text-center shadow-sm hover:shadow-md hover:border-pink-300 hover:-translate-y-0.5 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-100 border border-pink-200 flex items-center justify-center group-hover:bg-pink-600 transition-colors">
                <action.icon
                  className="text-pink-600 group-hover:text-white transition-colors"
                  size={19}
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {action.title}
                </p>

                <p className="text-xs text-neutral-500 mt-0.5">
                  {action.desc}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* ================= CENTERED CLOSET ================= */}
        <div className="w-full flex justify-center -translate-y-3">
          <div className="w-full max-w-4xl mx-auto">

            {/* ================= CLOSET HEADER ================= */}
            <div className="relative mb-0">

              <div className="h-2 mx-3 rounded-t-sm bg-[#65432B] shadow-md" />

              <div
                className="relative h-20 mx-1 rounded-t-xl overflow-hidden border-x-[8px] border-t-[8px] border-[#795334] shadow-lg"
                style={{
                  backgroundImage: `${WOOD_GRAIN}, linear-gradient(to bottom, #D2A77B, #A9784E)`,
                  backgroundSize: '300px 60px, cover',
                }}
              >

                {/* Top highlight */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-[#E7C69E] to-[#C18F61]" />

                {/* Centered title */}
                <div className="absolute inset-0 flex items-start justify-center pt-2">
                  <h2 className="font-display text-4xl font-extrabold tracking-wide text-[#3F281A]">
                    My Closet
                  </h2>
                </div>

                {/* Bottom molding */}
                <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-b from-[#8A5E3C] to-[#5D3B27]" />

              </div>
            </div>

            {/* ================= ERROR ================= */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col items-center gap-3 text-center mb-6 mt-4">
                <AlertTriangle
                  className="text-red-600"
                  size={24}
                />

                <p className="text-red-700 text-sm font-medium">
                  {error}
                </p>

                <button
                  onClick={fetchCatalogue}
                  className="text-sm font-medium text-pink-600 hover:underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* ================= LOADING ================= */}
            {isLoading ? (
              <div className="rounded-b-2xl bg-[#9A6B48] border-x-[10px] border-[#795334] p-5 shadow-xl">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="mb-5 last:mb-0"
                  >
                    <div className="h-5 w-28 bg-[#B9855C] rounded animate-pulse mb-3" />

                    <div className="h-32 bg-[#4A3022] rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>

            ) : !error && items.length === 0 ? (

              /* ================= EMPTY CLOSET ================= */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-b-2xl bg-[#62402B] border-x-[10px] border-[#795334] border-b-[10px] shadow-2xl py-20 flex flex-col items-center justify-center text-center"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 text-pink-300" />
                </div>

                <h3 className="text-xl font-display font-bold text-white mb-2">
                  Your closet is empty
                </h3>

                <p className="text-[#E0C3A2] mb-6 max-w-sm text-sm">
                  Upload clothing items to start
                  filling your shelves.
                </p>

                <button
                  onClick={() => navigate('/upload')}
                  className="bg-pink-600 text-white font-medium text-sm px-6 py-2.5 rounded-lg hover:bg-pink-700 transition"
                >
                  Add first item
                </button>
              </motion.div>

            ) : (

              /* ================= REAL CLOSET ================= */
              <AnimatePresence>
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="relative w-full mx-auto"
                >

                  {/* ================= TOP CROWN ================= */}
                  <div className="relative z-20 w-full">

                    <div className="h-2 mx-1 rounded-t-sm bg-[#65432B] shadow-md" />

                    <div
                      className="h-9 mx-1 rounded-t-xl border-x border-[#795334] shadow-lg"
                      style={{
                        backgroundImage:
                          `${WOOD_GRAIN}, linear-gradient(to bottom, #D0A273, #A9784E)`,
                        backgroundSize:
                          '300px 60px, cover',
                      }}
                    />

                    <div className="h-1 mx-1 bg-[#E2BD91] shadow-sm" />

                  </div>

                  {/* ================= OUTER CABINET ================= */}
                  <div
                    className="relative w-full px-3 py-3 border-x-[10px] border-[#795334] shadow-2xl"
                    style={{
                      backgroundImage: `
                        linear-gradient(
                          to right,
                          rgba(70,40,20,0.12),
                          transparent 5%,
                          transparent 95%,
                          rgba(70,40,20,0.12)
                        ),
                        ${WOOD_GRAIN},
                        linear-gradient(
                          to bottom right,
                          #B9875C,
                          #8D6040
                        )
                      `,
                      backgroundSize:
                        '100% 100%, 300px 60px, cover',
                    }}
                  >

                    {/* ================= INNER CABINET ================= */}
                    <div className="relative rounded-md bg-[#3B271C] p-3 shadow-[inset_0_0_25px_rgba(0,0,0,0.6)]">

                      <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

                      {/* ================= CATEGORY SELECTOR ================= */}
                      <div className="relative z-10 mb-5">

                        <div className="flex items-center justify-center gap-7 px-3 pt-1 border-b border-[#795334]/50">

                          {parentCategories.map(
                            ({
                              key,
                              label,
                              icon: Icon,
                            }) => {
                              const isActive =
                                activeCategory === key;

                              return (
                                <button
                                  key={key}
                                  onClick={() =>
                                    setActiveCategory(key)
                                  }
                                  className={`
                                    relative flex items-center gap-1.5
                                    pb-3
                                    text-xs font-medium
                                    whitespace-nowrap
                                    transition-all
                                    ${
                                      isActive
                                        ? 'text-[#F4D9B8]'
                                        : 'text-[#C8A27F] hover:text-[#F0D4B5]'
                                    }
                                  `}
                                >

                                  <Icon
                                    className={`w-3.5 h-3.5 ${
                                      isActive
                                        ? 'text-pink-400'
                                        : 'text-[#A77B57]'
                                    }`}
                                  />

                                  {label}

                                  {isActive && (
                                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-pink-500 rounded-full" />
                                  )}

                                </button>
                              );
                            }
                          )}

                        </div>
                      </div>

                      {/* ================= CLOTHING SHELVES ================= */}
                      {Object.entries(visibleGroups).map(
                        ([key, rawItems]) => {

                          if (rawItems.length === 0) {
                            return null;
                          }

                          const groupItems =
                            filterBySubcategory(
                              rawItems,
                              key
                            );

                          return (
                            <div
                              key={key}
                              className="mb-6 last:mb-1"
                            >

                              {/* ================= SHELF LABEL ================= */}
                              <div className="relative flex items-center gap-2 mb-2">

                                <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_6px_rgba(236,72,153,0.6)]" />

                                <div className="px-3 py-1 rounded-sm bg-[#E8C9A4] border border-[#94633F] shadow-md">
                                  <p className="text-[10px] font-bold text-[#4B2E1F] uppercase tracking-[0.18em]">
                                    {shelfLabels[key]}
                                  </p>
                                </div>

                                <div className="flex-1 h-px bg-[#C18D63]/50" />

                                <span className="text-[10px] text-[#E2C3A1]">
                                  {groupItems.length}{' '}
                                  {groupItems.length === 1
                                    ? 'item'
                                    : 'items'}
                                </span>

                              </div>

                              {/* ================= SUBCATEGORY FILTERS ================= */}
                              {CLOTHING_TAXONOMY[key] && (
                                <div className="flex flex-wrap gap-1.5 px-1 pb-2">

                                  <button
                                    onClick={() =>
                                      setActiveSubcategories(
                                        (prev) => ({
                                          ...prev,
                                          [key]: 'all',
                                        })
                                      )
                                    }
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium capitalize transition ${
                                      (
                                        activeSubcategories[key] ||
                                        'all'
                                      ) === 'all'
                                        ? 'bg-pink-600 text-white shadow-sm'
                                        : 'bg-[#F0DCC5]/90 text-[#5A3D24] hover:bg-white'
                                    }`}
                                  >
                                    All
                                  </button>

                                  {CLOTHING_TAXONOMY[key].map(
                                    (sub) => (
                                      <button
                                        key={sub}
                                        onClick={() =>
                                          setActiveSubcategories(
                                            (prev) => ({
                                              ...prev,
                                              [key]: sub,
                                            })
                                          )
                                        }
                                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium capitalize transition ${
                                          activeSubcategories[key] ===
                                          sub
                                            ? 'bg-pink-600 text-white shadow-sm'
                                            : 'bg-[#F0DCC5]/90 text-[#5A3D24] hover:bg-white'
                                        }`}
                                      >
                                        {sub}
                                      </button>
                                    )
                                  )}

                                </div>
                              )}

                              {/* ================= RECESSED SHELF ================= */}
                              <div className="relative">

                                <div className="absolute inset-0 rounded-sm bg-[#2B1B13] shadow-[inset_0_0_20px_rgba(0,0,0,0.75)]" />

                                <div className="relative min-h-[190px] bg-[#F4D9E2] p-4 pt-5 flex gap-4 overflow-x-auto shadow-[inset_0_5px_12px_rgba(0,0,0,0.2)] border-x-2 border-[#795334]">

                                  {groupItems.map((item) => (
                                    <motion.div
                                      key={item.id}
                                      whileHover={{
                                        y: -5,
                                      }}
                                      onClick={() =>
                                        handleItemClick(item)
                                      }
                                      className="relative shrink-0 w-32 h-40 bg-white border border-[#E5BFCB] flex items-center justify-center p-2.5 shadow-[0_5px_10px_rgba(0,0,0,0.18)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.25)] transition-all cursor-pointer rounded-sm"
                                    >

                                      <div className="absolute inset-x-2 top-0 h-1 bg-pink-200 rounded-full" />

                                      <img
                                        src={item.image_url}
                                        alt={
                                          item.subcategory ||
                                          item.category
                                        }
                                        className="max-h-full max-w-full object-contain"
                                      />

                                    </motion.div>
                                  ))}

                                  {groupItems.length === 0 && (
                                    <p className="text-xs text-[#6A4630] py-4 px-2">
                                      No items in this subcategory yet.
                                    </p>
                                  )}

                                </div>

                                {/* ================= SHELF FRONT ================= */}
                                <div
                                  className="relative h-5 border-t-2 border-[#D9AB7A] shadow-[0_6px_8px_rgba(0,0,0,0.35)]"
                                  style={{
                                    backgroundImage: `
                                      ${WOOD_GRAIN},
                                      linear-gradient(
                                        to bottom,
                                        #B47F54,
                                        #795033
                                      )
                                    `,
                                    backgroundSize:
                                      '300px 60px, cover',
                                  }}
                                >

                                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#E4BC91]/80" />

                                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#4A2E20]" />

                                </div>

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>
                  </div>

                  {/* ================= SIDE POSTS ================= */}
                  <div className="pointer-events-none absolute top-10 bottom-4 left-0 w-4 bg-gradient-to-r from-[#65432B] via-[#A87850] to-[#795334] rounded-sm shadow-lg" />

                  <div className="pointer-events-none absolute top-10 bottom-4 right-0 w-4 bg-gradient-to-l from-[#65432B] via-[#A87850] to-[#795334] rounded-sm shadow-lg" />

                  {/* ================= BOTTOM PLINTH ================= */}
                  <div className="relative z-20 w-full">

                    <div className="h-3 mx-1 bg-gradient-to-b from-[#90603E] to-[#62402B] shadow-md" />

                    <div
                      className="h-7 mx-0 rounded-b-lg border-x border-[#65432B] shadow-xl"
                      style={{
                        backgroundImage:
                          `${WOOD_GRAIN}, linear-gradient(to bottom, #9D6944, #65412B)`,
                        backgroundSize:
                          '300px 60px, cover',
                      }}
                    />

                    <div className="h-2 mx-4 rounded-b-sm bg-[#432A1D] shadow-lg" />

                  </div>

                </motion.div>
              </AnimatePresence>
            )}

          </div>
        </div>
      </div>

      {/* Item modal */}
      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onDeleted={(id) =>
          setItems((prev) =>
            prev.filter((i) => i.id !== id)
          )
        }
      />
    </div>
  );
}