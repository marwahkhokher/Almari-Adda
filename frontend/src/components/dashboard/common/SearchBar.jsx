import { Search, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";

export default function SearchBar({
  value,
  onChange,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="relative mx-auto w-full max-w-3xl"
    >
      <div
        className="
          flex
          h-16
          items-center
          rounded-full
          border
          border-white/40
          bg-white/25
          px-6
          backdrop-blur-2xl
          shadow-[0_20px_60px_rgba(0,0,0,.12)]
        "
      >
        <Search
          size={22}
          className="text-[#8A7A6D]"
        />

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search your wardrobe..."
          className="
            ml-4
            flex-1
            bg-transparent
            text-[15px]
            text-[#332A24]
            outline-none
            placeholder:text-[#8C8178]
          "
        />

        <button
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-full
            bg-white/70
            shadow-md
            transition
            hover:scale-105
          "
        >
          <SlidersHorizontal
            size={18}
            className="text-[#6A584B]"
          />
        </button>
      </div>
    </motion.div>
  );
}
