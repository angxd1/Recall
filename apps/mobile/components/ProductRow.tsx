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
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        {product.brand ? (
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
        ) : null}
        <Text style={styles.meta}>Purchased {formatDate(product.purchasedAt)}</Text>
      </View>
      <StatusChip status={product.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  pressed: { opacity: 0.85 },
  main: { gap: 2 },
  name: { fontSize: 17, fontWeight: "700", color: colors.ink },
  brand: { fontSize: 14, color: colors.inkMuted },
  meta: { fontSize: 13, color: colors.inkMuted, marginTop: 4 },
});
