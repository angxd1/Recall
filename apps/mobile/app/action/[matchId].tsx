import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import type { Match, Product, Recall } from "@recalllens/shared";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { colors, severityLabel } from "@/constants/theme";
import { text } from "@/constants/type";
import { db } from "@/lib/db";

export default function ActionScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
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
        <Text style={text.body}>Confirmed match not found.</Text>
      </Screen>
    );
  }

  const range = recall.identifiers.lotRanges?.[0];

  return (
    <Screen
      footer={
        !recall.isSeed ? (
          <Button
            label="Open official recall notice"
            onPress={() => Linking.openURL(recall.sourceUrl)}
          />
        ) : undefined
      }
    >
      <Text style={text.title}>
        {recall.isSeed ? "Demo recall confirmed" : "Recall confirmed"}
      </Text>
      <Text style={text.product}>{product.name}</Text>
      {match.verifiedLot ? <Text style={[text.body, { color: colors.danger }]}>Lot {match.verifiedLot}</Text> : null}

      <Card tone="danger">
        <Text style={text.label}>Official reason</Text>
        <Text style={text.body}>{recall.hazard}</Text>
        <Text style={text.label}>What to do</Text>
        <Text style={text.body}>{recall.whatToDo}</Text>
        <Text style={[text.muted, { color: colors.danger }]}>{severityLabel[recall.severity]}</Text>
      </Card>

      <Card>
        <Text style={text.label}>Your product</Text>
        <Text style={text.body}>
          {product.name}
          {match.verifiedUpc ? `\nUPC ${match.verifiedUpc}` : ""}
        </Text>
        {range ? (
          <>
            <Text style={text.label}>Affected lots</Text>
            <Text style={text.body}>
              {range.start}–{range.end}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.clear} />
              <Text style={[text.body, { color: colors.clear }]}>Your lot matches.</Text>
            </View>
          </>
        ) : null}
      </Card>

      <Text style={text.muted}>
        {recall.isSeed
          ? "Demo scenario only. This is not an official recall or a real safety alert."
          : `Guidance is taken from the official ${recall.organization} notice. WeCanRecall does not invent safety instructions.`}
      </Text>
    </Screen>
  );
}
