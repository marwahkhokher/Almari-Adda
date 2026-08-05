import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, Sparkles, ArrowLeft, LayoutGrid, Shirt, PanelBottom,
  Gem, Layers, ShoppingBag, Upload, Image as ImageIcon, X, WandSparkles
} from 'lucide-react';
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
  subs.forEach(sub => { SUBCATEGORY_TO_CATEGORY[sub] = category; });
});

const parentCategories = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'top', label: 'Top', icon: Shirt },
  { key: 'bottom', label: 'Bottom', icon: PanelBottom },
  { key: 'dress', label: 'Dress', icon: Gem },
  { key: 'eastern wear', label: 'Eastern wear', icon: Layers },
  { key: 'other', label: 'Other', icon: ShoppingBag },
];

export default function VisualizeScreen() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState('all');
  const [userPhoto, setUserPhoto] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

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
    if (userPhoto) URL.revokeObjectURL(userPhoto);
    setUserPhoto(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    if (userPhoto) URL.revokeObjectURL(userPhoto);
    setUserPhoto(null);
  };

  const handleCategoryChange = category => {
    setActiveCategory(category);
    setActiveSubcategory('all');
  };

  const toggleItem = item => {
    if (selectedItems.some(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleGenerate = async () => {
    if (!userPhoto || selectedItems.length === 0) return;

    setIsGenerating(true);

    try {
      // TODO: Connect this to your virtual try-on API.
      // You will send:
      // 1. userPhoto
      // 2. selectedItems
      //
      // Example:
      // const result = await generateOutfit(userPhoto, selectedItems);

      console.log('Generating outfit:', {
        photo: userPhoto,
        items: selectedItems.map(item => ({
          id: item.id,
          category: item.category,
          subcategory: item.subcategory,
          image_url: item.image_url,
        })),
      });

      // Temporary delay so the loading state can be seen.
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to generate outfit', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredItems = items.filter(item => {
    const sub = item.subcategory?.toLowerCase() || '';
    const category = SUBCATEGORY_TO_CATEGORY[sub] || 'other';

    if (activeCategory !== 'all' && category !== activeCategory) return false;
    if (activeSubcategory !== 'all' && sub !== activeSubcategory) return false;

    return true;
  });

  const availableSubcategories =
    activeCategory !== 'all' && CLOTHING_TAXONOMY[activeCategory]
      ? CLOTHING_TAXONOMY[activeCategory]
      : [];

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.1]"
        style={{ backgroundImage: BG_PATTERN, backgroundSize: '200px 200px' }}
      />

      <div className="relative z-10 flex items-center gap-3 px-6 py-4 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-neutral-500 hover:text-pink-600 transition-colors rounded-full hover:bg-pink-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-display text-lg font-bold text-neutral-900">Visualize</span>
      </div>

      <main className="relative z-10 flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-pink-50 px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-pink-600" />
              <span className="text-xs font-semibold text-pink-700">Virtual try-on</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-neutral-900">
              Outfit canvas
            </h1>
            <p className="text-neutral-500 text-sm">
              Upload a photo and select pieces from your wardrobe.
            </p>
          </div>
        </div>

        <div className="bg-pink-50/70 backdrop-blur-xl rounded-2xl border border-pink-300 shadow-lg p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <div className="aspect-[3/4] bg-neutral-50 rounded-xl border border-neutral-200 relative overflow-hidden flex items-center justify-center">
              {!userPhoto ? (
                <div className="flex flex-col items-center justify-center text-center px-8">
                  <div className="w-16 h-16 rounded-2xl bg-pink-100 flex items-center justify-center mb-5">
                    <ImageIcon className="w-8 h-8 text-pink-600" />
                  </div>
                  <h2 className="text-lg font-display font-bold text-neutral-900 mb-2">
                    Visualize your outfit
                  </h2>
                  <p className="text-sm text-neutral-500 max-w-xs mb-6">
                    Upload a full body photo to see how your selected wardrobe pieces look together.
                  </p>
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5">
                    <Upload className="w-4 h-4" />
                    Upload photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                  <p className="text-[11px] text-neutral-400 mt-3">JPG, PNG or WEBP</p>
                </div>
              ) : (
                <>
                  <img
                    src={userPhoto}
                    alt="Uploaded model"
                    className="w-full h-full object-contain"
                  />

                  <div className="absolute top-4 left-4">
                    <span className="bg-white/95 text-neutral-700 border border-neutral-200 text-xs font-semibold shadow-sm px-3 py-1.5 rounded-full">
                      Your photo
                    </span>
                  </div>

                  <label className="absolute bottom-4 left-4 cursor-pointer flex items-center gap-2 bg-white/95 hover:bg-white text-neutral-700 border border-neutral-200 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition">
                    <Upload className="w-3.5 h-3.5" />
                    Change photo
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>

                  <button
                    onClick={removePhoto}
                    className="absolute top-4 right-4 w-8 h-8 bg-white/95 hover:bg-white text-neutral-600 hover:text-red-500 border border-neutral-200 rounded-full flex items-center justify-center shadow-sm transition"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col h-full max-h-[70vh]">
            <h3 className="text-neutral-900 text-sm font-bold mb-3 font-display">
              Select wardrobe items
            </h3>

            <div className="flex gap-4 mb-3 border-b border-neutral-200 overflow-x-auto">
              {parentCategories.map(({ key, label, icon: Icon }) => {
                const isActive = activeCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleCategoryChange(key)}
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

            {availableSubcategories.length > 0 && (
              <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveSubcategory('all')}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium transition ${
                    activeSubcategory === 'all'
                      ? 'bg-pink-600 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-500 hover:border-pink-300 hover:text-pink-600'
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
                        ? 'bg-pink-600 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-500 hover:border-pink-300 hover:text-pink-600'
                    }`}
                  >
                    {subcategory}
                  </button>
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="flex-1 flex justify-center items-center">
                <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-200 rounded-xl">
                <p className="text-neutral-500 mb-2 text-sm font-medium">Your wardrobe is empty.</p>
                <p className="text-neutral-400 text-xs">Upload items first to preview them here.</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-200 rounded-xl">
                <p className="text-neutral-500 mb-2 text-sm font-medium">No items found.</p>
                <p className="text-neutral-400 text-xs">Try another category or subcategory.</p>
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

                        {isSelected && <div className="absolute inset-0 bg-pink-600/10" />}

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

            {/* GENERATE BUTTON */}
            <button
              onClick={handleGenerate}
              disabled={!userPhoto || selectedItems.length === 0 || isGenerating}
              className={`mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                !userPhoto || selectedItems.length === 0 || isGenerating
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : 'bg-pink-600 hover:bg-pink-700 text-white hover:-translate-y-0.5'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Generating outfit...
                </>
              ) : (
                <>
                  <WandSparkles className="w-4 h-4" />
                  Generate outfit
                </>
              )}
            </button>

            {!userPhoto && (
              <p className="text-[11px] text-neutral-400 text-center mt-2">
                Upload a photo first
              </p>
            )}

            {userPhoto && selectedItems.length === 0 && (
              <p className="text-[11px] text-neutral-400 text-center mt-2">
                Select at least one wardrobe item
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}