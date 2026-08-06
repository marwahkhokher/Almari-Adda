import {
  Shirt,
  Camera,
  Sparkles,
  Wand2,
  Layers3,
  Settings,
} from "lucide-react";

export default function Sidebar({
  user,
  setIsProfileOpen,
  navigate,
}) {
  return (
    <aside
      className="
        fixed left-0 top-0 hidden
        h-screen w-[275px]
        flex-col
        border-r border-white/30
        bg-[#F7EFE5]/80
        p-8
        backdrop-blur-xl
        lg:flex
      "
    >

      <div
        className="
          mb-12
          font-serif
          text-4xl
          italic
          text-[#7A2E3D]
        "
      >
        marwah's
        <span className="block text-xs tracking-[0.4em]">
          CLOSET
        </span>
      </div>


      <nav className="space-y-3">

        <button
          onClick={() => navigate("/dashboard")}
          className="flex w-full gap-3 rounded-xl p-3 hover:bg-white/50"
        >
          <Shirt size={18}/>
          Closet
        </button>


        <button
          onClick={() => navigate("/visualize")}
          className="flex w-full gap-3 rounded-xl p-3 hover:bg-white/50"
        >
          <Layers3 size={18}/>
          Visualizer
        </button>


        <button
          onClick={() => navigate("/upload")}
          className="flex w-full gap-3 rounded-xl p-3 hover:bg-white/50"
        >
          <Camera size={18}/>
          Upload Item
        </button>


        <button
          onClick={() => navigate("/visualize")}
          className="flex w-full gap-3 rounded-xl p-3 hover:bg-white/50"
        >
          <Wand2 size={18}/>
          Build Outfit
        </button>


        <button
          onClick={() => navigate("/chatbot")}
          className="flex w-full gap-3 rounded-xl p-3 hover:bg-white/50"
        >
          <Sparkles size={18}/>
          Stylist AI
        </button>

      </nav>


      <button
        onClick={() => setIsProfileOpen(true)}
        className="
          mt-auto
          flex items-center gap-3
          rounded-xl p-3
          hover:bg-white/50
        "
      >

        <div
          className="
            flex h-10 w-10
            items-center justify-center
            rounded-full
            bg-[#EBD5D7]
            text-[#7A2E3D]
          "
        >
          {(user?.user_metadata?.first_name || "M")[0]}
        </div>


        <div>
          <p className="text-sm font-semibold">
            {user?.user_metadata?.first_name || "Marwah"}
          </p>

          <p className="text-xs text-gray-500">
            Personal Studio
          </p>
        </div>

        <Settings size={15}/>

      </button>

    </aside>
  );
}
