const TABS = [
  { id: "closet", label: "Closet", icon: "🧺" },
  { id: "add", label: "Add Item", icon: "📸" },
  { id: "outfits", label: "Outfits", icon: "✨" },
  { id: "visualize", label: "Visualize", icon: "🪞" },
  { id: "stylist", label: "Stylist", icon: "💬" },
];

export default function Nav({ active, onChange }) {
  return (
    <nav className="sticky top-0 z-30 border-b border-sand bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl">👗</span>
          <div className="leading-none">
            <h1 className="font-display text-xl font-bold tracking-tight">
              Almari-Adda
            </h1>
            <p className="hidden text-[11px] text-ink/50 sm:block">
              Your AI virtual closet
            </p>
          </div>
        </div>
        <ul className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onChange(t.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active === t.id
                    ? "bg-ink text-cream shadow-sm"
                    : "text-ink/70 hover:bg-sand"
                }`}
              >
                <span aria-hidden="true">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
