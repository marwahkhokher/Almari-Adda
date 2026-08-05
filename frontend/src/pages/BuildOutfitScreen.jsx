import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, Wand2, Palette, CalendarDays, Shirt } from 'lucide-react';
import { buildOutfit } from '../lib/api.js';

const BG_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg transform='rotate(-10 100 100)' fill='none' stroke='%23D4537E' stroke-width='2'%3E%3Cpath d='M28 18l-8 6-8-6-8 6v8l8-2v22h16V26l8 2v-8z'/%3E%3Cg transform='translate(90 10)'%3E%3Cpath d='M2 2h26v14l-6 2v50h-6V34l-2 2-2-2v34h-6V18l-6-2z'/%3E%3C/g%3E%3Cg transform='translate(20 100)'%3E%3Cpath d='M2 20c0-10 8-18 18-18s18 8 18 18H2z'/%3E%3Cellipse cx='20' cy='20' rx='24' ry='4'/%3E%3C/g%3E%3Cg transform='translate(110 105)'%3E%3Ccircle cx='8' cy='10' r='8'/%3E%3Ccircle cx='32' cy='10' r='8'/%3E%3Cpath d='M16 10h8M0 8l-6-4M40 8l6-4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

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

function ChipGroup({ options, selected, onToggle, label, icon: Icon, index }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      className="bg-white rounded-2xl border border-sand shadow-soft p-6 mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-pink-600" />
        </div>
        <p className="text-xs font-semibold text-ink/60 uppercase tracking-wider">{label}</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {options.map(opt => (
          <motion.button
            key={opt}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => onToggle(opt)}
            className={`px-4 py-2 rounded-full text-xs font-medium capitalize border transition-colors ${
              selected.includes(opt)
                ? 'bg-pink-600 border-pink-600 text-white shadow-sm'
                : 'bg-white border-sand text-ink/70 hover:border-pink-300'
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
  const [colors, setColors] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [formality, setFormality] = useState([]);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [hasAlternatives, setHasAlternatives] = useState(false);
  const [shownKeys, setShownKeys] = useState([]);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggle = (list, setList, value) => {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  };

  const runGenerate = async (excludeList) => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await buildOutfit({ colors, seasons, formality, exclude: excludeList });
      setResult(response.outfit);
      setMessage(response.message);
      setHasAlternatives(response.has_alternatives);
      setShownKeys(prev => [...prev, response.outfit_key]);
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
    <div className="min-h-screen bg-cream relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.12]"
        style={{ backgroundImage: BG_PATTERN, backgroundSize: '200px 200px' }}
      />

      <div className="relative z-10 flex items-center gap-3 px-6 md:px-10 py-6 border-b border-sand bg-white/70 backdrop-blur sticky top-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-ink/50 hover:text-pink-600 rounded-full hover:bg-pink-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-display text-xl font-bold text-ink">Build your own outfit</span>
      </div>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-3xl font-bold text-ink mb-2">Design your look</h1>
          <p className="text-sm text-ink/60">Pick what you're feeling, and we'll pull it from your closet.</p>
        </motion.div>

        <ChipGroup index={0} icon={Palette} options={COLORS} selected={colors} onToggle={v => toggle(colors, setColors, v)} label="Colors" />
        <ChipGroup index={1} icon={CalendarDays} options={SEASONS} selected={seasons} onToggle={v => toggle(seasons, setSeasons, v)} label="Season" />
        <ChipGroup index={2} icon={Shirt} options={FORMALITY} selected={formality} onToggle={v => toggle(formality, setFormality, v)} label="Style" />

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
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold bg-pink-600 hover:bg-pink-700 text-white transition-colors disabled:opacity-50 shadow-soft"
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
              className="mt-4 text-sm text-red-600 text-center"
            >
              {error}
            </motion.p>
          )}

          {message && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 text-sm text-clay text-center bg-sand/60 rounded-lg py-2 px-3"
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
                      className="border border-sand rounded-2xl p-4 bg-white shadow-soft"
                    >
                      <img src={item.image_url} alt={item.subcategory} className="w-full aspect-square object-contain" />
                      <p className="text-xs text-center mt-3 capitalize text-ink/60">{item.subcategory}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  whileHover={{ y: -6 }}
                  className="max-w-[240px] mx-auto border border-sand rounded-2xl p-4 bg-white shadow-soft"
                >
                  <img src={result.item.image_url} alt={result.item.subcategory} className="w-full aspect-square object-contain" />
                  <p className="text-xs text-center mt-3 capitalize text-ink/60">{result.item.subcategory}</p>
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
                  className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border border-pink-600 text-pink-600 hover:bg-pink-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Finding another...' : 'Show me another'}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}