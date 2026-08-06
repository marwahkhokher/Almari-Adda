import { motion } from "framer-motion";
import { Upload, Sparkles } from "lucide-react";

export default function EmptyCloset({
  onUpload,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 30,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        flex
        min-h-[520px]
        flex-col
        items-center
        justify-center
        rounded-[40px]
        border
        border-white/35
        bg-white/15
        text-center
        backdrop-blur-xl
      "
    >
      <motion.div
        animate={{
          y: [0, -12, 0],
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
        className="
          flex
          h-28
          w-28
          items-center
          justify-center
          rounded-full
          bg-white/60
          shadow-xl
        "
      >
        <Sparkles
          size={44}
          className="text-[#7A2E3D]"
        />
      </motion.div>

      <h2 className="mt-8 font-serif text-4xl text-[#2D241E]">
        Your boutique is waiting
      </h2>

      <p className="mt-4 max-w-md text-[#72675F]">
        Upload your favorite clothing pieces and
        watch them appear beautifully on your
        virtual boutique rack.
      </p>

      <button
        onClick={onUpload}
        className="
          mt-10
          inline-flex
          items-center
          gap-3
          rounded-full
          bg-[#7A2E3D]
          px-8
          py-4
          font-medium
          text-white
          shadow-xl
          transition
          hover:scale-105
        "
      >
        <Upload size={20} />
        Upload First Item
      </button>
    </motion.div>
  );
}
