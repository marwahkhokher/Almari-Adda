import { motion } from "framer-motion";

export default function BoutiqueBackground() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden">
      {/* Boutique Image */}
      <img
        src="/boutique.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center center" }}
      />

      {/* Warm cinematic lighting */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 50% 12%, rgba(255,248,235,0.55), transparent 42%),
            radial-gradient(circle at 15% 40%, rgba(255,255,255,0.18), transparent 30%),
            radial-gradient(circle at 85% 35%, rgba(255,250,240,0.14), transparent 28%)
          `,
        }}
      />

      {/* Slight vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(20,16,12,0.08), rgba(20,16,12,0.18))",
        }}
      />

      {/* Floating dust particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white/50"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${(i * 13) % 100}%`,
              top: `${(i * 17) % 100}%`,
              filter: "blur(0.5px)",
            }}
            animate={{
              y: [-8, 8, -8],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 5 + (i % 6),
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Soft sunlight beam */}
      <div
        className="absolute left-1/3 top-0 h-full w-[400px]"
        style={{
          background:
            "linear-gradient(100deg, rgba(255,245,220,0.14), transparent 70%)",
          transform: "skewX(-18deg)",
          filter: "blur(12px)",
        }}
      />
    </div>
  );
}
