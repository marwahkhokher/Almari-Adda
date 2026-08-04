import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getCatalogue } from "../api";

// Shared catalogue state so Closet, Outfits and Visualize all read from one
// source of truth and a single refresh updates every view.
const CatalogueContext = createContext(null);

export function useCatalogue() {
  const ctx = useContext(CatalogueContext);
  if (!ctx) throw new Error("useCatalogue must be used within CatalogueProvider");
  return ctx;
}

export function CatalogueProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCatalogue();
      setItems(data);
      return data;
    } catch (err) {
      setError(err.message || "Failed to load catalogue");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <CatalogueContext.Provider value={{ items, loading, error, refresh }}>
      {children}
    </CatalogueContext.Provider>
  );
}
