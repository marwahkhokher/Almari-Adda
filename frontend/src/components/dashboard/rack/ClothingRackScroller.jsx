import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HangingGarment from "./HangingGarment";

export default function ClothingRackScroller({
  items = [],
  onItemClick,
  onFavorite,
}) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({
      left: direction * 420,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative mt-10">

      {/* Left Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => scroll(-1)}
        className="
          absolute
          left-4
          top-1/2
          z-40
          -translate-y-1/2
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          border
          border-white/50
          bg-white/70
          backdrop-blur-xl
          shadow-xl
        "
      >
        <ChevronLeft size={24} />
      </motion.button>

      {/* Right Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => scroll(1)}
        className="
          absolute
          right-4
          top-1/2
          z-40
          -translate-y-1/2
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          border
          border-white/50
          bg-white/70
          backdrop-blur-xl
          shadow-xl
        "
      >
        <ChevronRight size={24} />
      </motion.button>

      {/* Rack */}
      <div
        ref={scrollRef}
        className="
          flex
          items-start
          gap-2
          overflow-x-auto
          overflow-y-visible
          px-20
          pb-10
          pt-3
          scrollbar-hide
          scroll-smooth
        "
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id || index}
            animate={{
              y: [0, -3, 0],
            }}
            transition={{
              duration: 5 + index,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <HangingGarment
              item={item}
              index={index}
              onClick={() => onItemClick(item)}
              onFavorite={onFavorite}
            />
          </motion.div>
        ))}
      </div>

    </section>
  );
}
