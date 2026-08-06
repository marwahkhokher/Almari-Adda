import { motion } from "framer-motion";

export default function SectionTitle({
  title,
  subtitle,
  action,
}) {
  return (
    <div className="mb-6 flex items-end justify-between">

      <div>
        <motion.h2
          initial={{
            opacity: 0,
            y: 12,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="
            font-serif
            text-[34px]
            tracking-[-0.03em]
            text-[#2E241F]
          "
        >
          {title}
        </motion.h2>

        {subtitle && (
          <p className="mt-2 text-[14px] text-[#7C7067]">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <motion.div
          whileHover={{
            scale: 1.05,
          }}
          whileTap={{
            scale: 0.98,
          }}
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}
