import { useCallback } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Product } from "@recalllens/shared";

import { ProductRow } from "@/components/ProductRow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { colors, layout } from "@/constants/theme";
import { text } from "@/constants/type";
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
        style={styles.list}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 96 }]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            tintColor={colors.brand}
            onRefresh={() => { void monitor(); }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={text.title}>My Products</Text>
            <Text style={text.muted}>
              {products.length === 0
                ? "Add what you buy so a new recall can be checked against it."
                : `${products.length} item${products.length === 1 ? "" : "s"} being watched.`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Card>
            <Text style={text.product}>Nothing monitored yet</Text>
            <Text style={text.body}>
              Scan a grocery receipt and the products will be watched for Canadian recalls.
            </Text>
            <Button label="Scan receipt" onPress={() => router.push("/receipt/scan")} />
          </Card>
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
  container: { flex: 1, backgroundColor: colors.bg, alignItems: "center" },
  list: { width: "100%", maxWidth: layout.maxWidth },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  header: { marginBottom: 20, gap: 8 },
});
