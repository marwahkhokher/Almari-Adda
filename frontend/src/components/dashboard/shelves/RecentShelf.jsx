import { motion } from "framer-motion";
import { Clock3, Shirt } from "lucide-react";

export default function RecentShelf({
  items = [],
  onItemClick,
}) {
  return (
    <section className="relative">

      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-2xl text-[#2E241F]">
          Recently Added
        </h3>

        <Clock3
          size={18}
          className="text-[#8A725C]"
        />
      </div>

      <div
        className="relative rounded-[22px] px-6 pt-6 pb-8"
        style={{
          background:
            "linear-gradient(to bottom,#F8F5EF,#EEE4D8)",
          boxShadow:
            "0 25px 45px rgba(0,0,0,.10)",
        }}
      >
        <div
          className="absolute left-4 right-4 top-0 h-4 rounded-full"
          style={{
            background:
              "linear-gradient(to bottom,#E4B97E,#8E5728)",
          }}
        />

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {items.map((item, index) => (
            <motion.button
              key={item.id || index}
              whileHover={{
                y: -8,
                rotate: 2,
              }}
              whileTap={{
                scale: 0.98,
              }}
              onClick={() => onItemClick(item)}
              className="group"
            >
              <div className="relative flex h-44 items-center justify-center rounded-[22px] border border-white/40 bg-white/70 shadow-lg backdrop-blur-xl">

                {item?.image_url ? (
                  <img
                    src={item.image_url}
                    alt=""
                    className="h-[82%] object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <Shirt
                    size={60}
                    className="text-[#C8C0B8]"
                  />
                )}

                <div className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-[#8A725C] shadow">
                  NEW
                </div>
              </div>

              <p className="mt-3 truncate text-center font-serif text-sm text-[#352C26]">
                {item?.name || item?.title || "Piece"}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

    </section>
  );
}
