import { motion } from "framer-motion";

export default function FloatingSpotlights() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">

      {/* Left spotlight */}
      <motion.div
        animate={{
          opacity: [0.35, 0.55, 0.35],
          x: [-20, 20, -20],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          -left-40
          -top-40
          h-[700px]
          w-[700px]
          rounded-full
          bg-[#FFEBC8]
          blur-[180px]
        "
      />

      {/* Right spotlight */}
      <motion.div
        animate={{
          opacity: [0.25, 0.45, 0.25],
          x: [20, -20, 20],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          -right-44
          top-0
          h-[650px]
          w-[650px]
          rounded-full
          bg-[#FFD9D0]
          blur-[180px]
        "
      />

      {/* Ceiling light */}
      <div
        className="
          absolute
          left-1/2
          top-0
          h-[420px]
          w-[900px]
          -translate-x-1/2
          rounded-full
          bg-white/35
          blur-[140px]
        "
      />

      {/* Floor reflection */}
      <div
        className="
          absolute
          bottom-0
          left-1/2
          h-[260px]
          w-[92%]
          -translate-x-1/2
          rounded-full
          bg-white/20
          blur-[120px]
        "
      />
    </div>
  );
}
