import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "@/constants/theme";
import { api, API_BASE } from "@/lib/api";
import { db } from "@/lib/db";
import { useInventory } from "@/lib/inventory";

export default function DemoScreen() {
  const { refresh, products, recalls } = useInventory();
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string>("");

  const run = async (label: string, fn: () => Promise<string>) => {
    setBusy(label);
    try {
      const msg = await fn();
      setLog(msg);
      await refresh();
    } catch (e) {
      setLog(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Demo controls</Text>
      <Text style={styles.body}>
        Use these during the judge demo if the live feed is slow or offline.
        API: {API_BASE}
      </Text>

      <View style={styles.stats}>
        <Text style={styles.stat}>{products.length} products</Text>
        <Text style={styles.stat}>{recalls.length} recalls cached</Text>
      </View>

      <Pressable
        style={styles.btn}
        disabled={!!busy}
        onPress={() =>
          run("sync", async () => {
            const result = await api.syncRecalls();
            const list = await api.listRecalls();
            for (const recall of list.recalls) {
              await db.upsertRecall(recall);
            }
            return `Synced ${result.imported} from ${result.source} (total ${result.total})`;
          })
        }
      >
        {busy === "sync" ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Sync Health Canada recalls</Text>
        )}
      </Pressable>

      <Pressable
        style={[styles.btn, styles.accent]}
        disabled={!!busy}
        onPress={() =>
          run("inject", async () => {
            const { recall, message } = await api.injectDemoRecall();
            await db.upsertRecall(recall);
            return `${message}: ${recall.title}`;
          })
        }
      >
        {busy === "inject" ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Inject demo recall (ABC Granola Bars)</Text>
        )}
      </Pressable>

      <Pressable
        style={[styles.btn, styles.danger]}
        disabled={!!busy}
        onPress={() =>
          run("reset", async () => {
            await db.clearProducts();
            try {
              await api.resetRecalls();
            } catch {
              // ignore API reset failure
            }
            return "Inventory and local matches cleared";
          })
        }
      >
        {busy === "reset" ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Reset inventory</Text>
        )}
      </Pressable>

      {log ? (
        <View style={styles.logBox}>
          <Text style={styles.logLabel}>Last result</Text>
          <Text style={styles.log}>{log}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: "800", color: colors.ink },
  body: { fontSize: 14, lineHeight: 20, color: colors.inkMuted, marginBottom: 8 },
  stats: { flexDirection: "row", gap: 16, marginBottom: 4 },
  stat: { fontSize: 13, fontWeight: "700", color: colors.brand },
  btn: {
    backgroundColor: colors.brand,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  accent: { backgroundColor: colors.accent },
  danger: { backgroundColor: colors.danger },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15, textAlign: "center" },
  logBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  logLabel: { fontSize: 12, fontWeight: "700", color: colors.inkMuted },
  log: { fontSize: 14, color: colors.ink, lineHeight: 20 },
});
