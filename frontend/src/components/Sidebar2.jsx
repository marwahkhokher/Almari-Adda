import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import {
  X,
  LayoutDashboard,
  Shirt,
  WandSparkles,
  Layers3,
  Upload,
  MessageCircleMore,
} from 'lucide-react';

export default function Sidebar({
  navItems = [],
  onNavigate,
  onSignOut,
  onClose,
  mobile = false,
}) {
  const location = useLocation();

  const getActiveLabel = () => {
    const pathname = location.pathname;

    if (pathname === '/dashboard') {
      return 'Dashboard';
    }

    if (pathname === '/closet') {
      return 'Closet';
    }

    if (pathname === '/visualize') {
      return 'Visualizer';
    }

    if (pathname === '/upload') {
      return 'Upload Item';
    }

    if (
      pathname === '/build-outfit' ||
      pathname === '/outfit-builder'
    ) {
      return 'Build Outfit';
    }

    if (pathname === '/chatbot') {
      return 'AI Stylist';
    }

    return 'Dashboard';
  };

  const [activeLabel, setActiveLabel] = useState(
    getActiveLabel
  );

  useEffect(() => {
    setActiveLabel(getActiveLabel());
  }, [location.pathname]);

  /*
    Visible sidebar buttons.

    The route keys let this component locate the correct
    item even if navItems is arranged in a different order.
  */
  const sidebarButtons = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      alternateRoutes: [],
      icon: LayoutDashboard,
    },
    {
  label: 'Closet',
  route: '/closet',
  alternateRoutes: [],
  icon: Shirt,
},
    {
      label: 'Visualizer',
      route: '/visualize',
      alternateRoutes: [],
      icon: WandSparkles,
    },
    {
      label: 'Upload Item',
      route: '/upload',
      alternateRoutes: [],
      icon: Upload,
    },
    {
      label: 'Build Outfit',
      route: '/build-outfit',
      alternateRoutes: ['/outfit-builder'],
      icon: Layers3,
    },
    {
      label: 'AI Stylist',
      route: '/chatbot',
      alternateRoutes: [],
      icon: MessageCircleMore,
    },
  ];

  const findNavItem = (button, index) => {
    const matchingItem = navItems.find((item) => {
      const itemRoute = item?.route || item?.path;

      const labelMatches = [
        button.label,
        button.label === 'AI Stylist'
          ? 'Stylist AI'
          : button.label,
      ].some(
        (label) =>
          item?.label
            ?.toLowerCase()
            .trim() === label.toLowerCase()
      );

      const routeMatches =
        itemRoute === button.route ||
        button.alternateRoutes.includes(itemRoute);

      return labelMatches || routeMatches;
    });

    return matchingItem || { label: button.label, route: button.route };
  };

  const handleSidebarClick = (button, index) => {
    const navItem = findNavItem(button, index);

    setActiveLabel(button.label);

    if (navItem) {
      onNavigate?.(navItem);
    }

    if (mobile) {
      onClose?.();
    }
  };

  return (
    <aside className="relative h-full w-full overflow-hidden bg-[#3b2113]">
      {/* Background artwork */}
      <img
        src="/plain.png"
        alt=""
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0 z-0
          h-full w-full
          select-none object-fill
        "
        draggable={false}
        onError={(event) => {
          console.error(
            'Sidebar image failed to load. Expected public/plain.png'
          );

          event.currentTarget.style.display = 'none';
        }}
      />

      {/* Dark layer to keep buttons readable */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[#241108]/10" />

      {/* Mobile close button */}
      {mobile && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="
            absolute right-3 top-3 z-50
            flex h-8 w-8
            items-center justify-center
            rounded-full
            border border-[#d8b87a]/50
            bg-[#2a140b]/85
            text-[#f5e6cf]
            shadow-lg backdrop-blur
            transition
            hover:bg-[#4a2818]
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-[#e1bd79]
          "
        >
          <X size={17} />
        </button>
      )}

      {/* Visible navigation buttons */}
      <nav
        aria-label="Main navigation"
        className="
          absolute left-[10%] right-[10%]
          top-[30%] z-20
          flex flex-col gap-2.5
        "
      >
        {sidebarButtons.map((button, index) => {
          const Icon = button.icon;
          const isActive =
            activeLabel === button.label;

          return (
            <button
              key={button.label}
              type="button"
              onClick={() =>
                handleSidebarClick(button, index)
              }
              aria-current={
                isActive ? 'page' : undefined
              }
              className={`
                group relative
                flex min-h-[48px] w-[88%] mx-auto
                items-center gap-3
                overflow-hidden
                rounded-xl
                border
                px-3.5 py-2
                text-left
                transition-all duration-300
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#e9c47b]
                focus-visible:ring-offset-2
                focus-visible:ring-offset-[#3b2113]
                ${
                  isActive
                    ? `
                      border-[#e6c17a]
                      bg-gradient-to-r
                      from-[#4a2919]/95
                      via-[#5b3621]/95
                      to-[#422416]/95
                      text-[#fff4dc]
                      shadow-[0_7px_18px_rgba(24,10,4,0.34),inset_0_1px_0_rgba(255,225,170,0.25)]
                      -translate-y-[1px]
                    `
                    : `
                      border-[#8b6444]/55
                      bg-[#65402b]/72
                      text-[#f1dfc5]
                      shadow-[0_5px_12px_rgba(25,10,4,0.18)]
                      backdrop-blur-[2px]
                      hover:-translate-y-[1px]
                      hover:border-[#d6ad6a]
                      hover:bg-[#59341f]/95
                      hover:text-[#fff5df]
                      hover:shadow-[0_8px_18px_rgba(25,10,4,0.3)]
                    `
                }
              `}
            >
              {/* Selected button overlay */}
              <span
                className={`
                  pointer-events-none absolute inset-0 rounded-xl
                  transition-opacity duration-300
                  ${isActive ? 'opacity-100' : 'opacity-0'}
                `}
              >
                <span className="absolute inset-0 rounded-xl bg-[#f3d49a]/14" />
                <span className="absolute inset-[3px] rounded-[9px] border border-[#f2cf88]/35" />
                <span className="absolute left-3 right-3 top-0 h-px bg-gradient-to-r from-transparent via-[#ffe3a4]/80 to-transparent" />
              </span>

              {/* Active left indicator */}
              <span
                className={`
                  absolute bottom-2 left-0 top-2
                  w-[4px]
                  rounded-r-full
                  bg-gradient-to-b
                  from-[#ffe19d]
                  via-[#c8954e]
                  to-[#8d5b2d]
                  transition-opacity duration-300
                  ${
                    isActive
                      ? 'opacity-100'
                      : 'opacity-0'
                  }
                `}
              />

              {/* Hover shine */}
              <span
                className="
                  pointer-events-none
                  absolute inset-y-0
                  left-[-45%]
                  w-[32%]
                  skew-x-[-18deg]
                  bg-white/10
                  opacity-0
                  transition-all duration-500
                  group-hover:left-[120%]
                  group-hover:opacity-100
                "
              />

              {/* Icon */}
              <span
                className={`
                  relative z-10
                  flex h-8 w-8
                  shrink-0
                  items-center justify-center
                  rounded-lg
                  border
                  transition-colors duration-300
                  ${
                    isActive
                      ? `
                        border-[#e5bd72]/70
                        bg-[#2e170e]/65
                        text-[#f8d993]
                      `
                      : `
                        border-[#b38a59]/35
                        bg-[#321a10]/45
                        text-[#d8b178]
                        group-hover:border-[#ddb875]/60
                        group-hover:text-[#ffe0a0]
                      `
                  }
                `}
              >
                <Icon
                  size={16}
                  strokeWidth={1.9}
                />
              </span>

              {/* Real tab name */}
              <span
  className="
    relative z-10
    font-serif
    text-[15px]
    font-semibold
    tracking-[0.04em]
  "
>
  {button.label}
</span>

              {/* Small selected dot */}
              <span
                className={`
                  relative z-10
                  ml-auto h-2 w-2
                  rounded-full
                  bg-[#f2ce85]
                  shadow-[0_0_8px_rgba(242,206,133,0.85)]
                  transition-all duration-300
                  ${
                    isActive
                      ? 'scale-100 opacity-100'
                      : 'scale-75 opacity-0'
                  }
                `}
              />
            </button>
          );
        })}
      </nav>

      {/* Sign-out area over the artwork handle */}
      <button
        type="button"
        onClick={onSignOut}
        aria-label="Sign out"
        className="
          group absolute
          bottom-[9%] left-1/2 z-20
          flex h-10 w-[48%]
          -translate-x-1/2
          items-center justify-center
          rounded-full
          border border-transparent
          bg-transparent
          transition-all duration-200
          hover:border-[#d5aa6a]/30
          hover:bg-[#2a140b]/35
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[#d5aa6a]
        "
      >
        <span
          className="
            rounded-full
            bg-[#2b160d]/85
            px-4 py-1.5
            font-sans
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.17em]
            text-[#f2dbb1]
            opacity-0
            shadow-lg
            backdrop-blur-sm
            transition-opacity
            group-hover:opacity-100
            group-focus-visible:opacity-100
          "
        >
          Sign out
        </span>
      </button>
    </aside>
  );
}