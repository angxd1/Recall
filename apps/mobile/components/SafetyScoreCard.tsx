import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SafetyScore } from "@recalllens/shared";

import { colors, fonts, radius } from "@/constants/theme";
import { text } from "@/constants/type";

export function SafetyScoreCard({
  score,
  onResolve,
}: {
  score: SafetyScore;
  onResolve?: () => void;
}) {
  const unresolved = score.needsVerification + score.confirmedMatch;
  const parts = [
    { key: "clear", count: score.clear, color: colors.clear, label: "No known recall", icon: "checkmark-circle-outline" as const },
    { key: "check", count: score.needsVerification, color: colors.warn, label: "Check package", icon: "alert-circle-outline" as const },
    { key: "match", count: score.confirmedMatch, color: colors.danger, label: "Recall match", icon: "warning-outline" as const },
  ];
  const total = parts.reduce((sum, part) => sum + part.count, 0);

  return (
    <View
      style={styles.card}
      accessibilityLabel={`${score.clear} with no known recall, ${score.needsVerification} to check, ${score.confirmedMatch} recall matches`}
    >
      <View style={styles.track}>
        {total === 0 ? <View style={[styles.segment, styles.empty]} /> : null}
        {total > 0
          ? parts.map((part) =>
              part.count > 0 ? (
                <View
                  key={part.key}
                  style={[styles.segment, { flex: part.count, backgroundColor: part.color }]}
                />
              ) : null
            )
          : null}
      </View>
      <View style={styles.rows}>
        {parts.map((part) => (
          <View key={part.key} style={styles.row}>
            <Ionicons
              name={part.icon}
              size={18}
              color={part.color}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[styles.count, { color: part.color }]}>{part.count}</Text>
            <Text style={styles.rowLabel}>{part.label}</Text>
          </View>
        ))}
      </View>
      {unresolved > 0 && onResolve ? (
        <Pressable
          accessibilityRole="button"
          onPress={onResolve}
          style={({ pressed }) => [styles.resolve, pressed && styles.pressed]}
        >
          <Text style={text.button}>
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
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 16,
  },
  track: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: colors.track,
    gap: 2,
  },
  segment: { height: 10 },
  empty: { flex: 1, backgroundColor: colors.track },
  rows: { gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  count: { fontFamily: fonts.sansBold, fontSize: 16, minWidth: 16 },
  rowLabel: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 22, color: colors.ink },
  resolve: { minHeight: 44, justifyContent: "center" },
  pressed: { opacity: 0.92 },
});
