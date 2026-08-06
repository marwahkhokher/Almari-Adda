import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function WelcomeHero({
  firstName = "Marwah",
  itemCount = 0,
}) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 25,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.8,
      }}
      className="
        relative
        overflow-hidden
        rounded-[38px]
        border
        border-white/35
        bg-white/18
        p-10
        backdrop-blur-xl
        shadow-[0_30px_80px_rgba(0,0,0,.12)]
      "
    >
      {/* Decorative Glow */}
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#FFE9C7]/60 blur-[90px]" />
      <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-[#F7D5D8]/55 blur-[90px]" />

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm text-[#7A2E3D] shadow">
            <Sparkles size={15} />
            Welcome Back
          </div>

          <h1 className="max-w-2xl font-serif text-5xl leading-tight text-[#2E241F]">
            Hi {firstName},
            <br />
            let's create today's look.
          </h1>

          <p className="mt-5 max-w-xl text-[16px] leading-7 text-[#6D625A]">
            Your wardrobe is beautifully organized and ready
            to inspire your next outfit.
          </p>
        </div>

        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
          }}
          className="
            flex
            h-48
            w-48
            flex-col
            items-center
            justify-center
            rounded-full
            border
            border-white/40
            bg-white/35
            backdrop-blur-xl
            shadow-2xl
          "
        >
          <div className="font-serif text-6xl text-[#7A2E3D]">
            {itemCount}
          </div>

          <div className="mt-2 text-sm tracking-[0.25em] text-[#766860] uppercase">
            Pieces
          </div>
        </motion.div>

      </div>
    </motion.section>
  );
}
