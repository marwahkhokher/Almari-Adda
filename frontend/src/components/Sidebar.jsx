import { useNavigate, useLocation } from 'react-router-dom';
import { Home, DoorOpen, Upload, WandSparkles, Sparkles, Heart, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: Home, path: '/dashboard' },
  { label: 'My Almari', icon: DoorOpen, path: '/closet' },
  { label: 'Upload an Item', icon: Upload, path: '/upload' },
  { label: 'Build your own Outfit', icon: WandSparkles, path: '/build-outfit' },
  { label: 'AI Stylist', icon: Sparkles, path: '/chatbot' },
  { label: 'Favourites', icon: Heart, path: '/favourites' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth() || {};
  const { user, signOut } = auth;

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest';

  const handleLogout = async () => {
    try {
      if (typeof signOut === 'function') await signOut();
    } finally {
      navigate('/auth');
    }
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col bg-[#FBF3E7] border-r border-[#e6d5b8] relative select-none z-30">
      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-b from-[#4a2f1c] via-[#3d2417] to-[#4a2f1c]">
        <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-16 rounded-full bg-gradient-to-b from-[#d4b16a] to-[#a9803f] shadow-md" />
      </div>

      <div className="pl-8 pr-5 pt-8 pb-6">
        <div className="rounded-xl border-2 border-[#c9a769] bg-gradient-to-b from-[#4a2f1c] to-[#2b1810] px-4 py-4 text-center shadow-inner">
          <p className="text-xs tracking-[0.3em] text-[#d4b16a] font-semibold">ALMARI</p>
          <p className="text-xl tracking-[0.15em] text-[#f3e6cf] font-display font-bold mt-0.5">ADDA</p>
        </div>
      </div>

      <nav className="flex-1 pl-8 pr-5 flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                active
                  ? 'bg-[#7a2331]/10 text-[#7a2331]'
                  : 'text-[#6b5645] hover:bg-[#f3e6cf] hover:text-[#3d2417]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="px-5 pt-4 pb-6">
        <div className="border-t border-[#e6d5b8] pt-4 flex items-center gap-2">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2.5 flex-1 min-w-0 rounded-xl px-2 py-2 hover:bg-[#f3e6cf] transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[#7a2331] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#3d2417] truncate">{displayName}</p>
              <p className="text-[10px] text-[#a89478] truncate">{user?.email || 'View profile'}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            title="Log out"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8a7360] hover:text-[#7a2331] hover:bg-[#f3e6cf] transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}