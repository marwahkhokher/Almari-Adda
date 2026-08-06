import { motion } from "framer-motion";
import { Heart, Shirt } from "lucide-react";
import Hanger from "./Hanger";

function title(item) {
  return (
    item?.name ||
    item?.title ||
    item?.subcategory ||
    "Wardrobe Item"
  );
}

export default function HangingGarment({
  item,
  index = 0,
  onClick,
  onFavorite,
}) {
  const rotation = ((index % 5) - 2) * 1.8;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -30,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.05,
        type: "spring",
      }}
      className="relative flex w-[170px] shrink-0 justify-center"
    >
      {/* Spotlight */}
      <motion.div
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
        }}
        className="absolute top-5 h-64 w-36 rounded-full bg-gradient-to-b from-white/60 to-transparent blur-2xl"
      />

      <Hanger rotation={rotation}>
        <motion.div
          whileHover={{
            rotate: rotation * 1.4,
            y: 4,
          }}
          transition={{
            type: "spring",
            stiffness: 120,
          }}
          className="relative mt-1"
          onClick={onClick}
        >
          {item?.image_url ? (
            <img
              src={item.image_url}
              alt={title(item)}
              draggable={false}
              className="
                max-h-[255px]
                w-auto
                object-contain
                select-none
                drop-shadow-[0_20px_22px_rgba(0,0,0,.25)]
              "
            />
          ) : (
            <div className="flex h-[220px] w-[120px] items-center justify-center">
              <Shirt
                size={82}
                strokeWidth={1.2}
                className="text-[#C9C2BC]"
              />
            </div>
          )}

          <motion.button
            whileTap={{
              scale: 0.9,
            }}
            whileHover={{
              scale: 1.12,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onFavorite?.(e, item);
            }}
            className="
              absolute
              bottom-2
              right-1
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              border
              border-white/60
              bg-white/75
              backdrop-blur-xl
              shadow-xl
            "
          >
            <Heart
              size={16}
              className={
                item?.is_favorite
                  ? "fill-[#7A2E3D] text-[#7A2E3D]"
                  : "text-[#8B8077]"
              }
            />
          </motion.button>
        </motion.div>

        <div className="mt-5 text-center">
          <p className="max-w-[140px] truncate font-serif text-[15px] text-[#342A24]">
            {title(item)}
          </p>

          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#9A8E84]">
            Curated Piece
          </p>
        </div>
      </Hanger>
    </motion.div>
  );
}
