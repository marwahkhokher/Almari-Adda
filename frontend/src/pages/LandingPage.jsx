import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
} from 'framer-motion';

import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Footprints,
  Gem,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext.jsx';


function DoorPanel({ side, open }) {
  const isLeft = side === 'left';

  return (
    <motion.div
      className={`absolute top-0 bottom-0 w-1/2 ${
        isLeft ? 'left-0' : 'right-0'
      }`}
      style={{
        transformOrigin: isLeft
          ? 'left center'
          : 'right center',
        transformStyle: 'preserve-3d',
        zIndex: 40,
      }}
      animate={{
        rotateY: open
          ? isLeft
            ? -112
            : 112
          : 0,
        z: open ? 25 : 0,
      }}
      transition={{
        duration: 1,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <div
        className="
          relative
          w-full
          h-full
          overflow-hidden
          bg-gradient-to-br
          from-[#4A2817]
          via-[#6B3D22]
          to-[#2A160D]
          border
          border-[#2C160B]
          shadow-2xl
        "
      >
        {/* Main carved borders */}
        <div className="absolute inset-2 border-2 border-[#9A6944]/70" />

        <div className="absolute inset-4 border border-[#C49A6C]/25" />

        {/* Recessed door panel */}
        <div
          className="
            absolute
            inset-x-7
            top-7
            bottom-7
            border-2
            border-[#3A1E10]
            bg-gradient-to-br
            from-[#74472A]
            via-[#5A321C]
            to-[#32190D]
            shadow-inner
          "
        >
          <div className="absolute inset-2 border border-[#B8865B]/35" />

          {/* Inner carved panel */}
          <div
            className="
              absolute
              inset-5
              border
              border-[#2D160B]/80
              shadow-[inset_0_0_25px_rgba(28,12,5,0.6)]
            "
          />

          {/* Decorative central diamond */}
          <div
            className="
              absolute
              left-1/2
              top-1/2
              w-14
              h-14
              -translate-x-1/2
              -translate-y-1/2
              rotate-45
              border-2
              border-[#A87449]/70
              bg-[#4D2916]/60
              shadow-lg
            "
          >
            <div className="absolute inset-2 border border-[#D1AA79]/40" />
          </div>
        </div>

        {/* Door edge */}
        <div
          className={`absolute top-0 bottom-0 w-2 bg-gradient-to-b from-[#A06F47] via-[#5B321D] to-[#281208] ${
            isLeft ? 'left-0' : 'right-0'
          }`}
        />

        {/* Brass handle */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${
            isLeft ? 'right-4' : 'left-4'
          }`}
        >
          <div className="relative">
            <div
              className="
                w-2
                h-16
                rounded-full
                bg-gradient-to-b
                from-[#F2D49A]
                via-[#B8863E]
                to-[#6E4318]
                shadow-lg
              "
            />

            <div
              className="
                absolute
                inset-x-0
                top-1
                bottom-1
                rounded-full
                bg-[#FFF0C2]/25
              "
            />

            <div
              className="
                absolute
                -top-2
                left-1/2
                w-4
                h-4
                -translate-x-1/2
                rounded-full
                border
                border-[#6E4318]
                bg-gradient-to-br
                from-[#E2BE75]
                to-[#8A571F]
              "
            />

            <div
              className="
                absolute
                -bottom-2
                left-1/2
                w-4
                h-4
                -translate-x-1/2
                rounded-full
                border
                border-[#6E4318]
                bg-gradient-to-br
                from-[#E2BE75]
                to-[#8A571F]
              "
            />
          </div>
        </div>

        {/* Corner decorations */}
        <div className="absolute top-3 left-3 w-8 h-8 border-t border-l border-[#C49A6C]/50" />

        <div className="absolute bottom-3 left-3 w-8 h-8 border-b border-l border-[#C49A6C]/50" />

        <div className="absolute top-3 right-3 w-8 h-8 border-t border-r border-[#C49A6C]/50" />

        <div className="absolute bottom-3 right-3 w-8 h-8 border-b border-r border-[#C49A6C]/50" />
      </div>
    </motion.div>
  );
}


function HangingClothes() {
  const clothes = [
    ['bg-[#2F2925]', 'w-10', 'h-18'],
    ['bg-[#B9A58E]', 'w-12', 'h-21'],
    ['bg-[#D7C3A5]', 'w-11', 'h-20'],
    ['bg-[#70513B]', 'w-12', 'h-23'],
    ['bg-[#E3D8C8]', 'w-10', 'h-19'],
    ['bg-[#A98262]', 'w-12', 'h-21'],
    ['bg-[#806A58]', 'w-10', 'h-18'],
    ['bg-[#C4B29E]', 'w-11', 'h-20'],
  ];

  return (
    <div className="absolute top-9 left-8 right-8 bottom-18">
      {/* Brass rail */}
      <div
        className="
          absolute
          top-0
          left-0
          right-0
          h-1
          rounded-full
          bg-gradient-to-r
          from-[#7B4A1D]
          via-[#E2C17D]
          to-[#7B4A1D]
          shadow-lg
        "
      />

      <div className="absolute top-1 left-2 right-2 flex justify-center gap-1">
        {clothes.map(([color, width, height], i) => (
          <motion.div
            key={i}
            className="relative flex flex-col items-center"
            initial={{
              opacity: 0,
              y: -12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.4 + i * 0.05,
            }}
          >
            <div
              className="
                w-3
                h-3
                border-t-2
                border-l-2
                border-[#8B673E]
                rounded-full
                rotate-45
                -mb-1
              "
            />

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
      {/* Upper shelf */}
      <div
        className="
          absolute
          bottom-14
          left-7
          right-7
          h-2
          bg-gradient-to-b
          from-[#B5865F]
          to-[#59301A]
          shadow-md
        "
      />

      {/* Folded clothes */}
      <div className="absolute bottom-[4rem] left-8 right-8 flex items-end justify-center gap-1.5">
        <div className="w-12 h-7 bg-[#D8CCBD] rounded-sm shadow-md" />

        <div className="w-14 h-9 bg-[#B99978] rounded-sm shadow-md" />

        <div className="w-11 h-6 bg-[#938171] rounded-sm shadow-md" />

        <div className="w-12 h-8 bg-[#594438] rounded-sm shadow-md" />

        <div className="w-9 h-7 bg-[#B6A594] rounded-sm shadow-md" />
      </div>

      {/* Bottom shelf */}
      <div
        className="
          absolute
          bottom-2
          left-7
          right-7
          h-2
          bg-gradient-to-b
          from-[#B5865F]
          to-[#59301A]
          shadow-md
        "
      />

      {/* Shoes */}
      <div className="absolute bottom-4 left-0 right-0 flex items-end justify-center gap-3">
        <div className="relative w-12 h-5">
          <div
            className="
              absolute
              bottom-0
              left-0
              w-10
              h-3.5
              bg-[#4A352A]
              rounded-t-lg
              rounded-br-xl
              shadow-md
              rotate-[-5deg]
            "
          />

          <div
            className="
              absolute
              bottom-0
              left-2
              w-9
              h-1.5
              bg-[#C7B8A6]
              rounded-full
            "
          />
        </div>

        <div className="relative w-12 h-5">
          <div
            className="
              absolute
              bottom-0
              left-0
              w-10
              h-3.5
              bg-[#2F2925]
              rounded-t-lg
              rounded-br-xl
              shadow-md
              rotate-[-3deg]
            "
          />

          <div
            className="
              absolute
              bottom-0
              left-2
              w-9
              h-1.5
              bg-[#A99987]
              rounded-full
            "
          />
        </div>

        <div className="relative w-12 h-5">
          <div
            className="
              absolute
              bottom-0
              left-0
              w-10
              h-3.5
              bg-[#A77B58]
              rounded-t-lg
              rounded-br-xl
              shadow-md
              rotate-[4deg]
            "
          />

          <div
            className="
              absolute
              bottom-0
              left-2
              w-9
              h-1.5
              bg-[#E2D6C7]
              rounded-full
            "
          />
        </div>

        <div className="relative w-12 h-5">
          <div
            className="
              absolute
              bottom-0
              left-0
              w-10
              h-3.5
              bg-[#8C6144]
              rounded-t-lg
              rounded-br-xl
              shadow-md
              rotate-[6deg]
            "
          />

          <div
            className="
              absolute
              bottom-0
              left-2
              w-9
              h-1.5
              bg-[#E2D6C7]
              rounded-full
            "
          />
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
    <div
      className="
        h-screen
        flex
        flex-col
        items-center
        justify-center
        px-4
        py-2
        relative
        overflow-hidden
        select-none
        bg-cover
        bg-center
        bg-no-repeat
      "
      style={{
        backgroundImage: "url('/bgg.png')",
      }}
    >
      {/* Soft background overlay */}
      <div className="absolute inset-0 bg-[#F7F0E7]/45" />

      {/* Warm radial glow behind wardrobe */}
      <div
        className="
          absolute
          left-1/2
          top-[58%]
          h-[650px]
          w-[650px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-[#E8CDAA]/25
          blur-3xl
          pointer-events-none
        "
      />

      {/* Header */}
      <motion.div
        className="relative text-center z-10 mb-1 mt-30"
        initial={{
          opacity: 0,
          y: -15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.6,
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-[#8B5E3C]" />

          <span
            className="
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.25em]
              text-[#6E5A49]
            "
          >
            Welcome to
          </span>

          <Sparkles className="w-4 h-4 text-[#8B5E3C]" />
        </div>

        <h1
          className="
            font-display
            text-3xl
            md:text-5xl
            font-bold
            tracking-[0.06em]
            text-[#3C2417]
          "
        >
          Almari Adda
        </h1>

        <p className="text-[#6F6258] text-xs md:text-sm mt-1">
          Your personal virtual closet
        </p>
      </motion.div>

      {/* Closet */}
      <div
  className="relative z-20 cursor-pointer mt-8"
  onClick={handleOpenCloset}
  style={{
    perspective: '1800px',
    perspectiveOrigin: '50% 45%',
  }}
>
        <div className="relative w-[360px] md:w-[500px] scale-[0.90] origin-top">
          {/* Decorative crown */}
          <div className="relative h-10 md:h-12">
            <div
              className="
                absolute
                left-[18%]
                right-[18%]
                top-0
                h-7
                rounded-t-[50%]
                border
                border-[#5A3019]
                bg-gradient-to-b
                from-[#9B6947]
                via-[#654025]
                to-[#3A1D0E]
                shadow-lg
              "
            />

            <div
              className="
                absolute
                left-[31%]
                right-[31%]
                top-[-6px]
                h-9
                rounded-t-full
                border
                border-[#5A3019]
                bg-gradient-to-br
                from-[#A97955]
                via-[#6B4227]
                to-[#32180C]
              "
            />

            <div
              className="
                absolute
                left-3
                right-3
                bottom-1
                h-5
                bg-gradient-to-b
                from-[#8E5C3A]
                via-[#5D351E]
                to-[#30170C]
                border
                border-[#3A1C0D]
                shadow-xl
              "
            />

            <div
              className="
                absolute
                left-0
                right-0
                bottom-0
                h-4
                bg-gradient-to-b
                from-[#75472A]
                to-[#2F160B]
                border-y
                border-[#3A1C0D]
              "
            />

            <div
              className="
                absolute
                left-8
                right-8
                bottom-2
                h-px
                bg-[#D0A777]/60
              "
            />
          </div>

          {/* Main cabinet */}
          <div
            className="
              relative
              h-[405px]
              md:h-[515px]
              bg-gradient-to-r
              from-[#2A140A]
              via-[#704326]
              to-[#2A140A]
              p-3
              border-x
              border-[#2A1309]
              shadow-[0_30px_70px_-22px_rgba(45,22,9,0.75)]
            "
          >
            {/* Outer frame */}
            <div className="absolute inset-1 border-2 border-[#8D5D3C]/70" />

            <div className="absolute inset-3 border border-[#C49A6C]/30" />

            {/* Carved side columns */}
            <div
              className="
                absolute
                left-3
                top-3
                bottom-3
                w-7
                bg-gradient-to-r
                from-[#2A140A]
                via-[#805033]
                to-[#4A2715]
                border-r
                border-[#A67450]/40
              "
            />

            <div
              className="
                absolute
                right-3
                top-3
                bottom-3
                w-7
                bg-gradient-to-l
                from-[#2A140A]
                via-[#805033]
                to-[#4A2715]
                border-l
                border-[#A67450]/40
              "
            />

            {/* Column details */}
            <div
              className="
                absolute
                left-[18px]
                top-12
                bottom-12
                w-2
                border-x
                border-[#D0A777]/30
              "
            />

            <div
              className="
                absolute
                right-[18px]
                top-12
                bottom-12
                w-2
                border-x
                border-[#D0A777]/30
              "
            />

            {/* Recessed opening */}
            <div
              className="
                absolute
                inset-x-9
                top-8
                bottom-5
                bg-[#241108]
                border-2
                border-[#241108]
                shadow-inner
                overflow-hidden
              "
            >
              {/* Interior */}
              <div
                className="
                  absolute
                  inset-2
                  bg-gradient-to-b
                  from-[#FFF4DA]
                  via-[#F4DFC0]
                  to-[#CCB18C]
                  overflow-hidden
                "
              >
                {/* Interior lighting */}
                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-r
                    from-[#684429]/25
                    via-transparent
                    to-[#684429]/25
                  "
                />

                <div
                  className="
                    absolute
                    top-0
                    left-0
                    right-0
                    h-12
                    bg-gradient-to-b
                    from-[#FFE6A8]/80
                    to-transparent
                  "
                />

                <div
                  className="
                    absolute
                    left-1/2
                    top-0
                    bottom-0
                    w-20
                    -translate-x-1/2
                    bg-[#FFD98C]/20
                    blur-xl
                  "
                />

                <HangingClothes />

                <ShelfContents />

                <div
                  className="
                    absolute
                    top-0
                    bottom-0
                    left-0
                    w-4
                    bg-gradient-to-r
                    from-[#5A341B]/30
                    to-transparent
                  "
                />

                <div
                  className="
                    absolute
                    top-0
                    bottom-0
                    right-0
                    w-4
                    bg-gradient-to-l
                    from-[#5A341B]/30
                    to-transparent
                  "
                />

                {/* Opening message */}
                <motion.div
                  className="
                    absolute
                    inset-0
                    flex
                    items-center
                    justify-center
                    text-center
                    z-20
                    pointer-events-none
                    px-4
                  "
                  initial={{
                    opacity: 0,
                    scale: 0.85,
                    y: 8,
                  }}
                  animate={
                    isOpen
                      ? {
                          opacity: 1,
                          scale: 1,
                          y: 0,
                        }
                      : {
                          opacity: 0,
                          scale: 0.85,
                          y: 8,
                        }
                  }
                  transition={{
                    delay: 0.5,
                    duration: 0.5,
                  }}
                >
                  <div
                    className="
                      w-[190px]
                      rounded-2xl
                      bg-[#FFF9F0]/95
                      backdrop-blur-md
                      border
                      border-[#D4B895]
                      shadow-[0_12px_35px_rgba(72,40,18,0.22)]
                      px-5
                      py-4
                    "
                  >
                    <div
                      className="
                        w-14
                        h-14
                        mx-auto
                        rounded-2xl
                        bg-[#EFE0CC]
                        flex
                        items-center
                        justify-center
                        mb-2.5
                        border
                        border-[#C6A27B]
                        shadow-[0_4px_15px_rgba(99,63,34,0.18)]
                      "
                    >
                      <Gem className="w-7 h-7 text-[#7B4B2B]" />
                    </div>

                    <h2 className="font-display text-lg font-bold text-[#3E2618]">
                      Stepping inside
                    </h2>

                    <p className="text-[11px] text-[#796B5F] max-w-[180px] mx-auto mt-1">
                      {user
                        ? 'Opening your closet...'
                        : 'Signing you in...'}
                    </p>

                    <div
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                        text-[11px]
                        font-semibold
                        text-[#7B4B2B]
                        mt-2.5
                      "
                    >
                      <span>
                        {user
                          ? 'Entering app'
                          : 'Signing in'}
                      </span>

                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </motion.div>

                {/* Animated doors */}
                <DoorPanel
                  side="left"
                  open={isOpen}
                />

                <DoorPanel
                  side="right"
                  open={isOpen}
                />
              </div>
            </div>
          </div>

          {/* Drawers */}
          <div
            className="
              relative
              h-[78px]
              md:h-[88px]
              bg-gradient-to-b
              from-[#724526]
              via-[#4B2815]
              to-[#281208]
              border-x-2
              border-[#34180C]
              p-2
            "
          >
            <div
              className="
                absolute
                top-0
                left-5
                right-5
                h-px
                bg-[#CAA174]/55
              "
            />

            <div className="grid grid-cols-2 gap-2 h-full">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="
                    relative
                    bg-gradient-to-b
                    from-[#774A2C]
                    to-[#3A1C0E]
                    border
                    border-[#2A1309]
                    shadow-inner
                  "
                >
                  <div className="absolute inset-1.5 border border-[#B07E55]/50" />

                  <div
                    className="
                      absolute
                      left-1/2
                      top-1/2
                      -translate-x-1/2
                      -translate-y-1/2
                      w-14
                      h-2
                      rounded-full
                      bg-gradient-to-b
                      from-[#E4C681]
                      via-[#B47C32]
                      to-[#704315]
                      shadow-lg
                    "
                  >
                    <div
                      className="
                        absolute
                        inset-x-1
                        top-0.5
                        h-px
                        bg-[#FFF0BB]/70
                      "
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Plinth */}
          <div
            className="
              relative
              h-7
              bg-gradient-to-b
              from-[#64391F]
              via-[#3A1C0E]
              to-[#1D0D06]
              border-x
              border-[#281208]
              shadow-lg
            "
          >
            <div
              className="
                absolute
                left-3
                right-3
                top-1
                h-1
                bg-[#B5845C]/35
              "
            />

            <div
              className="
                absolute
                left-8
                right-8
                bottom-1
                h-px
                bg-[#C9A06D]/55
              "
            />
          </div>

          {/* Feet */}
          <div className="flex justify-between px-7">
            <div
              className="
                w-7
                h-7
                bg-gradient-to-b
                from-[#4D2916]
                to-[#1D0D06]
                shadow-md
                rounded-b-full
              "
            />

            <div
              className="
                w-7
                h-7
                bg-gradient-to-b
                from-[#4D2916]
                to-[#1D0D06]
                shadow-md
                rounded-b-full
              "
            />
          </div>
        </div>
      </div>

      {/* CTA */}
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="closed"
            className="
              relative
              z-30
              mt-0
              flex
              items-center
              gap-2
              bg-[#FFF9F0]/95
              text-[#493023]
              px-6
              py-2.5
              rounded-full
              border
              border-[#D6C2AA]
              cursor-pointer
              shadow-[0_8px_24px_rgba(79,48,28,0.18)]
              backdrop-blur-sm
            "
            onClick={handleOpenCloset}
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
            }}
            whileHover={{
              scale: 1.05,
              backgroundColor: '#F5E9DA',
            }}
            whileTap={{
              scale: 0.95,
            }}
          >
            <ShoppingBag className="w-4 h-4 text-[#7B4B2B]" />

            <span className="text-xs md:text-sm font-semibold">
              Tap closet to open
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="open"
            className="
              relative
              z-30
              mt-3
              flex
              items-center
              gap-2
              text-xs
              font-semibold
              text-[#6B4227]
            "
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.5,
            }}
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