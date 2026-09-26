import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme";
import { useInventory } from "@/lib/inventory";

export default function HomeScreen() {
  const { products, safetyScore, activePotentialMatches } = useInventory();

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>RecallLens</Text>
      <Text style={styles.tagline}>
        If something you own becomes unsafe, you should know about it.
      </Text>

      {activePotentialMatches.length > 0 ? (
        <Link
          href={`/alerts/${activePotentialMatches[0].id}`}
          asChild
        >
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

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Monitored</Text>
        <Text style={styles.scoreValue}>{safetyScore.total}</Text>
        <Text style={styles.scoreMeta}>
          {products.length === 0
            ? "Scan a receipt to start"
            : `${safetyScore.clear} clear · ${safetyScore.needsVerification} need check · ${safetyScore.confirmedMatch} matched`}
        </Text>
      </View>

      <Link href="/receipt/scan" asChild>
        <Pressable style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Scan receipt</Text>
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
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4,
  },
  scoreLabel: { fontSize: 13, fontWeight: "600", color: colors.inkMuted },
  scoreValue: { fontSize: 36, fontWeight: "800", color: colors.brand },
  scoreMeta: { fontSize: 14, color: colors.inkMuted },
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
