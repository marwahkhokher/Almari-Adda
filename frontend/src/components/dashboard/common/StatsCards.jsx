import { motion } from "framer-motion";
import {
  Shirt,
  Heart,
  Sparkles,
} from "lucide-react";

export default function StatsCards({
  totalItems = 0,
  favorites = 0,
}) {
  const cards = [
    {
      title: "Wardrobe",
      value: totalItems,
      icon: Shirt,
    },
    {
      title: "Looks",
      value: Math.max(1, Math.floor(totalItems / 3)),
      icon: Sparkles,
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.title}
            whileHover={{
              y: -8,
            }}
            className="
              rounded-[26px]
              border
              border-white/35
              bg-white/22
              p-6
              backdrop-blur-xl
              shadow-[0_18px_45px_rgba(0,0,0,.12)]
            "
          >
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-[#7A6E65]">
                  {card.title}
                </p>

                <h3 className="mt-3 font-serif text-4xl text-[#2D241E]">
                  {card.value}
                </h3>
              </div>

              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-white/70
                  shadow-md
                "
              >
                <Icon
                  size={24}
                  className="text-[#7A2E3D]"
                />
              </div>

            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
