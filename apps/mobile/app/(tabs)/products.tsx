import { useCallback } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Product } from "@recalllens/shared";

import { ProductRow } from "@/components/ProductRow";
import { colors } from "@/constants/theme";
import { useInventory } from "@/lib/inventory";

export default function ProductsScreen() {
  const { products, loading, refresh, monitor, matches } = useInventory();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const onPressProduct = (product: Product) => {
    const match = matches.find(
      (m) =>
        m.productId === product.id &&
        (m.stage === "potential" || m.stage === "confirmed")
    );
    if (match?.stage === "confirmed") {
      router.push(`/action/${match.id}`);
    } else if (match?.stage === "potential") {
      router.push(`/alerts/${match.id}`);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 12 }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => { void monitor(); }} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>My Products</Text>
            <Text style={styles.subtitle}>
              {products.length === 0
                ? "Add what you buy so a new recall can be checked against it."
                : `${products.length} item${products.length === 1 ? "" : "s"} being watched.`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing monitored yet</Text>
            <Text style={styles.emptyBody}>
              Scan a grocery receipt and the products will be watched for Canadian recalls.
            </Text>
            <Pressable style={styles.scanBtn} onPress={() => router.push("/receipt/scan")}>
              <Text style={styles.scanBtnText}>Scan receipt</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <ProductRow product={item} onPress={() => onPressProduct(item)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 18, gap: 8, paddingTop: 12 },
  title: { fontSize: 32, fontWeight: "800", color: colors.ink },
  subtitle: { fontSize: 16, lineHeight: 22, color: colors.inkMuted },
  empty: {
    marginTop: 12,
    padding: 22,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: colors.ink },
  emptyBody: { fontSize: 16, lineHeight: 22, color: colors.inkMuted },
  scanBtn: {
    marginTop: 4,
    backgroundColor: colors.brand,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  scanBtnText: { color: "#fff", fontWeight: "700", fontSize: 17 },
});
