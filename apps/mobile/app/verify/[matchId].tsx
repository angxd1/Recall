import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Match, Recall } from "@recalllens/shared";
import {
  extractLotFromOcr,
  extractUpcFromOcr,
  verifyAgainstRecall,
} from "@recalllens/shared";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Screen } from "@/components/ui/Screen";
import { colors, radius } from "@/constants/theme";
import { text } from "@/constants/type";
import { api } from "@/lib/api";
import { db } from "@/lib/db";
import { useInventory } from "@/lib/inventory";

/**
 * Stage-2 verification.
 * Package OCR is not built yet. The camera frames the package, and the lot
 * is entered by hand or pasted from label text.
 */
export default function VerifyScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { refresh } = useInventory();
  const [permission, requestPermission] = useCameraPermissions();
  const [match, setMatch] = useState<Match | null>(null);
  const [recall, setRecall] = useState<Recall | null>(null);
  const [lotInput, setLotInput] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void db.getMatch(String(matchId)).then(async (m) => {
      const foundRecall = m ? await db.getRecall(m.recallId) : null;
      if (!active) return;
      setMatch(m);
      setRecall(foundRecall);
    }).catch(() => {
      if (active) setMatch(null);
    }).finally(() => {
      if (active) setLoadedId(String(matchId));
    });
    return () => { active = false; };
  }, [matchId]);

  const applyResult = async (result: {
    confirmed: boolean;
    matchedFields: string[];
    verifiedLot?: string;
    verifiedUpc?: string;
  }) => {
    if (!match) return;
    const now = new Date().toISOString();
    if (result.confirmed) {
      await db.upsertMatch({
        ...match,
        stage: "confirmed",
        matchedFields: result.matchedFields,
        verifiedLot: result.verifiedLot,
        verifiedUpc: result.verifiedUpc,
        updatedAt: now,
      });
      await db.updateProductStatus(match.productId, "confirmed_match");
      await refresh();
      router.replace(`/action/${match.id}`);
    } else {
      setMessage(
        `No match yet. Observed lot ${(result.verifiedLot ?? lotInput) || "—"} is not in the affected range.`
      );
    }
  };

  const verifyLocal = async (text: string, lotOverride?: string) => {
    if (!recall || !match) return;
    setBusy(true);
    setMessage(null);
    try {
      const lot = lotOverride || extractLotFromOcr(text) || lotInput || null;
      const upc = extractUpcFromOcr(text);
      const result = verifyAgainstRecall(recall, { lot, upc });
      await applyResult(result);
    } finally {
      setBusy(false);
    }
  };

  const verifyViaApi = async (text: string, lot?: string) => {
    if (!recall || !match) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await api.verifyMatch({
        recallId: recall.id,
        ocrText: text,
        lot,
      });
      await applyResult(result);
    } catch {
      await verifyLocal(text, lot);
    } finally {
      setBusy(false);
    }
  };

  if (loadedId !== String(matchId)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!match || !recall) {
    return (
      <Screen>
        <Text style={text.body}>Could not load this match. Return to your products and try again.</Text>
      </Screen>
    );
  }

  const range = recall.identifiers.lotRanges?.[0];

  return (
    <Screen
      footer={
        <Button
          label="Verify against recall"
          busy={busy}
          onPress={() => verifyViaApi(ocrText || `LOT ${lotInput}`, lotInput || undefined)}
        />
      }
    >
      <Text style={text.title}>Check your package</Text>
      <Text style={text.body}>
        {range
          ? `Enter the lot code. Affected lots are ${range.start}–${range.end}.`
          : "Enter the lot or UPC printed on the package."}
      </Text>

      {permission?.granted ? (
        <CameraView style={styles.camera} facing="back" />
      ) : (
        <View style={styles.cameraPlaceholder}>
          <Text style={text.muted}>
            The camera frames the package. Lot reading is still typed by hand.
          </Text>
          <Button label="Allow camera" variant="quiet" onPress={requestPermission} />
        </View>
      )}

      <Field
        label="Lot code"
        autoCapitalize="characters"
        placeholder="e.g. A1842"
        value={lotInput}
        onChangeText={setLotInput}
      />
      <Field
        label="Or paste label text"
        multiline
        placeholder="LOT A1842 UPC 060410046234"
        value={ocrText}
        onChangeText={setOcrText}
      />
      {message ? <Text style={[text.body, { color: colors.warn }]}>{message}</Text> : null}
      <Button
        label="Demo: use package lot A1842"
        variant="text"
        disabled={busy}
        onPress={() => {
          setLotInput("A1842");
          setOcrText("LOT A1842 BEST BEFORE 2026-11-01");
          void verifyViaApi("LOT A1842", "A1842");
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  camera: { height: 180, borderRadius: radius.card, overflow: "hidden" },
  cameraPlaceholder: {
    minHeight: 160,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 12,
  },
});
