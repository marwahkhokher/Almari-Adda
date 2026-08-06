import { motion } from "framer-motion";

export default function WoodenRod() {
  return (
    <div className="relative w-full py-10">

      {/* glow */}
      <div className="absolute left-1/2 top-8 h-8 w-[90%] -translate-x-1/2 rounded-full bg-black/10 blur-xl" />

      {/* rod */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{
          duration: 0.9,
          ease: "easeOut",
        }}
        className="relative mx-auto h-[18px] w-[92%] origin-center rounded-full"
        style={{
          background:
            "linear-gradient(to bottom,#f5d7a2 0%,#d9aa63 18%,#9f6836 45%,#71431d 70%,#4d2d15 100%)",
          boxShadow:
            "0 10px 18px rgba(58,34,17,.25), inset 0 2px 2px rgba(255,255,255,.35), inset 0 -3px 5px rgba(0,0,0,.35)",
        }}
      >
        {/* highlight */}
        <div className="absolute left-3 right-3 top-[2px] h-[3px] rounded-full bg-white/45" />

        {/* wood grain */}
        <div className="absolute inset-0 overflow-hidden rounded-full opacity-20">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-full w-[2px] bg-black"
              style={{
                left: `${i * 4}%`,
                opacity: 0.12 + (i % 3) * 0.06,
              }}
            />
          ))}
        </div>

        {/* left cap */}
        <div
          className="absolute -left-3 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 30%,#efcb92,#a26734 70%,#5f3619)",
            boxShadow: "0 5px 8px rgba(0,0,0,.25)",
          }}
        />

        {/* right cap */}
        <div
          className="absolute -right-3 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 30% 30%,#efcb92,#a26734 70%,#5f3619)",
            boxShadow: "0 5px 8px rgba(0,0,0,.25)",
          }}
        />
      </motion.div>
    </div>
  );
}
