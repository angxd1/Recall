import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { Match, Product, Recall } from "@recalllens/shared";

import { colors, severityLabel } from "@/constants/theme";
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
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!match || !product || !recall) {
    return (
      <View style={styles.center}>
        <Text style={styles.body}>Confirmed match not found.</Text>
      </View>
    );
  }

  const range = recall.identifiers.lotRanges?.[0];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>{recall.isSeed ? "Demo recall confirmed" : "Recall confirmed"}</Text>
        <Text style={styles.heroTitle}>
          {recall.isSeed ? "Your product matches the fictional demo recall." : "Your product matches an active recall."}
        </Text>
        <Text style={styles.severity}>{severityLabel[recall.severity]}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.q}>Why was it recalled?</Text>
        <Text style={styles.a}>{recall.hazard}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.q}>What should I do?</Text>
        <Text style={styles.a}>{recall.whatToDo}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.q}>Your product</Text>
        <Text style={styles.a}>
          {product.name}
          {match.verifiedLot ? `\nLot ${match.verifiedLot}` : ""}
          {match.verifiedUpc ? `\nUPC ${match.verifiedUpc}` : ""}
        </Text>
        {range ? (
          <>
            <Text style={[styles.q, { marginTop: 12 }]}>Affected lots</Text>
            <Text style={styles.a}>
              {range.start}–{range.end}
            </Text>
            <Text style={styles.matchOk}>✓ Your lot matches.</Text>
          </>
        ) : null}
      </View>

      {!recall.isSeed ? <Pressable
        style={styles.primaryBtn}
        onPress={() => Linking.openURL(recall.sourceUrl)}
      >
        <Text style={styles.primaryBtnText}>Open official recall notice</Text>
      </Pressable> : null}

      <Text style={styles.footnote}>
        {recall.isSeed
          ? "Demo scenario only. This is not an official recall or a real safety alert."
          : `Guidance is taken from the official ${recall.organization} notice. RecallLens does not invent safety instructions.`}
      </Text>
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
  hero: {
    backgroundColor: "#FDECEC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3B4B0",
    padding: 18,
    gap: 8,
  },
  heroEyebrow: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.danger,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink,
    lineHeight: 30,
  },
  severity: { fontSize: 14, fontWeight: "700", color: colors.danger },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
  },
  q: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  a: { fontSize: 16, lineHeight: 23, color: colors.ink },
  matchOk: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "800",
    color: colors.clear,
  },
  primaryBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  body: { color: colors.inkMuted },
  footnote: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkMuted,
    textAlign: "center",
  },
});
