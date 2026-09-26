import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SafetyScore } from "@recalllens/shared";

import { colors } from "@/constants/theme";

export function SafetyScoreCard({
  score,
  onResolve,
}: {
  score: SafetyScore;
  onResolve?: () => void;
}) {
  const unresolved = score.needsVerification + score.confirmedMatch;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Household Safety Score</Text>
      <Text style={styles.value}>{score.total} products monitored</Text>
      <View style={styles.rows}>
        <Text style={styles.ok}>✓ {score.clear} — No matched active recalls</Text>
        <Text style={styles.warn}>
          ⚠ {score.needsVerification} — Need verification
        </Text>
        <Text style={styles.danger}>
          🚨 {score.confirmedMatch} — Recall match
        </Text>
      </View>
      {unresolved > 0 && onResolve ? (
        <Pressable style={styles.resolveBtn} onPress={onResolve}>
          <Text style={styles.resolveText}>
            Resolve {unresolved} product{unresolved === 1 ? "" : "s"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  label: { fontSize: 13, fontWeight: "700", color: colors.inkMuted },
  value: { fontSize: 22, fontWeight: "800", color: colors.brand },
  rows: { gap: 4, marginTop: 4 },
  ok: { fontSize: 14, color: colors.clear, fontWeight: "600" },
  warn: { fontSize: 14, color: colors.warn, fontWeight: "600" },
  danger: { fontSize: 14, color: colors.danger, fontWeight: "600" },
  resolveBtn: {
    marginTop: 8,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  resolveText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
