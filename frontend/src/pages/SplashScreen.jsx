import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gem, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function SplashScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleOpenWardrobe = () => {
    if (isOpen) return;
    setIsOpen(true);

    setTimeout(() => {
      if (user) {
        if (!user.user_metadata?.gender) {
          navigate('/gender-select');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/auth');
      }
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-primary gradient-pastel flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      <div className="absolute inset-0 pattern-dots opacity-40 pointer-events-none"></div>

      {/* Ambient background glow */}
      <div className="absolute w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl pointer-events-none animate-pulse-soft"></div>

      {/* Header Prompt before opening */}
      <motion.div 
        className="text-center z-10 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">Welcome to</span>
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl text-gradient font-bold">Almari Adda</h1>
        <p className="text-text-secondary text-sm md:text-base mt-1">Your Virtual Closet & AI Stylist</p>
      </motion.div>

      {/* 3D Interactive Wardrobe Container */}
      <div 
        className="perspective-1000 w-full max-w-[340px] md:max-w-[400px] h-[480px] md:h-[530px] relative cursor-pointer group z-20"
        onClick={handleOpenWardrobe}
      >
        {/* Wardrobe Outer Frame / Cabinet Box */}
        <div className="w-full h-full rounded-3xl bg-[#E8DDD4] border-[6px] border-[#D8C7B9] shadow-elevated relative overflow-hidden flex">
          
          {/* INTERIOR OF WARDROBE (Revealed when doors open) */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF9] to-[#F3ECE4] p-6 flex flex-col items-center justify-center text-center">
            
            {/* Interior Clothes Hangers / Rack Animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={isOpen ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 rounded-full bg-accent/15 flex items-center justify-center mb-4 border border-accent/30 shadow-glow">
                <Gem className="w-12 h-12 text-accent" />
              </div>
              <h2 className="font-display text-2xl font-bold text-text-primary mb-1">Step Inside</h2>
              <p className="text-xs text-text-secondary max-w-[200px] mb-4">Opening your personal wardrobe...</p>
              <div className="flex items-center gap-2 text-xs font-semibold text-accent animate-bounce">
                <span>Entering App</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          </div>

          {/* LEFT DOOR */}
          <motion.div 
            className="w-1/2 h-full bg-[#FAF5EF] border-r border-[#E0D2C4] shadow-md z-30 flex flex-col justify-between p-4 relative origin-left"
            style={{ transformStyle: 'preserve-3d' }}
            animate={isOpen ? { rotateY: -115 } : { rotateY: 0 }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Elegant Door Trim / Moulding Frame */}
            <div className="w-full h-full border-2 border-[#EADCCF] rounded-xl flex flex-col justify-center items-end pr-2 relative">
              <div className="absolute top-6 left-3 w-8 h-8 border-t-2 border-l-2 border-[#D8C7B9] rounded-tl-md"></div>
              <div className="absolute bottom-6 left-3 w-8 h-8 border-b-2 border-l-2 border-[#D8C7B9] rounded-bl-md"></div>
              
              {/* Left Handle (Crystal/Gold Knob) */}
              <div className="w-4 h-12 rounded-full bg-gradient-to-r from-[#E6CA7E] via-[#FFF1B8] to-[#C4A24A] shadow-md border border-[#B8963D] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-inner"></div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT DOOR */}
          <motion.div 
            className="w-1/2 h-full bg-[#FAF5EF] border-l border-[#E0D2C4] shadow-md z-30 flex flex-col justify-between p-4 relative origin-right"
            style={{ transformStyle: 'preserve-3d' }}
            animate={isOpen ? { rotateY: 115 } : { rotateY: 0 }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Elegant Door Trim / Moulding Frame */}
            <div className="w-full h-full border-2 border-[#EADCCF] rounded-xl flex flex-col justify-center items-start pl-2 relative">
              <div className="absolute top-6 right-3 w-8 h-8 border-t-2 border-r-2 border-[#D8C7B9] rounded-tr-md"></div>
              <div className="absolute bottom-6 right-3 w-8 h-8 border-b-2 border-r-2 border-[#D8C7B9] rounded-br-md"></div>

              {/* Right Handle (Crystal/Gold Knob) */}
              <div className="w-4 h-12 rounded-full bg-gradient-to-r from-[#C4A24A] via-[#FFF1B8] to-[#E6CA7E] shadow-md border border-[#B8963D] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-inner"></div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Interactive Call-To-Action Hint */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div 
            className="z-10 mt-6 flex items-center gap-2 bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-accent-light/60 shadow-soft cursor-pointer hover:bg-white"
            onClick={handleOpenWardrobe}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-xs md:text-sm font-semibold text-text-primary">Tap Wardrobe to Open</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
