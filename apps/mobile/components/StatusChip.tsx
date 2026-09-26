import { StyleSheet, Text, View } from "react-native";
import type { ProductStatus } from "@recalllens/shared";

import { colors, statusLabel } from "@/constants/theme";

const tone: Record<ProductStatus, { bg: string; fg: string }> = {
  clear: { bg: "#E6F4EC", fg: colors.clear },
  needs_verification: { bg: "#FFF4E5", fg: colors.warn },
  confirmed_match: { bg: "#FDECEC", fg: colors.danger },
  dismissed: { bg: "#EEF2F0", fg: colors.inkMuted },
};

export function StatusChip({ status }: { status: ProductStatus }) {
  const t = tone[status];
  const mark =
    status === "clear"
      ? "✓"
      : status === "needs_verification"
        ? "⚠"
        : status === "confirmed_match"
          ? "🚨"
          : "·";

  return (
    <View style={[styles.chip, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>
        {mark} {statusLabel[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: "700",
  },
});
