import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Product } from "@recalllens/shared";

import { statusRail, StatusChip } from "@/components/StatusChip";
import { colors, radius } from "@/constants/theme";
import { text } from "@/constants/type";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function ProductRow({
  product,
  onPress,
}: {
  product: Product;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.rail, { backgroundColor: statusRail[product.status] }]} />
      <StatusChip status={product.status} />
      <View style={styles.main}>
        <Text style={text.product} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={text.muted} numberOfLines={1}>
          {[product.brand, `Purchased ${formatDate(product.purchasedAt)}`]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: 18,
    paddingRight: 18,
    paddingLeft: 22,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    overflow: "hidden",
  },
  rail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  pressed: { opacity: 0.92 },
  main: { gap: 4 },
});
