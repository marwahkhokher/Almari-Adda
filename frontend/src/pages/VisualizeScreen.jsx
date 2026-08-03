import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getCatalogue } from '../lib/api.js';
import Header from '../components/layout/Header.jsx';
import Badge from '../components/ui/Badge.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';

export default function VisualizeScreen() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  
  const navigate = useNavigate();
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
        <svg viewBox="0 0 100 250" className="w-[65%] h-auto max-h-[85%] stroke-accent fill-accent-light/30 stroke-[2.5]" style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <path d="M50,15 C45,15 40,20 40,27 C40,34 45,39 50,39 C55,39 60,34 60,27 C60,20 55,15 50,15 Z" />
          <path d="M43,38 C35,42 28,45 25,50 C22,55 22,90 22,90 L28,90 C28,90 32,55 35,52 C35,52 32,85 30,120 C30,120 38,125 40,95 C40,95 38,120 38,125 C45,130 55,130 62,125 C62,120 60,95 60,95 C62,125 70,120 70,120 C68,85 65,52 65,52 C68,55 72,90 72,90 L78,90 C78,90 78,55 75,50 C72,45 65,42 57,38" />
          <path d="M40,95 C35,140 32,190 32,230 L45,230 C45,190 48,150 50,125 C52,150 55,190 55,230 L68,230 C68,190 65,140 60,95" />
        </svg>
      );
    } else if (gender === 'male') {
      return (
        <svg viewBox="0 0 100 250" className="w-[65%] h-auto max-h-[85%] stroke-accent fill-accent-light/30 stroke-[2.5]" style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <path d="M50,15 C44,15 39,20 39,27 C39,34 44,39 50,39 C56,39 61,34 61,27 C61,20 56,15 50,15 Z" />
          <path d="M41,38 C32,41 22,43 18,48 C15,53 18,95 18,95 L25,95 C25,95 28,60 30,55 C30,55 32,80 32,110 C32,110 38,115 42,90 C42,90 40,110 40,115 C45,118 55,118 60,115 C60,110 58,90 58,90 C62,115 68,110 68,110 C68,80 70,55 70,55 C72,60 75,95 75,95 L82,95 C82,95 85,53 82,48 C78,43 68,41 59,38" />
          <path d="M42,90 C38,135 35,185 35,235 L48,235 C48,190 48,140 50,120 C52,140 52,190 52,235 L65,235 C65,185 62,135 58,90" />
        </svg>
      );
    } else {
      return (
        <svg viewBox="0 0 100 250" className="w-[65%] h-auto max-h-[85%] stroke-accent fill-accent-light/30 stroke-[2.5]" style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <circle cx="50" cy="25" r="12" />
          <path d="M35,45 C25,50 25,90 25,90 L32,90 C32,90 35,60 38,55 L38,120 C42,125 58,125 62,120 L62,55 C65,60 68,90 68,90 L75,90 C75,90 75,50 65,45" />
          <path d="M40,105 L35,230 L48,230 L50,140 L52,230 L65,230 L60,105" />
        </svg>
      );
    }
  };

  return (
    <div className="min-h-screen bg-primary gradient-pastel flex flex-col">
      <Header 
        title="Visualize" 
        showBack={true} 
      />

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-accent-light/60 shadow-soft mb-2">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-text-secondary">Virtual Try-On</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient">Outfit Canvas</h1>
            <p className="text-text-secondary text-sm">Preview selected wardrobe items on your mannequin model.</p>
          </div>
          <Badge variant="pink" className="text-xs px-3 py-1 font-semibold">
            In Development
          </Badge>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-surface-light p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-medium">
          
          <div className="flex flex-col gap-4">
            <div className="aspect-[3/4] bg-secondary/60 rounded-2xl border border-surface-light relative overflow-hidden flex flex-col items-center justify-center p-4">
              
              {renderSilhouette()}
              
              <div className="absolute top-4 left-4">
                <Badge variant="neutral" className="bg-white/90 text-accent-hover border-surface-light text-xs font-semibold capitalize shadow-soft">
                  Model: {gender}
                </Badge>
              </div>

              {selectedItems.length === 0 && (
                <p className="absolute bottom-12 text-text-muted text-xs text-center font-medium bg-white/70 backdrop-blur px-4 py-1.5 rounded-full border border-surface-light">
                  Select items from your wardrobe to preview
                </p>
              )}

              {selectedItems.length > 0 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center flex-wrap gap-2 px-4">
                  {selectedItems.map(item => (
                    <div key={item.id} className="bg-white/90 text-accent-hover border border-accent-light rounded-full px-3 py-1 text-xs font-semibold truncate max-w-[130px] shadow-soft">
                      {item.subcategory || item.category}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col h-full max-h-[70vh]">
            <h3 className="text-text-primary text-sm font-bold mb-3 font-display">Select Wardrobe Items</h3>
            
            {isLoading ? (
              <div className="flex-1 flex justify-center items-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-surface-light rounded-2xl">
                <p className="text-text-muted mb-2 text-sm font-medium">Your wardrobe is empty.</p>
                <p className="text-text-muted text-xs">Upload items first to preview them here.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {items.map(item => {
                    const isSelected = selectedItems.some(i => i.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item)}
                        className={`relative aspect-square rounded-2xl bg-secondary/50 border overflow-hidden transition-all duration-200 ${
                          isSelected 
                            ? 'ring-2 ring-accent border-transparent shadow-medium scale-95' 
                            : 'border-surface-light hover:border-accent-light'
                        }`}
                      >
                        <img 
                          src={item.image_url} 
                          alt={item.subcategory || item.category} 
                          className="w-full h-full object-contain p-1.5 filter drop-shadow-sm"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-accent/15"></div>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-white shadow-soft">
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
