import { motion } from "framer-motion";

export default function GlassButton({
  children,
  icon: Icon,
  onClick,
  className = "",
}) {
  return (
    <motion.button
      whileHover={{
        y: -3,
        scale: 1.02,
      }}
      whileTap={{
        scale: 0.98,
      }}
      onClick={onClick}
      className={`
        group
        inline-flex
        items-center
        gap-3
        rounded-full
        border
        border-white/40
        bg-white/20
        px-6
        py-3
        backdrop-blur-xl
        shadow-[0_12px_35px_rgba(0,0,0,.12)]
        transition-all
        hover:bg-white/35
        ${className}
      `}
    >
      {Icon && (
        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            bg-white/70
            shadow
          "
        >
          <Icon
            size={18}
            strokeWidth={1.8}
            className="text-[#6B4936]"
          />
        </div>
      )}

      <span className="font-medium text-[#342A24]">
        {children}
      </span>
    </motion.button>
  );
}
