import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Match, Product, Recall } from "@recalllens/shared";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { colors, severityLabel } from "@/constants/theme";
import { text } from "@/constants/type";
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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!match || !product || !recall) {
    return (
      <Screen>
        <Text style={text.body}>Match not found.</Text>
      </Screen>
    );
  }

  const purchased = new Date(product.purchasedAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });

  return (
    <Screen
      footer={
        <>
          <Button label="Check product" onPress={() => router.push(`/verify/${match.id}`)} />
          <Button
            label="I no longer have this product"
            variant="text"
            onPress={async () => {
              const now = new Date().toISOString();
              await db.upsertMatch({ ...match, stage: "cleared", updatedAt: now });
              await db.updateProductStatus(product.id, "clear");
              await refresh();
              router.back();
            }}
          />
        </>
      }
    >
      <Text style={text.title}>Check this package</Text>
      <Text style={text.product}>{product.name}</Text>
      <Text style={text.body}>
        Purchased {purchased}. This is not a confirmation until the package is checked.
      </Text>
      <Card>
        <Text style={text.label}>Official reason</Text>
        <Text style={text.body}>{recall.hazard}</Text>
        <Text style={text.muted}>{severityLabel[recall.severity]}</Text>
      </Card>
    </Screen>
  );
}
