import { motion } from "framer-motion";

export default function PageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">

      {/* Boutique Image */}
      <img
        src="/boutique.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Warm overlay */}
      <div className="absolute inset-0 bg-[#F6EFE7]/18" />

      {/* Bright center spotlight */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 28%, rgba(255,255,255,.82) 0%, rgba(255,255,255,.25) 38%, rgba(255,255,255,0) 72%)",
        }}
      />

      {/* Left glow */}
      <motion.div
        animate={{
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
        className="
          absolute
          -left-40
          top-20
          h-[520px]
          w-[520px]
          rounded-full
          bg-[#FFE9C5]
          blur-[140px]
        "
      />

      {/* Right glow */}
      <motion.div
        animate={{
          opacity: [0.25, 0.5, 0.25],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
        }}
        className="
          absolute
          -right-32
          top-40
          h-[450px]
          w-[450px]
          rounded-full
          bg-[#F4D8C4]
          blur-[120px]
        "
      />

      {/* Bottom glow */}
      <div
        className="
          absolute
          bottom-0
          left-1/2
          h-[260px]
          w-[90%]
          -translate-x-1/2
          rounded-full
          bg-white/25
          blur-[90px]
        "
      />

      {/* Soft vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle, transparent 55%, rgba(0,0,0,.12) 100%)",
        }}
      />
    </div>
  );
}
