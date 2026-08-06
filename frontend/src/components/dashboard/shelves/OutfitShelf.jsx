import { motion } from "framer-motion";
import { Sparkles, Shirt } from "lucide-react";

export default function OutfitShelf({
  groups = [],
  onClick,
}) {
  return (
    <section className="relative">

      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-2xl text-[#2E241F]">
          Outfit Inspiration
        </h3>

        <Sparkles
          size={18}
          className="text-[#C49842]"
        />
      </div>

      <div
        className="rounded-[22px] p-6"
        style={{
          background:
            "linear-gradient(to bottom,#F8F4EE,#EEE3D7)",
          boxShadow:
            "0 25px 45px rgba(0,0,0,.10)",
        }}
      >
        <div className="grid gap-6 md:grid-cols-3">
          {groups.map((group, i) => (
            <motion.button
              key={i}
              whileHover={{
                y: -10,
                rotate: -1,
              }}
              whileTap={{
                scale: 0.98,
              }}
              onClick={onClick}
              className="
                relative
                overflow-hidden
                rounded-[24px]
                border
                border-white/40
                bg-white/70
                p-6
                backdrop-blur-xl
                shadow-xl
              "
            >
              <div className="relative flex h-52 items-center justify-center">
                {group.slice(0, 3).map((item, index) => (
                  <motion.div
                    key={item.id || index}
                    animate={{
                      y: [0, -3, 0],
                    }}
                    transition={{
                      duration: 4 + index,
                      repeat: Infinity,
                    }}
                    className="absolute"
                    style={{
                      transform: `translateX(${(index - 1) * 45}px) rotate(${(index - 1) * 7}deg)`,
                      zIndex: 5 - index,
                    }}
                  >
                    <div className="flex h-40 w-28 items-center justify-center rounded-[20px] bg-white shadow-lg">
                      {item?.image_url ? (
                        <img
                          src={item.image_url}
                          alt=""
                          className="h-[85%] object-contain"
                        />
                      ) : (
                        <Shirt
                          size={46}
                          className="text-[#C9C1BA]"
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5">
                <p className="font-serif text-lg text-[#322823]">
                  Curated Look
                </p>

                <p className="mt-1 text-sm text-[#766B63]">
                  AI styled from your wardrobe
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

    </section>
  );
}
