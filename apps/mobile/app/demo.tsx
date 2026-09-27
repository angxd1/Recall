import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { colors, fonts, radius } from "@/constants/theme";
import { api, API_BASE } from "@/lib/api";
import { db } from "@/lib/db";
import { useInventory } from "@/lib/inventory";
import { syncAndMatch } from "@/lib/matching";

export default function DemoScreen() {
  const { refresh, products, recalls, activePotentialMatches } = useInventory();
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string>("");
  const router = useRouter();

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
        <Text style={styles.stat}>
          {activePotentialMatches.length} potential
        </Text>
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
            const matchResult = await syncAndMatch();
            return `${message}. Created ${matchResult.matchesCreated} potential match(es).`;
          })
        }
      >
        {busy === "inject" ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Inject demo recall + match</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.btn}
        disabled={!!busy}
        onPress={() =>
          run("match", async () => {
            const result = await syncAndMatch();
            return `Matching (${result.source}): ${result.matchesCreated} new potential match(es)`;
          })
        }
      >
        {busy === "match" ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Run Stage-1 matching</Text>
        )}
      </Pressable>

      {activePotentialMatches[0] ? (
        <Pressable
          style={[styles.btn, styles.warn]}
          onPress={() => router.push(`/alerts/${activePotentialMatches[0].id}`)}
        >
          <Text style={styles.btnText}>Open potential alert</Text>
        </Pressable>
      ) : null}

      <Pressable
        style={[styles.btn, styles.danger]}
        disabled={!!busy}
        onPress={() =>
          run("reset", async () => {
            await db.clearProducts();
            try {
              await api.resetRecalls();
            } catch {
              // ignore
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
  title: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 38, color: colors.ink },
  body: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.inkMuted,
    marginBottom: 8,
  },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 4 },
  stat: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.brand },
  btn: {
    backgroundColor: colors.brand,
    minHeight: 48,
    paddingVertical: 14,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  accent: { backgroundColor: colors.accent },
  warn: { backgroundColor: colors.warn },
  danger: { backgroundColor: colors.danger },
  btnText: {
    fontFamily: fonts.sansBold,
    color: colors.onBrand,
    fontSize: 17,
    textAlign: "center",
  },
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
