import { motion } from "framer-motion";
import WoodenRod from "./WoodenRod";
import ClothingRackScroller from "./ClothingRackScroller";

export default function BoutiqueRack({
  items = [],
  onItemClick,
  onFavorite,
}) {
  return (
    <section className="relative mx-auto mt-6 w-full max-w-[1700px] px-8">

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-12 h-[280px] w-[900px] -translate-x-1/2 rounded-full bg-[#F8E8C9]/40 blur-[120px]" />
      </div>

      {/* Ceiling shadow */}
      <div className="absolute left-0 right-0 top-0 h-24 bg-gradient-to-b from-black/10 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="
          relative
          overflow-visible
          rounded-[42px]
          border
          border-white/30
          bg-white/10
          px-8
          pb-14
          pt-10
          backdrop-blur-md
          shadow-[0_35px_90px_rgba(0,0,0,.14)]
        "
      >
        {/* Boutique title */}
        <div className="mb-6 flex items-center justify-center gap-5">
          <div className="h-px w-20 bg-[#B88755]/60" />

          <h2 className="font-serif text-lg uppercase tracking-[0.45em] text-[#7A5A3E]">
            Wardrobe Collection
          </h2>

          <div className="h-px w-20 bg-[#B88755]/60" />
        </div>

        {/* Wooden rod */}
        <div className="relative z-20">
          <WoodenRod />
        </div>

        {/* Hanging clothes */}
        <div className="-mt-3">
          <ClothingRackScroller
            items={items}
            onItemClick={onItemClick}
            onFavorite={onFavorite}
          />
        </div>

        {/* Floor shadow */}
        <div className="pointer-events-none absolute bottom-5 left-1/2 h-8 w-[82%] -translate-x-1/2 rounded-full bg-black/10 blur-2xl" />
      </motion.div>
    </section>
  );
}
