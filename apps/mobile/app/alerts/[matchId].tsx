import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Match, Product, Recall } from "@recalllens/shared";

import { colors, severityLabel } from "@/constants/theme";
import { db } from "@/lib/db";
import { useInventory } from "@/lib/inventory";

export default function AlertDetailScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { refresh } = useInventory();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<Match | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [recall, setRecall] = useState<Recall | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const m = await db.getMatch(String(matchId));
      setMatch(m);
      if (!m) return;
      const products = await db.listProducts();
      setProduct(products.find((p) => p.id === m.productId) ?? null);
      setRecall(await db.getRecall(m.recallId));
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!match || !product || !recall) {
    return (
      <View style={styles.center}>
        <Text style={styles.body}>Match not found.</Text>
      </View>
    );
  }

  const purchased = new Date(product.purchasedAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerEyebrow}>Potential Recall Match</Text>
        <Text style={styles.bannerTitle}>
          A product you purchased may be included in a new recall.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.productName}>{product.name}</Text>
        {product.brand ? (
          <Text style={styles.meta}>{product.brand}</Text>
        ) : null}
        <Text style={styles.meta}>Purchased {purchased}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Recall notice</Text>
        <Text style={styles.recallTitle}>{recall.title}</Text>
        <Text style={styles.meta}>{severityLabel[recall.severity]}</Text>
        <Text style={styles.body}>{recall.hazard}</Text>
      </View>

      <Text style={styles.note}>
        We need to check your package to determine whether your specific product
        is affected. This is not yet a confirmed recall for your unit.
      </Text>

      <Pressable
        style={styles.primaryBtn}
        onPress={() => router.push(`/verify/${match.id}`)}
      >
        <Text style={styles.primaryBtnText}>Check Product</Text>
      </Pressable>

      <Pressable
        style={styles.secondaryBtn}
        onPress={async () => {
          const now = new Date().toISOString();
          await db.upsertMatch({ ...match, stage: "cleared", updatedAt: now });
          await db.updateProductStatus(product.id, "clear");
          await refresh();
          router.back();
        }}
      >
        <Text style={styles.secondaryBtnText}>I no longer have this product</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  container: { padding: 20, gap: 14, backgroundColor: colors.bg },
  banner: {
    backgroundColor: colors.banner,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0C989",
    padding: 16,
    gap: 6,
  },
  bannerEyebrow: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  bannerTitle: { fontSize: 20, fontWeight: "800", color: colors.ink, lineHeight: 26 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
  },
  productName: { fontSize: 20, fontWeight: "800", color: colors.ink },
  recallTitle: { fontSize: 16, fontWeight: "700", color: colors.ink, lineHeight: 22 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkMuted,
    textTransform: "uppercase",
  },
  meta: { fontSize: 14, color: colors.inkMuted },
  body: { fontSize: 15, lineHeight: 21, color: colors.ink },
  note: { fontSize: 14, lineHeight: 20, color: colors.inkMuted },
  primaryBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.inkMuted, fontWeight: "600", fontSize: 14 },
});
