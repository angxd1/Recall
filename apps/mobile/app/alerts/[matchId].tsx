import { useEffect, useState } from "react";
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
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const loading = loadedId !== String(matchId);
  const [match, setMatch] = useState<Match | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [recall, setRecall] = useState<Recall | null>(null);

  useEffect(() => {
    let active = true;
    void db.getMatch(String(matchId)).then(async (m) => {
      const products = m ? await db.listProducts() : [];
      const foundRecall = m ? await db.getRecall(m.recallId) : null;
      if (!active) return;
      setMatch(m);
      setProduct(products.find((p) => p.id === m?.productId) ?? null);
      setRecall(foundRecall);
    }).catch(() => {
      if (active) setMatch(null);
    }).finally(() => {
      if (active) setLoadedId(String(matchId));
    });
    return () => { active = false; };
  }, [matchId]);

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
      <Text style={styles.headline}>Check this package</Text>
      <Text style={styles.lead}>
        {product.name} may be part of a recall. Purchased {purchased}. This is not a confirmation until the package is checked.
      </Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Official reason</Text>
        <Text style={styles.body}>{recall.hazard}</Text>
        <Text style={styles.meta}>{severityLabel[recall.severity]}</Text>
      </View>

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
  headline: { fontSize: 32, fontWeight: "800", color: colors.ink, lineHeight: 38 },
  lead: { fontSize: 17, lineHeight: 24, color: colors.ink },
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
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.inkMuted, fontWeight: "600", fontSize: 14 },
});
