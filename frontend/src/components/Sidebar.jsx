import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, DoorOpen, Upload, WandSparkles, Sparkles, Heart, LogOut, Shirt } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

// Update these paths to match your router as those screens go live.
const NAV_ITEMS = [
  { label: 'Dashboard', icon: Home, path: '/dashboard' },
  { label: 'My Almari', icon: DoorOpen, path: '/closet' },
  { label: 'Visualize', icon: Shirt, path: '/visualize' },
  { label: 'Upload an Item', icon: Upload, path: '/upload' },
  { label: 'Build your own Outfit', icon: WandSparkles, path: '/build-outfit' },
  { label: 'AI Stylist', icon: Sparkles, path: '/chatbot' },
  { label: 'Favourites', icon: Heart, path: '/favourites' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest';

  const handleLogout = async () => {
    try {
      if (typeof signOut === 'function') await signOut();
    } finally {
      navigate('/auth');
    }
  };

  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col bg-[#FBF3E7] border-r border-[#e6d5b8] relative">
      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-b from-[#4a2f1c] via-[#3d2417] to-[#4a2f1c]">
        <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-16 rounded-full bg-gradient-to-b from-[#d4b16a] to-[#a9803f] shadow-md" />
      </div>

      {/* Redesigned logo plaque: wood-grain background, ornate double
          border, both words in a clear serif font at readable sizes,
          small diamond ornaments flanking ADDA — matches the reference
          wood-carved plaque look instead of the small stacked text. */}
      <div className="pl-8 pr-5 pt-12 pb-6">
        <div
          className="relative rounded-lg border-2 border-[#c9a769] px-5 py-5 text-center shadow-lg overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(160deg, #5c3a22 0%, #3d2417 55%, #2b1810 100%)",
          }}
        >
          {/* subtle inner border for a carved-frame effect */}
          <div className="absolute inset-1.5 rounded-md border border-[#c9a769]/40 pointer-events-none" />

          <p className="relative font-display text-2xl tracking-[0.2em] text-[#f3e6cf] font-bold leading-none">
            ALMARI
          </p>
          <div className="relative flex items-center justify-center gap-2 mt-1.5">
            <span className="text-[#c9a769] text-xs">◆</span>
            <p className="font-display text-2xl tracking-[0.15em] text-[#d4b16a] font-bold leading-none">
              ADDA
            </p>
            <span className="text-[#c9a769] text-xs">◆</span>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-2 pl-8 pr-5">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="relative text-left shrink-0"
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active-glow"
                  className="absolute inset-0 rounded-xl bg-[#7a2331]/10 shadow-[0_0_20px_rgba(122,35,49,0.35)] ring-1 ring-[#7a2331]/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <motion.span
                whileTap={{ scale: 0.94 }}
                whileHover={!active ? { x: 2 } : undefined}
                className={`relative z-10 flex items-center gap-3.5 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  active
                    ? 'text-[#7a2331]'
                    : 'text-[#6b5645] hover:bg-[#f3e6cf] hover:text-[#3d2417]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {label}
              </motion.span>
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="px-5 pb-7">
        <div className="border-t border-[#e6d5b8] pt-5">
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-3.5 rounded-xl px-3 py-3 hover:bg-[#f3e6cf] transition-colors text-left"
          >
            <div className="w-11 h-11 rounded-full bg-[#7a2331] text-white flex items-center justify-center text-sm font-bold shrink-0">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#3d2417] truncate">{displayName}</p>
              <p className="text-xs text-[#a89478] truncate">{user?.email || 'View profile'}</p>
            </div>
          </button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogout}
            className="mt-2 w-full flex items-center justify-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium text-[#8a7360] border border-[#e6d5b8] hover:text-[#7a2331] hover:border-[#7a2331]/30 hover:bg-[#f3e6cf] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </motion.button>
        </div>
      </div>
    </aside>
  );
}