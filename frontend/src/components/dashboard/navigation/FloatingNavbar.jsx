import { motion } from "framer-motion";
import {
  Shirt,
  Sparkles,
  Camera,
  Layers3,
  User,
} from "lucide-react";

export default function FloatingNavbar({
  active = "closet",
  setActive,
  navigate,
  user,
}) {
  const links = [
    {
      id: "closet",
      label: "Closet",
      icon: Shirt,
      route: "/dashboard",
    },
    {
      id: "visualizer",
      label: "Visualizer",
      icon: Layers3,
      route: "/visualize",
    },
    {
      id: "upload",
      label: "Upload",
      icon: Camera,
      route: "/upload",
    },
    {
      id: "stylist",
      label: "AI Stylist",
      icon: Sparkles,
      route: "/chatbot",
    },
  ];

  return (
    <motion.header
      initial={{ y: -25, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-6"
    >
      <div className="flex items-center gap-8 rounded-full border border-white/30 bg-white/15 backdrop-blur-xl shadow-2xl px-8 py-4">

        <div className="mr-6">
          <h1 className="font-serif text-2xl italic tracking-tight text-[#43281B]">
            Marwah's Closet
          </h1>
        </div>

        {links.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActive?.(item.id);
                navigate(item.route);
              }}
              className="relative"
            >
              <motion.div
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.97,
                }}
                className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${
                  selected
                    ? "bg-white text-[#7A2E3D] shadow-lg"
                    : "text-[#473C34] hover:bg-white/40"
                }`}
              >
                <Icon size={16} strokeWidth={1.8} />

                <span className="text-sm font-medium">
                  {item.label}
                </span>
              </motion.div>

              {selected && (
                <motion.div
                  layoutId="navbar-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-white"
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 35,
                  }}
                />
              )}
            </button>
          );
        })}

        <div className="ml-4 flex items-center gap-3 border-l border-black/10 pl-6">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-white/50 bg-white/70 flex items-center justify-center">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <User
                size={18}
                strokeWidth={1.8}
                className="text-[#6B5A4D]"
              />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-[#3D312A]">
              {user?.user_metadata?.first_name || "Marwah"}
            </p>

            <p className="text-xs text-[#7D7268]">
              Fashion Studio
            </p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
