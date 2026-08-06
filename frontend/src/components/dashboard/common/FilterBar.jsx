import { motion } from "framer-motion";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "top", label: "Tops" },
  { key: "bottom", label: "Bottoms" },
  { key: "dress", label: "Dresses" },
  { key: "outerwear", label: "Outerwear" },
  { key: "shoes", label: "Shoes" },
  { key: "accessories", label: "Accessories" },
];

export default function FilterBar({
  active,
  onChange,
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {FILTERS.map((filter) => {
        const selected = active === filter.key;

        return (
          <motion.button
            key={filter.key}
            whileHover={{
              y: -2,
              scale: 1.03,
            }}
            whileTap={{
              scale: 0.97,
            }}
            onClick={() => onChange(filter.key)}
            className={`
              rounded-full
              px-5
              py-2.5
              text-sm
              font-medium
              transition-all
              ${
                selected
                  ? "bg-[#7A2E3D] text-white shadow-lg"
                  : "bg-white/60 text-[#4B4038] backdrop-blur-xl hover:bg-white"
              }
            `}
          >
            {filter.label}
          </motion.button>
        );
      })}
    </div>
  );
}
