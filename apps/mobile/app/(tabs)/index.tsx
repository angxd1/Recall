import { Link, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SafetyScoreCard } from "@/components/SafetyScoreCard";
import { colors } from "@/constants/theme";
import { useInventory } from "@/lib/inventory";

export default function HomeScreen() {
  const { safetyScore, activePotentialMatches, matches } = useInventory();
  const router = useRouter();

  const resolveTarget =
    activePotentialMatches[0] ??
    matches.find((m) => m.stage === "confirmed");

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>RecallLens</Text>
      <Text style={styles.tagline}>
        If something you own becomes unsafe, you should know about it.
      </Text>

      {activePotentialMatches.length > 0 ? (
        <Link href={`/alerts/${activePotentialMatches[0].id}`} asChild>
          <Pressable style={styles.alertBanner}>
            <Text style={styles.alertTitle}>Potential recall detected</Text>
            <Text style={styles.alertBody}>
              {activePotentialMatches.length} product
              {activePotentialMatches.length === 1 ? "" : "s"} may be affected —
              package verification required.
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
          <Text style={styles.secondaryBtnText}>Scan barcode</Text>
        </Pressable>
      </Link>

      <Link href="/(tabs)/products" asChild>
        <Pressable style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>View My Products</Text>
        </Pressable>
      </Link>

      <Link href="/demo" asChild>
        <Pressable style={styles.ghostBtn}>
          <Text style={styles.ghostBtnText}>Demo controls</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: colors.bg,
    gap: 14,
  },
  brand: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.inkMuted,
    marginBottom: 8,
  },
  alertBanner: {
    backgroundColor: colors.banner,
    borderColor: "#F0C989",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  alertTitle: { fontSize: 16, fontWeight: "800", color: colors.accent },
  alertBody: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  primaryBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.ink, fontSize: 16, fontWeight: "600" },
  ghostBtn: { alignItems: "center", paddingVertical: 8 },
  ghostBtnText: { color: colors.inkMuted, fontSize: 14, fontWeight: "600" },
});
