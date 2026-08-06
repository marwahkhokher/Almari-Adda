import { motion } from "framer-motion";
import {
  Sparkles,
  Flower2,
  ShoppingBag,
  Stars,
} from "lucide-react";

export default function DecorativeElements() {
  return (
    <>
      {/* Left Plant */}
      <motion.div
        animate={{
          y: [0, -8, 0],
          rotate: [-1, 1, -1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
        }}
        className="pointer-events-none absolute left-10 bottom-12 hidden xl:block"
      >
        <div className="flex h-28 w-24 items-end justify-center rounded-t-[60px] bg-gradient-to-b from-[#8FB87D] to-[#4E7A43] shadow-xl">
          <Flower2
            size={46}
            className="mb-12 text-[#F6F6F6]/80"
          />
        </div>

        <div className="mx-auto h-12 w-20 rounded-xl bg-[#C79A67]" />
      </motion.div>

      {/* Right Handbag */}
      <motion.div
        whileHover={{
          rotate: -4,
          scale: 1.05,
        }}
        className="absolute bottom-20 right-14 hidden xl:flex h-28 w-28 items-center justify-center rounded-[30px] border border-white/40 bg-white/25 shadow-2xl backdrop-blur-xl"
      >
        <ShoppingBag
          size={42}
          strokeWidth={1.6}
          className="text-[#6B4D38]"
        />
      </motion.div>

      {/* Floating sparkle */}
      <motion.div
        animate={{
          y: [-8, 8, -8],
          opacity: [0.35, 1, 0.35],
          rotate: [0, 180],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
        className="absolute left-[12%] top-[18%]"
      >
        <Sparkles
          size={26}
          className="text-[#E3B45F]"
        />
      </motion.div>

      {/* Floating sparkle */}
      <motion.div
        animate={{
          y: [10, -10, 10],
          opacity: [0.4, 1, 0.4],
          rotate: [0, -180],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
        }}
        className="absolute right-[18%] top-[28%]"
      >
        <Stars
          size={20}
          className="text-[#F0C97C]"
        />
      </motion.div>

      {/* Sun Glow */}
      <div className="pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-[#FFF1D8]/60 blur-[120px]" />

      {/* Floor Glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-36 w-[80%] -translate-x-1/2 rounded-full bg-white/20 blur-[80px]" />
    </>
  );
}
