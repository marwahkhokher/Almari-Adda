import { useState } from "react";
import Nav from "./components/Nav";
import { ToastProvider } from "./components/Toast";
import { CatalogueProvider } from "./store/CatalogueContext";
import ClosetView from "./views/ClosetView";
import UploadView from "./views/UploadView";
import OutfitsView from "./views/OutfitsView";
import VisualizeView from "./views/VisualizeView";
import ChatView from "./views/ChatView";
import { API_BASE } from "./config";

export default function App() {
  const [tab, setTab] = useState("closet");
  // Outfit handed from Outfits/Stylist to the Visualize view.
  const [pendingOutfit, setPendingOutfit] = useState(null);

  function visualize(outfit) {
    setPendingOutfit(outfit);
    setTab("visualize");
  }

  return (
    <ToastProvider>
      <CatalogueProvider>
        <div className="flex min-h-full flex-col">
          <Nav active={tab} onChange={setTab} />

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
            {tab === "closet" && <ClosetView onAddClick={() => setTab("add")} />}
            {tab === "add" && <UploadView onDone={() => setTab("closet")} />}
            {tab === "outfits" && <OutfitsView onVisualize={visualize} />}
            {tab === "visualize" && (
              <VisualizeView initialOutfit={pendingOutfit} />
            )}
            {tab === "stylist" && <ChatView onVisualize={visualize} />}
          </main>

          <footer className="border-t border-sand px-4 py-3 text-center text-xs text-ink/40">
            Almari-Adda · connected to{" "}
            <code className="rounded bg-sand px-1 py-0.5 text-ink/60">
              {API_BASE}
            </code>
          </footer>
        </div>
      </CatalogueProvider>
    </ToastProvider>
  );
}
