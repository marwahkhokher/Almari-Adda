import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, ArrowLeft, LayoutGrid, Shirt, PanelBottom, Gem, Layers, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getCatalogue } from '../lib/api.js';

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

const parentCategories = [
  { key: 'all', label: 'All', icon: 'LayoutGrid' },
  { key: 'top', label: 'Top', icon: 'Shirt' },
  { key: 'bottom', label: 'Bottom', icon: 'PanelBottom' },
  { key: 'dress', label: 'Dress', icon: 'Gem' },
  { key: 'eastern wear', label: 'Eastern wear', icon: 'Layers' },
  { key: 'other', label: 'Other', icon: 'ShoppingBag' },
];

export default function VisualizeScreen() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [userPhoto, setUserPhoto] = useState(null);

  const navigate = useNavigate();

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUserPhoto(url);
    }
  };
  const { gender: userGenderContext, user } = useAuth();

  const gender = (userGenderContext || user?.user_metadata?.gender || 'generic').toLowerCase();

  useEffect(() => {
    const fetchCatalogue = async () => {
      setIsLoading(true);
      try {
        const response = await getCatalogue();
        const catalogueItems = response?.items || response?.data || response || [];
        setItems(Array.isArray(catalogueItems) ? catalogueItems : []);
      } catch (error) {
        console.error("Failed to load wardrobe for visualization", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalogue();
  }, []);

  const toggleItem = (item) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const renderSilhouette = () => {
    if (gender === 'female') {
      return (
        <svg viewBox="0 0 100 250" className="w-[65%] h-auto max-h-[85%] stroke-pink-600 fill-pink-100 stroke-[2.5]" style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <path d="M50,15 C45,15 40,20 40,27 C40,34 45,39 50,39 C55,39 60,34 60,27 C60,20 55,15 50,15 Z" />
          <path d="M43,38 C35,42 28,45 25,50 C22,55 22,90 22,90 L28,90 C28,90 32,55 35,52 C35,52 32,85 30,120 C30,120 38,125 40,95 C40,95 38,120 38,125 C45,130 55,130 62,125 C62,120 60,95 60,95 C62,125 70,120 70,120 C68,85 65,52 65,52 C68,55 72,90 72,90 L78,90 C78,90 78,55 75,50 C72,45 65,42 57,38" />
          <path d="M40,95 C35,140 32,190 32,230 L45,230 C45,190 48,150 50,125 C52,150 55,190 55,230 L68,230 C68,190 65,140 60,95" />
        </svg>
      );
    } else if (gender === 'male') {
      return (
        <svg viewBox="0 0 100 250" className="w-[65%] h-auto max-h-[85%] stroke-pink-600 fill-pink-100 stroke-[2.5]" style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <path d="M50,15 C44,15 39,20 39,27 C39,34 44,39 50,39 C56,39 61,34 61,27 C61,20 56,15 50,15 Z" />
          <path d="M41,38 C32,41 22,43 18,48 C15,53 18,95 18,95 L25,95 C25,95 28,60 30,55 C30,55 32,80 32,110 C32,110 38,115 42,90 C42,90 40,110 40,115 C45,118 55,118 60,115 C60,110 58,90 58,90 C62,115 68,110 68,110 C68,80 70,55 70,55 C72,60 75,95 75,95 L82,95 C82,95 85,53 82,48 C78,43 68,41 59,38" />
          <path d="M42,90 C38,135 35,185 35,235 L48,235 C48,190 48,140 50,120 C52,140 52,190 52,235 L65,235 C65,185 62,135 58,90" />
        </svg>
      );
    } else {
      return (
        <svg viewBox="0 0 100 250" className="w-[65%] h-auto max-h-[85%] stroke-pink-600 fill-pink-100 stroke-[2.5]" style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <circle cx="50" cy="25" r="12" />
          <path d="M35,45 C25,50 25,90 25,90 L32,90 C32,90 35,60 38,55 L38,120 C42,125 58,125 62,120 L62,55 C65,60 68,90 68,90 L75,90 C75,90 75,50 65,45" />
          <path d="M40,105 L35,230 L48,230 L50,140 L52,230 L65,230 L60,105" />
        </svg>
      );
    }
  };

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter((item) => {
        const sub = item.subcategory?.toLowerCase() || '';
        const category = SUBCATEGORY_TO_CATEGORY[sub] || 'other';
        return category === activeCategory;
      });

  const icons = { LayoutGrid, Shirt, PanelBottom, Gem, Layers, ShoppingBag };

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.1]"
        style={{ backgroundImage: BG_PATTERN, backgroundSize: '200px 200px' }}
      />
      <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-200">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-neutral-500 hover:text-pink-600 transition-colors rounded-full hover:bg-pink-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-display text-lg font-bold text-neutral-900">Visualize</span>
      </div>

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-pink-50 px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-pink-600" />
              <span className="text-xs font-semibold text-pink-700">Virtual try-on</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-neutral-900">Outfit canvas</h1>
            <p className="text-neutral-500 text-sm">Preview selected wardrobe items on your mannequin model.</p>
          </div>
          <span className="text-xs px-3 py-1 font-semibold bg-pink-100 text-pink-700 rounded-full">
            In development
          </span>
        </div>

        <div className="bg-pink-50/70 backdrop-blur-xl rounded-2xl border border-pink-300 shadow-lg p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Mannequin canvas */}
          <div className="flex flex-col gap-4">
            <div className="aspect-[3/4] bg-neutral-50 rounded-xl border border-neutral-200 relative overflow-hidden flex flex-col items-center justify-center p-4">

              {renderSilhouette()}

              <div className="absolute top-4 left-4">
                <span className="bg-white text-pink-700 border border-pink-200 text-xs font-semibold capitalize shadow-sm px-2.5 py-1 rounded-full">
                  Model: {gender}
                </span>
              </div>

              {selectedItems.length === 0 && (
                <p className="absolute bottom-12 text-neutral-500 text-xs text-center font-medium bg-white px-4 py-1.5 rounded-full border border-neutral-200">
                  Select items from your wardrobe to preview
                </p>
              )}

              {selectedItems.length > 0 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center flex-wrap gap-2 px-4">
                  {selectedItems.map(item => (
                    <div key={item.id} className="bg-white text-pink-700 border border-pink-200 rounded-full px-3 py-1 text-xs font-semibold truncate max-w-[130px] shadow-sm">
                      {item.subcategory || item.category}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Wardrobe item picker */}
          <div className="flex flex-col h-full max-h-[70vh]">
            <h3 className="text-neutral-900 text-sm font-bold mb-3 font-display">Select wardrobe items</h3>

            <div className="flex gap-4 mb-4 border-b border-neutral-200 overflow-x-auto">
              {parentCategories.map(({ key, label, icon }) => {
                const Icon = icons[icon];
                const isActive = activeCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={`flex items-center gap-1.5 pb-2 text-xs font-medium whitespace-nowrap border-b-2 transition ${
                      isActive
                        ? 'text-pink-600 border-pink-600'
                        : 'text-neutral-400 border-transparent hover:text-neutral-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>

            {isLoading ? (
              <div className="flex-1 flex justify-center items-center">
                <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-200 rounded-xl">
                <p className="text-neutral-500 mb-2 text-sm font-medium">Your wardrobe is empty.</p>
                <p className="text-neutral-400 text-xs">Upload items first to preview them here.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {filteredItems.map(item => {
                    const isSelected = selectedItems.some(i => i.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item)}
                        className={`relative aspect-square rounded-xl bg-neutral-50 border overflow-hidden transition-all duration-200 ${
                          isSelected
                            ? 'ring-2 ring-pink-600 border-transparent shadow-md scale-95'
                            : 'border-neutral-200 hover:border-pink-300'
                        }`}
                      >
                        <img
                          src={item.image_url}
                          alt={item.subcategory || item.category}
                          className="w-full h-full object-contain p-1.5"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-pink-600/10" />
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center text-white shadow-sm">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
