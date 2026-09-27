import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ProductStatus } from "@recalllens/shared";

import { colors, fonts, radius, statusLabel } from "@/constants/theme";

const tone: Record<ProductStatus, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  clear: { bg: colors.clearSoft, fg: colors.clear, icon: "checkmark-circle-outline" },
  needs_verification: { bg: colors.warnSoft, fg: colors.warn, icon: "alert-circle-outline" },
  confirmed_match: { bg: colors.dangerSoft, fg: colors.danger, icon: "warning-outline" },
  dismissed: { bg: colors.track, fg: colors.inkMuted, icon: "ellipse-outline" },
};

export function StatusChip({ status }: { status: ProductStatus }) {
  const t = tone[status];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }]} accessibilityRole="text">
      <Ionicons
        name={t.icon}
        size={16}
        color={t.fg}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text style={[styles.text, { color: t.fg }]}>{statusLabel[status]}</Text>
    </View>
  );
}

export const statusRail: Record<ProductStatus, string> = {
  clear: colors.clear,
  needs_verification: colors.warn,
  confirmed_match: colors.danger,
  dismissed: colors.border,
};

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.chip,
  },
  text: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    lineHeight: 18,
  },
});
