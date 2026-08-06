import { motion } from "framer-motion";

const particles = [
  { left: "8%", top: "18%", size: 10, delay: 0 },
  { left: "20%", top: "72%", size: 6, delay: 1 },
  { left: "37%", top: "26%", size: 8, delay: 2 },
  { left: "55%", top: "14%", size: 7, delay: 3 },
  { left: "68%", top: "62%", size: 12, delay: 1.5 },
  { left: "82%", top: "32%", size: 9, delay: 4 },
  { left: "92%", top: "70%", size: 6, delay: 2.5 },
];

export default function FloatingParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: [0.15, 0.45, 0.15],
            y: [0, -35, 0],
            x: [0, 10, -8, 0],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 7 + i,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute rounded-full bg-white"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            boxShadow: "0 0 18px rgba(255,255,255,.9)",
          }}
        />
      ))}
    </div>
  );
}
