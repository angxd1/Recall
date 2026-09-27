import { Link, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SafetyScoreCard } from "@/components/SafetyScoreCard";
import { colors } from "@/constants/theme";
import { useInventory } from "@/lib/inventory";

function formatChecked(iso: string | null) {
  if (!iso) return "Not checked yet";
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "Not checked yet";
  return `Last checked ${when.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export default function HomeScreen() {
  const { safetyScore, activePotentialMatches, matches, lastCheckedAt } = useInventory();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const resolveTarget =
    activePotentialMatches[0] ??
    matches.find((m) => m.stage === "confirmed");
  const alertCount = activePotentialMatches.length;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 28 }]}
    >
      <Text style={styles.brand}>RecallLens</Text>
      <Text style={styles.status}>
        {safetyScore.total} product{safetyScore.total === 1 ? "" : "s"} monitored
        {"\n"}
        {formatChecked(lastCheckedAt)}
      </Text>

      {alertCount > 0 ? (
        <Link href={`/alerts/${activePotentialMatches[0].id}`} asChild>
          <Pressable style={styles.alertBanner}>
            <Text style={styles.alertTitle}>Check a product</Text>
            <Text style={styles.alertBody}>
              {alertCount} item{alertCount === 1 ? "" : "s"} may match a Canadian recall.
              Open the package before treating it as affected.
            </Text>
          </Pressable>
        </Link>
      ) : null}

      <SafetyScoreCard
        score={safetyScore}
        onResolve={
          resolveTarget
            ? () =>
                router.push(
                  resolveTarget.stage === "confirmed"
                    ? `/action/${resolveTarget.id}`
                    : `/alerts/${resolveTarget.id}`
                )
            : undefined
        }
      />

      <Link href="/receipt/scan" asChild>
        <Pressable style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Scan receipt</Text>
        </Pressable>
      </Link>

      <Link href="/barcode" asChild>
        <Pressable style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Add a barcode</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    backgroundColor: colors.bg,
    gap: 16,
  },
  brand: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -0.8,
  },
  status: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.inkMuted,
  },
  alertBanner: {
    backgroundColor: colors.banner,
    borderColor: "#F0C989",
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  alertTitle: { fontSize: 20, fontWeight: "800", color: colors.accent },
  alertBody: { fontSize: 16, color: colors.ink, lineHeight: 22 },
  primaryBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.ink, fontSize: 16, fontWeight: "600" },
});
