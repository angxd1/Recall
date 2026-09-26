import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Match, Recall } from "@recalllens/shared";
import {
  extractLotFromOcr,
  extractUpcFromOcr,
  verifyAgainstRecall,
} from "@recalllens/shared";

import { colors } from "@/constants/theme";
import { api } from "@/lib/api";
import { db } from "@/lib/db";
import { useInventory } from "@/lib/inventory";

/**
 * Stage-2 verification.
 * Expo Go has limited OCR; we support:
 * 1) Manual lot entry (demo-reliable)
 * 2) Simulated OCR from a "demo lot on package" button
 * 3) API verify with free-text OCR paste
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

  const load = useCallback(async () => {
    const m = await db.getMatch(String(matchId));
    setMatch(m);
    if (m) setRecall(await db.getRecall(m.recallId));
  }, [matchId]);

  useEffect(() => {
    void load();
  }, [load]);

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

  if (!match || !recall) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  const range = recall.identifiers.lotRanges?.[0];

  return (
    <View style={styles.container}>
      <View style={styles.guide}>
        <Text style={styles.guideTitle}>Find the lot / UPC on the package</Text>
        <Text style={styles.guideBody}>
          This recall checks{" "}
          {range
            ? `lots ${range.start}–${range.end}`
            : "the identifiers listed on the official notice"}
          .
        </Text>
      </View>

      {permission?.granted ? (
        <CameraView style={styles.camera} facing="back" />
      ) : (
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.placeholderText}>
            Camera helps frame the package. Allow access or enter the lot below.
          </Text>
          {!permission?.granted ? (
            <Pressable style={styles.secondaryBtn} onPress={requestPermission}>
              <Text style={styles.secondaryBtnText}>Allow camera</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      <View style={styles.panel}>
        <Text style={styles.label}>Lot code</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="characters"
          placeholder="e.g. A1842"
          placeholderTextColor={colors.inkMuted}
          value={lotInput}
          onChangeText={setLotInput}
        />
        <Text style={styles.label}>Or paste OCR / label text</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          multiline
          placeholder="LOT A1842 UPC 060410046234"
          placeholderTextColor={colors.inkMuted}
          value={ocrText}
          onChangeText={setOcrText}
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable
          style={styles.primaryBtn}
          disabled={busy}
          onPress={() => verifyViaApi(ocrText || `LOT ${lotInput}`, lotInput || undefined)}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Verify against recall</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.demoBtn}
          disabled={busy}
          onPress={() => {
            setLotInput("A1842");
            setOcrText("LOT A1842 BEST BEFORE 2026-11-01");
            void verifyViaApi("LOT A1842", "A1842");
          }}
        >
          <Text style={styles.demoBtnText}>
            Demo: use package lot A1842
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  container: { flex: 1, backgroundColor: colors.bg },
  guide: { padding: 16, gap: 4 },
  guideTitle: { fontSize: 18, fontWeight: "800", color: colors.ink },
  guideBody: { fontSize: 14, lineHeight: 20, color: colors.inkMuted },
  camera: { height: 220 },
  cameraPlaceholder: {
    height: 180,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 10,
  },
  placeholderText: {
    textAlign: "center",
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  panel: { padding: 16, gap: 8 },
  label: { fontSize: 13, fontWeight: "700", color: colors.inkMuted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  message: { color: colors.warn, fontSize: 14, lineHeight: 20 },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: colors.brand,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  demoBtn: { paddingVertical: 12, alignItems: "center" },
  demoBtnText: { color: colors.accent, fontWeight: "700", fontSize: 14 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  secondaryBtnText: { color: colors.ink, fontWeight: "600" },
});
