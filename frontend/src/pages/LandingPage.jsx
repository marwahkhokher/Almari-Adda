import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShoppingBag, ArrowRight, Footprints, Gem } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

const BG_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg transform='rotate(-10 100 100)' fill='none' stroke='%23D4537E' stroke-width='2'%3E%3Cpath d='M28 18l-8 6-8-6-8 6v8l8-2v22h16V26l8 2v-8z'/%3E%3Cg transform='translate(90 10)'%3E%3Cpath d='M2 2h26v14l-6 2v50h-6V34l-2 2-2-2v34h-6V18l-6-2z'/%3E%3C/g%3E%3Cg transform='translate(20 100)'%3E%3Cpath d='M2 20c0-10 8-18 18-18s18 8 18 18H2z'/%3E%3Cellipse cx='20' cy='20' rx='24' ry='4'/%3E%3C/g%3E%3Cg transform='translate(110 105)'%3E%3Ccircle cx='8' cy='10' r='8'/%3E%3Ccircle cx='32' cy='10' r='8'/%3E%3Cpath d='M16 10h8M0 8l-6-4M40 8l6-4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

function DoorPanel({ children, className, style, animate, transition }) {
  return (
    <motion.div className={className} style={style} animate={animate} transition={transition}>
      <div className="w-full h-full border-2 border-neutral-600 rounded-lg m-2 flex items-center justify-center relative bg-neutral-800">
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-neutral-600 rounded-tl-md" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-neutral-600 rounded-bl-md" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-neutral-600 rounded-tr-md" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-neutral-600 rounded-br-md" />
        {children}
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleOpenCloset = () => {
    if (isOpen) return;
    setIsOpen(true);

    setTimeout(() => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  }, 1600);
  };   // <-- THIS WAS MISSING

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.16]"
        style={{ backgroundImage: BG_PATTERN, backgroundSize: '200px 200px' }}
      />

      {/* Header prompt before opening */}
      <motion.div
        className="text-center z-10 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-pink-600" />
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Welcome to</span>
          <Sparkles className="w-5 h-5 text-pink-600" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-neutral-900">Almari Adda</h1>
        <p className="text-neutral-500 text-sm md:text-base mt-1">Your virtual closet and AI stylist</p>
      </motion.div>

      {/* Interactive closet, centered */}
      <div
        className="relative z-20 cursor-pointer"
        onClick={handleOpenCloset}
      >
        {/* Cornice / top trim */}
        <div className="w-[300px] md:w-[360px] h-4 bg-gradient-to-b from-pink-500 to-pink-700 rounded-t-md mx-auto shadow-md" />

        <div className="w-[300px] md:w-[360px] h-[400px] md:h-[460px] bg-pink-600 p-2.5">
          <div className="w-full h-full rounded-sm bg-neutral-800 flex overflow-hidden relative">
            {/* Interior revealed when doors open */}
            <div className="absolute inset-0 bg-neutral-50 flex flex-col">
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 pointer-events-none"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={isOpen ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-3 border border-pink-200">
                  <Gem className="w-8 h-8 text-pink-600" />
                </div>
                <h2 className="font-display text-xl font-bold text-neutral-900 mb-1">Stepping inside</h2>
                <p className="text-xs text-neutral-500 max-w-[180px] mb-3">
                  {user ? 'Opening your closet...' : 'Signing you in...'}
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-pink-600 animate-bounce">
                  <span>{user ? 'Entering app' : 'Signing in'}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>

              <div className="h-10 border-b border-neutral-200 flex items-center px-4">
                <div className="w-full h-1 bg-neutral-300 rounded-full" />
              </div>

              <motion.div
                className="px-3 pt-2 flex items-start justify-center gap-2"
                animate={{ opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.4, delay: isOpen ? 0.45 : 0 }}
              >
                {[
                  ['bg-pink-500', 'bg-neutral-800'],
                  ['bg-neutral-300', 'bg-pink-300'],
                  ['bg-pink-600', 'bg-neutral-900'],
                  ['bg-neutral-400', 'bg-pink-200'],
                  ['bg-pink-400', 'bg-neutral-700'],
                ].map((stack, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    {stack.map((c2, j) => (
                      <div key={j} className={`w-9 h-3 ${c2} rounded-sm`} />
                    ))}
                  </div>
                ))}
              </motion.div>

              <motion.div
                className="flex-1 px-4 pt-5 flex items-end justify-center gap-3"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={isOpen ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                {[
                  ['bg-pink-100', 'bg-pink-300', 'bg-pink-500'],
                  ['bg-neutral-200', 'bg-neutral-400', 'bg-neutral-800'],
                  ['bg-pink-200', 'bg-neutral-300', 'bg-pink-600'],
                ].map((stack, i) => (
                  <div key={i} className="flex flex-col-reverse gap-1">
                    {stack.map((c2, j) => (
                      <div key={j} className={`w-12 h-3.5 ${c2} rounded-sm`} />
                    ))}
                  </div>
                ))}
              </motion.div>

              <motion.div
                className="h-8 border-t border-neutral-200 flex items-center justify-center gap-6"
                animate={{ opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.4, delay: isOpen ? 0.6 : 0 }}
              >
                <Footprints className="w-5 h-5 text-pink-500" />
                <Footprints className="w-5 h-5 text-pink-400 scale-x-[-1]" />
              </motion.div>
            </div>

            <DoorPanel
              className="w-1/2 h-full bg-neutral-800 relative"
              style={{ transformOrigin: 'left center' }}
              animate={isOpen ? { rotateY: -100 } : { rotateY: 0 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            >
              <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-10 rounded-full bg-gradient-to-b from-pink-300 via-pink-500 to-pink-700 shadow-sm" />
            </DoorPanel>
            <DoorPanel
              className="w-1/2 h-full bg-neutral-800 relative"
              style={{ transformOrigin: 'right center' }}
              animate={isOpen ? { rotateY: 100 } : { rotateY: 0 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            >
              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-10 rounded-full bg-gradient-to-b from-pink-300 via-pink-500 to-pink-700 shadow-sm" />
            </DoorPanel>
          </div>
        </div>

        {/* Drawers */}
        <div className="w-[300px] md:w-[360px] bg-neutral-800 mx-auto p-2 grid grid-cols-2 gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-9 bg-neutral-900 rounded-sm flex items-center justify-center border border-neutral-700">
              <div className="w-8 h-1.5 bg-pink-500 rounded-full" />
            </div>
          ))}
        </div>

        {/* Base / feet */}
        <div className="w-[300px] md:w-[360px] h-3 bg-pink-700 mx-auto rounded-b-md" />
        <div className="flex justify-between w-[260px] md:w-[320px] mx-auto mt-1">
          <div className="w-3 h-4 bg-neutral-700 rounded-b-sm" />
          <div className="w-3 h-4 bg-neutral-700 rounded-b-sm" />
        </div>
      </div>

      {/* CTA hint */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="z-10 mt-6 flex items-center gap-2 bg-pink-50 px-5 py-2.5 rounded-full border border-pink-200 cursor-pointer hover:bg-pink-100"
            onClick={handleOpenCloset}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ShoppingBag className="w-4 h-4 text-pink-600" />
            <span className="text-xs md:text-sm font-semibold text-neutral-900">Tap closet to open</span>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <motion.div
          className="z-10 mt-6 flex items-center gap-2 text-xs font-semibold text-pink-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span>Entering your closet</span>
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      )}
    </div>
  );
}