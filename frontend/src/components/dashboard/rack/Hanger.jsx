import { motion } from "framer-motion";

export default function Hanger({
  children,
  rotation = 0,
}) {
  return (
    <motion.div
      whileHover={{
        rotate: rotation,
        y: -2,
      }}
      transition={{
        type: "spring",
        stiffness: 180,
        damping: 10,
      }}
      className="relative flex flex-col items-center"
      style={{
        transformOrigin: "top center",
      }}
    >
      {/* Hook */}
      <svg
        width="34"
        height="42"
        viewBox="0 0 34 42"
        className="-mb-[1px] z-20"
      >
        <path
          d="M17 39V14C17 6.5 22 5 22 2.5C22 1.1 20.9 0 19.3 0C17.7 0 16.5 1.2 16.5 2.8"
          stroke="#6B6B6B"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Wooden Hanger */}
      <svg
        width="96"
        height="46"
        viewBox="0 0 96 46"
        className="-mt-1 drop-shadow-lg"
      >
        <defs>
          <linearGradient
            id="woodGradient"
            x1="0"
            x2="1"
          >
            <stop
              offset="0%"
              stopColor="#E8BF82"
            />
            <stop
              offset="40%"
              stopColor="#BF8545"
            />
            <stop
              offset="100%"
              stopColor="#7B4A22"
            />
          </linearGradient>
        </defs>

        <path
          d="
          M48 6
          L8 33
          C4 36 6 42 12 42
          H84
          C90 42 92 36 88 33
          Z"
          fill="url(#woodGradient)"
          stroke="#6B401F"
          strokeWidth="1.5"
        />

        <path
          d="M12 36 H84"
          stroke="rgba(255,255,255,.35)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Clothing */}
      <motion.div
        whileHover={{
          rotate: [-1, 1, -1],
        }}
        transition={{
          repeat: Infinity,
          duration: 2.8,
        }}
        className="-mt-1"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
