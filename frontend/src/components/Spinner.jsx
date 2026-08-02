export default function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink/60">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-sand border-t-clay" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
