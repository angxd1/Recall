import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Match, Product, Recall } from "@recalllens/shared";
import { computeSafetyScore } from "@recalllens/shared";

import { db } from "@/lib/db";

type InventoryState = {
  products: Product[];
  matches: Match[];
  recalls: Recall[];
  loading: boolean;
  refresh: () => Promise<void>;
  safetyScore: ReturnType<typeof computeSafetyScore>;
  activePotentialMatches: Match[];
};

const InventoryContext = createContext<InventoryState | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m, r] = await Promise.all([
        db.listProducts(),
        db.listMatches(),
        db.listRecalls(),
      ]);
      setProducts(p);
      setMatches(m);
      setRecalls(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const safetyScore = useMemo(() => computeSafetyScore(products), [products]);

  const activePotentialMatches = useMemo(
    () => matches.filter((m) => m.stage === "potential"),
    [matches]
  );

  const value = useMemo(
    () => ({
      products,
      matches,
      recalls,
      loading,
      refresh,
      safetyScore,
      activePotentialMatches,
    }),
    [products, matches, recalls, loading, refresh, safetyScore, activePotentialMatches]
  );

  return (
    <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}
