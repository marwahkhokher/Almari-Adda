import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';

export default function GenderSelectScreen() {
  const [selectedGender, setSelectedGender] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { setGender } = useAuth();

  const handleContinue = async () => {
    if (!selectedGender) return;
    setIsLoading(true);
    try {
      await setGender(selectedGender);
      navigate('/dashboard');
    } catch (error) {
      console.error("Failed to set gender", error);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-primary gradient-pastel flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 pattern-dots opacity-30 pointer-events-none"></div>

      <div className="w-full max-w-2xl z-10">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-white/80 px-4 py-1 rounded-full border border-accent-light/60 shadow-soft mb-3">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold text-text-secondary">Personalization</span>
          </div>
          <h1 className="font-display text-4xl text-gradient font-bold mb-2">Select Preferred Model</h1>
          <p className="text-text-secondary text-sm md:text-base">Choose a mannequin silhouette style for outfit visualization</p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Male Option */}
          <motion.div 
            variants={itemVariants}
            onClick={() => setSelectedGender('male')}
            className={`relative h-52 md:h-60 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4 ${
              selectedGender === 'male' 
                ? 'border-accent bg-white shadow-medium scale-[1.02]' 
                : 'border-surface-light bg-white/80 hover:border-accent-light hover:bg-white'
            }`}
          >
            {selectedGender === 'male' && (
              <div className="absolute top-4 right-4 bg-accent text-white p-1.5 rounded-full shadow-soft">
                <Check size={18} strokeWidth={3} />
              </div>
            )}
            <div className={`p-5 rounded-full transition-colors ${selectedGender === 'male' ? 'bg-pastel-blue text-blue-700' : 'bg-secondary text-text-muted'}`}>
              <User size={50} strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <span className="font-display font-bold text-xl text-text-primary block">Male</span>
              <span className="text-xs text-text-muted">Tailored silhouette model</span>
            </div>
          </motion.div>

          {/* Female Option */}
          <motion.div 
            variants={itemVariants}
            onClick={() => setSelectedGender('female')}
            className={`relative h-52 md:h-60 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4 ${
              selectedGender === 'female' 
                ? 'border-accent bg-white shadow-medium scale-[1.02]' 
                : 'border-surface-light bg-white/80 hover:border-accent-light hover:bg-white'
            }`}
          >
            {selectedGender === 'female' && (
              <div className="absolute top-4 right-4 bg-accent text-white p-1.5 rounded-full shadow-soft">
                <Check size={18} strokeWidth={3} />
              </div>
            )}
            <div className={`p-5 rounded-full transition-colors ${selectedGender === 'female' ? 'bg-pastel-pink text-pink-700' : 'bg-secondary text-text-muted'}`}>
              <User size={50} strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <span className="font-display font-bold text-xl text-text-primary block">Female</span>
              <span className="text-xs text-text-muted">Fitted silhouette model</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex justify-center"
        >
          <div className="w-full max-w-xs">
            <Button 
              variant="primary" 
              fullWidth 
              disabled={!selectedGender || isLoading}
              onClick={handleContinue}
              className="gradient-accent text-white font-semibold py-3 text-base shadow-soft"
            >
              {isLoading ? 'Saving...' : 'Continue to Dashboard'}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
