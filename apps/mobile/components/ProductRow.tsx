import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Product } from "@recalllens/shared";

import { StatusChip } from "@/components/StatusChip";
import { colors } from "@/constants/theme";

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
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <StatusChip status={product.status} />
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
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
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  pressed: { opacity: 0.85 },
  main: { gap: 4 },
  name: { fontSize: 20, fontWeight: "800", color: colors.ink, lineHeight: 26 },
  meta: { fontSize: 15, color: colors.inkMuted },
});
