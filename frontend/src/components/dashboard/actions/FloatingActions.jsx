import { motion } from "framer-motion";
import {
  Sparkles,
  Camera,
  Wand2,
  Layers3,
} from "lucide-react";

const actions = [
  {
    title: "Visualizer",
    subtitle: "Try outfits",
    icon: Layers3,
    route: "/visualize",
    color: "#E9F1FF",
  },
  {
    title: "Upload",
    subtitle: "New clothing",
    icon: Camera,
    route: "/upload",
    color: "#FFF2DF",
  },
  {
    title: "AI Stylist",
    subtitle: "Ask anything",
    icon: Sparkles,
    route: "/chatbot",
    color: "#FBE8EF",
  },
  {
    title: "Build Look",
    subtitle: "Mix & match",
    icon: Wand2,
    route: "/visualize",
    color: "#EDF7EB",
  },
];

export default function FloatingActions({ navigate }) {
  return (
    <section className="relative z-20 mx-auto mt-10 mb-20 max-w-7xl px-6">

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <motion.button
              key={action.title}
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.08,
              }}
              whileHover={{
                y: -10,
                rotate: -1,
                scale: 1.02,
              }}
              whileTap={{
                scale: 0.98,
              }}
              onClick={() => navigate(action.route)}
              className="
                group
                relative
                overflow-hidden
                rounded-[32px]
                border
                border-white/40
                bg-white/25
                p-7
                text-left
                shadow-[0_25px_60px_rgba(0,0,0,.12)]
                backdrop-blur-xl
              "
            >

              <motion.div
                animate={{
                  rotate: [0, 6, -6, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                }}
                className="absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl opacity-60"
                style={{
                  background: action.color,
                }}
              />

              <div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl shadow-lg"
                style={{
                  background: action.color,
                }}
              >
                <Icon
                  size={28}
                  strokeWidth={1.8}
                  className="text-[#53392D]"
                />
              </div>

              <h3 className="font-serif text-2xl text-[#2E241F]">
                {action.title}
              </h3>

              <p className="mt-2 text-sm text-[#6F645B]">
                {action.subtitle}
              </p>

              <motion.div
                whileHover={{
                  x: 6,
                }}
                className="mt-8 text-sm font-semibold text-[#7A2E3D]"
              >
                Open →
              </motion.div>

            </motion.button>
          );
        })}

      </div>

    </section>
  );
}
