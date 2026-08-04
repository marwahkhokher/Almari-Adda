import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShoppingBag, ArrowRight, Footprints, Gem } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

const BG_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg transform='rotate(-10 100 100)' fill='none' stroke='%23D4537E' stroke-width='2'%3E%3Cpath d='M28 18l-8 6-8-6-8 6v8l8-2v22h16V26l8 2v-8z'/%3E%3Cg transform='translate(90 10)'%3E%3Cpath d='M2 2h26v14l-6 2v50h-6V34l-2 2-2-2v34h-6V18l-6-2z'/%3E%3C/g%3E%3Cg transform='translate(20 100)'%3E%3Cpath d='M2 20c0-10 8-18 18-18s18 8 18 18H2z'/%3E%3Cellipse cx='20' cy='20' rx='24' ry='4'/%3E%3C/g%3E%3Cg transform='translate(110 105)'%3E%3Ccircle cx='8' cy='10' r='8'/%3E%3Ccircle cx='32' cy='10' r='8'/%3E%3Cpath d='M16 10h8M0 8l-6-4M40 8l6-4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

function DoorPanel({ side, open }) {
  const isLeft = side === 'left';

  return (
    <motion.div
      className={`absolute top-0 bottom-0 w-1/2 ${
        isLeft ? 'left-0' : 'right-0'
      }`}
      style={{
        transformOrigin: isLeft ? 'left center' : 'right center',
        transformStyle: 'preserve-3d',
        zIndex: 40,
      }}
      animate={{
        rotateY: open ? (isLeft ? -112 : 112) : 0,
        z: open ? 25 : 0,
      }}
      transition={{
        duration: 1,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-950 border border-neutral-600 shadow-2xl">

        <div className="absolute inset-2 border-2 border-neutral-600/80" />
        <div className="absolute inset-4 border border-neutral-500/30" />

        <div className="absolute inset-x-7 top-7 bottom-7 border-2 border-neutral-600/60 bg-gradient-to-br from-neutral-800/80 to-neutral-950/90 shadow-inner">
          <div className="absolute inset-2 border border-neutral-700/70" />
        </div>

        <div
          className={`absolute top-0 bottom-0 w-2 bg-gradient-to-b from-neutral-500 via-neutral-700 to-neutral-900 ${
            isLeft ? 'left-0' : 'right-0'
          }`}
        />

        <div
          className={`absolute top-1/2 -translate-y-1/2 ${
            isLeft ? 'right-4' : 'left-4'
          }`}
        >
          <div className="relative">
            <div className="w-2 h-16 rounded-full bg-gradient-to-b from-neutral-300 via-neutral-500 to-neutral-800 shadow-lg" />
            <div className="absolute inset-x-0 top-1 bottom-1 rounded-full bg-pink-400/40" />
          </div>
        </div>

        <div className="absolute top-3 left-3 w-8 h-8 border-t border-l border-neutral-500/50" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b border-l border-neutral-500/50" />
        <div className="absolute top-3 right-3 w-8 h-8 border-t border-r border-neutral-500/50" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b border-r border-neutral-500/50" />
      </div>
    </motion.div>
  );
}

function HangingClothes() {
  const clothes = [
    ['bg-neutral-800', 'w-10', 'h-18'],
    ['bg-neutral-400', 'w-12', 'h-21'],
    ['bg-pink-200', 'w-11', 'h-20'],
    ['bg-neutral-700', 'w-12', 'h-23'],
    ['bg-neutral-300', 'w-10', 'h-19'],
    ['bg-pink-300', 'w-12', 'h-21'],
    ['bg-neutral-600', 'w-10', 'h-18'],
    ['bg-neutral-400', 'w-11', 'h-20'],
  ];

  return (
    <div className="absolute top-9 left-8 right-8 bottom-18">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-600 via-neutral-200 to-neutral-600 rounded-full shadow-lg" />

      <div className="absolute top-1 left-2 right-2 flex justify-center gap-1">
        {clothes.map(([color, width, height], i) => (
          <motion.div
            key={i}
            className="relative flex flex-col items-center"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.05 }}
          >
            <div className="w-3 h-3 border-t-2 border-l-2 border-neutral-500 rounded-full rotate-45 -mb-1" />

            <div
              className={`${color} ${width} ${height} shadow-md`}
              style={{
                clipPath:
                  'polygon(18% 0, 38% 8%, 50% 5%, 62% 8%, 82% 0, 100% 15%, 88% 28%, 80% 20%, 80% 100%, 20% 100%, 20% 20%, 12% 28%, 0 15%)',
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ShelfContents() {
  return (
    <>
      <div className="absolute bottom-14 left-7 right-7 h-2 bg-gradient-to-b from-neutral-300 to-neutral-500 shadow-md" />

      <div className="absolute bottom-[4rem] left-8 right-8 flex items-end justify-center gap-1.5">
        <div className="w-12 h-7 bg-neutral-300 rounded-sm shadow-md" />
        <div className="w-14 h-9 bg-pink-200 rounded-sm shadow-md" />
        <div className="w-11 h-6 bg-neutral-500 rounded-sm shadow-md" />
        <div className="w-12 h-8 bg-neutral-700 rounded-sm shadow-md" />
        <div className="w-9 h-7 bg-neutral-400 rounded-sm shadow-md" />
      </div>

      {/* Bottom shelf */}
      <div className="absolute bottom-2 left-7 right-7 h-2 bg-gradient-to-b from-neutral-300 to-neutral-500 shadow-md" />

      {/* Shoes */}
      <div className="absolute bottom-4 left-0 right-0 flex items-end justify-center gap-3">
        {/* Left pair */}
        <div className="relative w-12 h-5">
          <div className="absolute bottom-0 left-0 w-10 h-3.5 bg-neutral-700 rounded-t-lg rounded-br-xl shadow-md rotate-[-5deg]" />
          <div className="absolute bottom-0 left-2 w-9 h-1.5 bg-neutral-300 rounded-full" />
        </div>

        <div className="relative w-12 h-5">
          <div className="absolute bottom-0 left-0 w-10 h-3.5 bg-neutral-800 rounded-t-lg rounded-br-xl shadow-md rotate-[-3deg]" />
          <div className="absolute bottom-0 left-2 w-9 h-1.5 bg-neutral-400 rounded-full" />
        </div>

        {/* Pink pair */}
        <div className="relative w-12 h-5">
          <div className="absolute bottom-0 left-0 w-10 h-3.5 bg-pink-300 rounded-t-lg rounded-br-xl shadow-md rotate-[4deg]" />
          <div className="absolute bottom-0 left-2 w-9 h-1.5 bg-pink-100 rounded-full" />
        </div>

        <div className="relative w-12 h-5">
          <div className="absolute bottom-0 left-0 w-10 h-3.5 bg-pink-400 rounded-t-lg rounded-br-xl shadow-md rotate-[6deg]" />
          <div className="absolute bottom-0 left-2 w-9 h-1.5 bg-pink-100 rounded-full" />
        </div>
      </div>
    </>
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
      navigate(user ? '/dashboard' : '/auth');
    }, 1750);
  };

  return (
    <div className="h-screen bg-white flex flex-col items-center justify-center px-4 py-2 relative overflow-hidden select-none">

      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.17]"
        style={{
          backgroundImage: BG_PATTERN,
          backgroundSize: '170px 170px',
        }}
      />

      {/* Header */}
      <motion.div
        className="text-center z-10 mb-4"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-pink-500" />

          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-500">
            Welcome to
          </span>

          <Sparkles className="w-4 h-4 text-pink-500" />
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-bold text-neutral-900">
          Almari Adda
        </h1>

        <p className="text-neutral-500 text-xs md:text-sm mt-0.5">
          Your virtual closet and AI stylist
        </p>
      </motion.div>

      {/* Closet */}
      <div
        className="relative z-20 cursor-pointer"
        onClick={handleOpenCloset}
        style={{
          perspective: '1600px',
          perspectiveOrigin: '50% 45%',
        }}
      >
        <div className="relative w-[315px] md:w-[405px]">

          {/* Top architectural crown */}
          <div className="relative h-6">
            <div className="absolute left-3 right-3 top-0 h-4 bg-gradient-to-b from-neutral-500 via-neutral-700 to-neutral-900 border border-neutral-600 shadow-lg" />

            <div className="absolute left-0 right-0 top-3 h-3 bg-gradient-to-b from-neutral-700 to-neutral-950 border-y border-neutral-600" />

            <div className="absolute left-6 right-6 top-2.5 h-1 bg-pink-400 rounded-full opacity-90" />
          </div>

          {/* Main cabinet */}
          <div className="relative h-[365px] md:h-[435px] bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900 p-2.5 shadow-[0_25px_60px_-18px_rgba(0,0,0,0.55)]">

            {/* Outer frame */}
            <div className="absolute inset-1 border-2 border-neutral-600" />
            <div className="absolute inset-3 border border-neutral-500/50" />

            {/* Side columns */}
            <div className="absolute left-3 top-3 bottom-3 w-5 bg-gradient-to-r from-neutral-900 via-neutral-600 to-neutral-800 border-r border-neutral-500/40" />

            <div className="absolute right-3 top-3 bottom-3 w-5 bg-gradient-to-l from-neutral-900 via-neutral-600 to-neutral-800 border-l border-neutral-500/40" />

            {/* Recessed opening */}
            <div className="absolute inset-7 bg-neutral-950 border-2 border-neutral-800 shadow-inner overflow-hidden">

              {/* Interior */}
              <div className="absolute inset-2 bg-gradient-to-b from-neutral-100 via-neutral-50 to-neutral-200 overflow-hidden">

                <div className="absolute inset-0 bg-gradient-to-r from-neutral-500/20 via-transparent to-neutral-500/20" />

                <div className="absolute top-0 left-0 right-0 h-7 bg-gradient-to-b from-neutral-400/50 to-transparent" />

                <HangingClothes />

                <ShelfContents />

                <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-neutral-500/30 to-transparent" />

                <div className="absolute top-0 bottom-0 right-0 w-3 bg-gradient-to-l from-neutral-500/30 to-transparent" />

                {/* Opening message */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center text-center z-20 pointer-events-none px-4"
                  initial={{ opacity: 0, scale: 0.85, y: 8 }}
                  animate={
                    isOpen
                      ? { opacity: 1, scale: 1, y: 0 }
                      : { opacity: 0, scale: 0.85, y: 8 }
                  }
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <div className="w-[190px] rounded-2xl bg-white/95 backdrop-blur-md border border-pink-200/90 shadow-[0_12px_35px_rgba(0,0,0,0.18)] px-5 py-4">
                    
                    {/* Gem */}
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-pink-100 flex items-center justify-center mb-2.5 border border-pink-300 shadow-[0_4px_15px_rgba(236,72,153,0.18)]">
                      <Gem className="w-7 h-7 text-pink-600" />
                    </div>

                    {/* Heading */}
                    <h2 className="font-display text-lg font-bold text-neutral-900">
                      Stepping inside
                    </h2>

                    {/* Description */}
                    <p className="text-[11px] text-neutral-500 max-w-[180px] mx-auto mt-1">
                      {user ? 'Opening your closet...' : 'Signing you in...'}
                    </p>

                    {/* Action */}
                    <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-pink-600 mt-2.5">
                      <span>{user ? 'Entering app' : 'Signing in'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>

                  </div>
                </motion.div>

                {/* Doors */}
                <DoorPanel side="left" open={isOpen} />
                <DoorPanel side="right" open={isOpen} />

              </div>
            </div>
          </div>

          {/* Drawers */}
          <div className="relative h-[72px] bg-gradient-to-b from-neutral-800 to-neutral-950 border-x-2 border-neutral-700 p-1.5">

            <div className="absolute top-0 left-5 right-5 h-px bg-neutral-500/60" />

            <div className="grid grid-cols-2 gap-2 h-full">

              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="relative bg-gradient-to-b from-neutral-700 to-neutral-900 border border-neutral-600 shadow-inner"
                >
                  <div className="absolute inset-1.5 border border-neutral-600/60" />

                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1.5 rounded-full bg-gradient-to-b from-neutral-300 via-neutral-500 to-neutral-800 shadow-lg">
                    <div className="absolute inset-x-1 top-0.5 h-px bg-pink-400/80" />
                  </div>
                </div>
              ))}

            </div>
          </div>

          {/* Plinth */}
          <div className="relative h-6 bg-gradient-to-b from-neutral-700 via-neutral-900 to-black border-x border-neutral-600 shadow-lg">

            <div className="absolute left-3 right-3 top-1 h-1 bg-neutral-500/40" />

            <div className="absolute left-8 right-8 bottom-1 h-1 bg-pink-400/70" />

          </div>

          {/* Feet */}
          <div className="flex justify-between px-6">

            <div className="w-6 h-6 bg-gradient-to-b from-neutral-700 to-black shadow-md rounded-b-sm" />

            <div className="w-6 h-6 bg-gradient-to-b from-neutral-700 to-black shadow-md rounded-b-sm" />

          </div>

        </div>
      </div>

      {/* CTA */}
      <AnimatePresence mode="wait">

        {!isOpen ? (

          <motion.div
            key="closed"
            className="z-10 mt-4 flex items-center gap-2 bg-neutral-900 text-white px-5 py-2 rounded-full border border-neutral-700 cursor-pointer shadow-lg"
            onClick={handleOpenCloset}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{
              scale: 1.05,
              backgroundColor: '#171717',
            }}
            whileTap={{ scale: 0.95 }}
          >
            <ShoppingBag className="w-4 h-4 text-pink-400" />

            <span className="text-xs md:text-sm font-semibold">
              Tap closet to open
            </span>
          </motion.div>

        ) : (

          <motion.div
            key="open"
            className="z-10 mt-4 flex items-center gap-2 text-xs font-semibold text-pink-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Footprints className="w-4 h-4" />

            <span>Entering your closet</span>

            <ArrowRight className="w-4 h-4" />
          </motion.div>

        )}

      </AnimatePresence>
    </div>
  );
}