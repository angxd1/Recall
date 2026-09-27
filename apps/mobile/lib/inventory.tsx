import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Match, Product, Recall } from "@recalllens/shared";
import { computeSafetyScore } from "@recalllens/shared";
import { AppState, Button, Text, View } from "react-native";

import { db } from "@/lib/db";
import { checkRecalls } from "@/lib/matching";

type InventoryState = {
  products: Product[];
  matches: Match[];
  recalls: Recall[];
  loading: boolean;
  lastCheckedAt: string | null;
  refresh: () => Promise<void>;
  monitor: () => Promise<void>;
  safetyScore: ReturnType<typeof computeSafetyScore>;
  activePotentialMatches: Match[];
};

const InventoryContext = createContext<InventoryState | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const monitoring = useRef(false);

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
      setStorageError(null);
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "Unable to open saved inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  const monitor = useCallback(async () => {
    if (monitoring.current) return;
    monitoring.current = true;
    try {
      const result = await checkRecalls();
      setLastCheckedAt(result.lastCheckedAt);
      await refresh();
    } finally {
      monitoring.current = false;
    }
  }, [refresh]);

  useEffect(() => {
    void monitor();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void monitor();
    });
    const onFocus = () => { void monitor(); };
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("focus", onFocus);
    }
    return () => {
      subscription.remove();
      if (typeof window !== "undefined" && window.removeEventListener) {
        window.removeEventListener("focus", onFocus);
      }
    };
  }, [monitor]);

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
      lastCheckedAt,
      refresh,
      monitor,
      safetyScore,
      activePotentialMatches,
    }),
    [products, matches, recalls, loading, lastCheckedAt, refresh, monitor, safetyScore, activePotentialMatches]
  );

  return (
    <InventoryContext.Provider value={value}>
      {storageError ? (
        <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 16 }}>
          <Text accessibilityRole="header" style={{ fontSize: 22 }}>Unable to open inventory</Text>
          <Text>{storageError}</Text>
          <Button title="Try again" onPress={() => { void refresh(); }} />
        </View>
      ) : children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}
