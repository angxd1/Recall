import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import type { Product } from "@recalllens/shared";
import { DEMO_RECEIPT_ITEMS } from "@recalllens/shared";

import { ProductRow } from "@/components/ProductRow";
import { colors } from "@/constants/theme";
import { db, newId } from "@/lib/db";
import { useInventory } from "@/lib/inventory";

export default function ProductsScreen() {
  const { products, loading, refresh, matches } = useInventory();
  const [seeding, setSeeding] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const seedSample = async () => {
    setSeeding(true);
    try {
      const now = new Date().toISOString();
      const items: Product[] = DEMO_RECEIPT_ITEMS.map((item) => ({
        id: newId("prod"),
        name: item.name,
        brand: item.brand,
        retailer: "Walmart",
        purchasedAt: now,
        status: "clear",
        createdAt: now,
      }));
      await db.insertProducts(items);
      await refresh();
    } finally {
      setSeeding(false);
    }
  };

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
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>My Products</Text>
            <Text style={styles.subtitle}>
              A background record so RecallLens can answer: does this recall
              affect me?
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing monitored yet</Text>
            <Text style={styles.emptyBody}>
              Scan a receipt to add products, or load sample items for UI
              preview.
            </Text>
            <Pressable
              style={styles.seedBtn}
              onPress={seedSample}
              disabled={seeding}
            >
              {seeding ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.seedBtnText}>Load sample products</Text>
              )}
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <ProductRow product={item} onPress={() => onPressProduct(item)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 16, gap: 6 },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink },
  subtitle: { fontSize: 15, lineHeight: 21, color: colors.inkMuted },
  empty: {
    marginTop: 24,
    padding: 20,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.ink },
  emptyBody: { fontSize: 15, lineHeight: 21, color: colors.inkMuted },
  seedBtn: {
    marginTop: 6,
    backgroundColor: colors.brand,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  seedBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
