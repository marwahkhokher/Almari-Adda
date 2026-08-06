import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

export default function Sidebar({
  navItems,
  onNavigate,
  onSignOut,
  onClose,
  mobile = false,
}) {
  const location = useLocation();
const navigate = useNavigate();

  const getActiveLabel = () => {
  const pathname = location.pathname;

  if (
    pathname === '/dashboard' ||
    pathname === '/closet'
  ) {
    return 'Closet';
  }

  if (pathname === '/visualize') {
    return 'Visualizer';
  }

  if (pathname === '/upload') {
    return 'Upload Item';
  }

  if (pathname === '/outfit-builder') {
    return 'Build Outfit';
  }

  if (pathname === '/chatbot') {
    return 'Stylist AI';
  }

  return 'Closet';
};

  const [activeLabel, setActiveLabel] = useState(
    getActiveLabel
  );

  useEffect(() => {
    setActiveLabel(getActiveLabel());
  }, [location.pathname]);

  /*
    These positions are matched to the generated
    almari-sidebar.png artwork.
  */
  const buttonPositions = [
    {
      label: 'Closet',
      top: '28.7%',
      height: '7.1%',
    },
    {
      label: 'Visualizer',
      top: '35.8%',
      height: '7.1%',
    },
    {
      label: 'Upload Item',
      top: '42.9%',
      height: '7.1%',
    },
    {
      label: 'Build Outfit',
      top: '50%',
      height: '7.1%',
    },
    {
      label: 'Stylist AI',
      top: '57.1%',
      height: '7.1%',
    },
  ];

  const handleSidebarClick = (navItem, position) => {
  setActiveLabel(position.label);

  if (navItem?.route) {
    navigate(navItem.route);
  } else {
    onNavigate?.(navItem);
  }

  if (mobile && onClose) {
    onClose();
  }
};

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#3b2113]">
      {/* Sidebar artwork */}
      <img
        src="/almari-sidebar.png"
        alt="Almari Adda sidebar"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none object-fill"
        draggable={false}
        onError={(event) => {
          console.error(
            'Sidebar image failed to load. Expected: public/almari-sidebar.png'
          );

          event.currentTarget.style.display =
            'none';
        }}
      />
      {/* Decorative cover image */}
<img
  src="/cover.png"
  alt=""
  className="absolute z-10 pointer-events-none select-none"
  style={{
    left: '15%',
    top: '65%',
    width: '180px',
    height: 'auto',
  }}
/>

      {/* Mobile close button */}
      {mobile && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="absolute right-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-[#d8b87a]/50 bg-[#2a140b]/80 text-[#f5e6cf] shadow-lg backdrop-blur transition hover:bg-[#4a2818]"
        >
          <X size={17} />
        </button>
      )}

      {/* Functional menu buttons */}
      <nav className="absolute inset-0 z-20">
        {buttonPositions.map(
          (position, index) => {
            const navItem = navItems[index];

            if (!navItem) {
              return null;
            }

            const isActive =
              activeLabel === position.label;

            return (
              <button
                key={position.label}
                type="button"
                onClick={() =>
                  handleSidebarClick(
                    navItem,
                    position
                  )
                }
                aria-label={position.label}
                aria-current={
                  isActive ? 'page' : undefined
                }
                title={position.label}
                className={`
                group absolute left-[11.8%] w-[76.4%]
                overflow-hidden rounded-[10px]
                cursor-pointer
                bg-transparent
                border
                transition-all duration-300
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#c99a55]
                focus-visible:ring-offset-2
                focus-visible:ring-offset-[#4a2918]
                hover:brightness-[1.04]
                active:scale-[0.99]
                ${
                  isActive
                    ? `
                      border-[#7A5536]
                      border-[2px]
                      brightness-[1.04]
                      shadow-[0_0_0_1px_rgba(122,85,54,.45),0_0_16px_rgba(74,44,29,.35),inset_0_0_14px_rgba(255,255,255,.08)]
                    `
                    : `
                      border-transparent
                      hover:border-[#8B6444]
                      hover:shadow-[0_0_10px_rgba(74,44,29,.20)]
                    `
                }
              `}
                style={{
                  top: position.top,
                  height: position.height,
                }}
              >


                {/* Active left marker */}
                {/* Active border */}
                  <span
                    className={`
                      pointer-events-none
                      absolute
                      inset-0
                      rounded-[10px]
                      transition-opacity
                      duration-300
                      ${
                        isActive
                          ? 'opacity-100'
                          : 'opacity-0'
                      }
                    `}
                  >
                    <span className="absolute left-0 top-[15%] bottom-[15%] w-[5px] rounded-r-full bg-gradient-to-b from-[#9C7350] via-[#6B4329] to-[#3F2618]" />

                    <span className="absolute left-2 right-2 top-0 h-[2px] rounded-full bg-[#F4D48B] shadow-[0_0_8px_rgba(255,220,120,.9)]" />

                    <span className="absolute left-2 right-2 bottom-0 h-[2px] rounded-full bg-[#F4D48B] shadow-[0_0_8px_rgba(255,220,120,.7)]" />
                  </span>

                {/* Hover sheen */}
                <span className="pointer-events-none absolute inset-y-0 left-[-40%] w-[35%] skew-x-[-16deg] bg-white/8 opacity-0 transition-all duration-500 group-hover:left-[115%] group-hover:opacity-100" />
              </button>
            );
          }
        )}

        {/* Drawer handle: sign out */}
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sign out"
          title="Sign out"
          className="
            group absolute left-[27%] top-[83%]
            h-[5.5%] w-[46%]
            rounded-full bg-transparent
            transition-all duration-200
            hover:bg-[#d5aa6a]/12
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#d5aa6a]
          "
        >
          <span className="absolute left-1/2 top-1/2 rounded-full bg-[#d5aa6a]/20 px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f2dbb1] opacity-0 shadow-lg backdrop-blur-sm transition -translate-x-1/2 -translate-y-1/2 group-hover:opacity-100">
            Sign out
          </span>
        </button>
      </nav>
    </div>
  );
}
