import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import type { Product, ReceiptLineItem } from "@recalllens/shared";

import { colors } from "@/constants/theme";
import { api } from "@/lib/api";
import { db, newId } from "@/lib/db";
import { useInventory } from "@/lib/inventory";

type Phase = "camera" | "review" | "saving";

export default function ReceiptScanScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>("camera");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ReceiptLineItem[]>([]);
  const [retailer, setRetailer] = useState<string | undefined>();
  const [purchasedAt, setPurchasedAt] = useState<string>(
    new Date().toISOString()
  );
  const router = useRouter();
  const { monitor } = useInventory();

  const applyExtract = (payload: {
    items: ReceiptLineItem[];
    retailer?: string;
    purchasedAt?: string;
  }) => {
    setItems(payload.items);
    setRetailer(payload.retailer);
    setPurchasedAt(payload.purchasedAt ?? new Date().toISOString());
    setPhase("review");
  };

  const captureAndExtract = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.9,
      });
      if (!photo?.base64) throw new Error("Could not capture photo");
      const result = await api.extractReceipt({ imageBase64: photo.base64 });
      applyExtract(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const loadDemo = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await api.extractReceipt({ useDemo: true });
      applyExtract(result);
    } catch (e) {
      // Offline-friendly local fallback
      const { DEMO_RECEIPT_ITEMS } = await import("@recalllens/shared");
      applyExtract({
        retailer: "Walmart",
        purchasedAt: new Date().toISOString(),
        items: DEMO_RECEIPT_ITEMS,
      });
      if (e instanceof Error) setError(`API unavailable — used local demo (${e.message})`);
    } finally {
      setBusy(false);
    }
  };

  const uploadReceipt = async () => {
    if (busy) return;
    setError(null);
    try {
      const selected = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], base64: true, quality: 0.9,
      });
      if (selected.canceled) return;
      const image = selected.assets[0];
      if (!image.base64) throw new Error("Could not read the selected receipt image.");
      setBusy(true);
      applyExtract(await api.extractReceipt({ imageBase64: image.base64 }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const saveProducts = async () => {
    setPhase("saving");
    const now = new Date().toISOString();
    const products: Product[] = items.map((item) => ({
      id: newId("prod"),
      name: item.name,
      brand: item.brand,
      retailer,
      purchasedAt,
      status: "clear",
      createdAt: now,
    }));
    try {
      await db.insertProducts(products);
      await monitor();
      router.replace("/(tabs)/products");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save products. Please try again.");
      setPhase("review");
    }
  };

  if (!permission && phase === "camera") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!permission?.granted && phase === "camera") {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Add a receipt</Text>
        <Text style={styles.body}>
          RecallLens photographs receipts to build your product inventory.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Allow camera</Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={uploadReceipt} disabled={busy}>
          <Text style={styles.primaryBtnText}>{busy ? "Reading receipt…" : "Upload receipt photo"}</Text>
        </Pressable>
        {busy ? <ActivityIndicator color={colors.brand} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.secondaryBtn} onPress={loadDemo} disabled={busy}>
          <Text style={styles.secondaryBtnText}>Use demo receipt instead</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === "review" || phase === "saving") {
    return (
      <ScrollView contentContainerStyle={styles.review}>
        <Text style={styles.title}>
          {items.length} product{items.length === 1 ? "" : "s"} identified
        </Text>
        <Text style={styles.body}>
          {retailer ? `${retailer} · ` : ""}
          Check and correct product names before adding them to My Products.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.itemList}>
          {items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <TextInput
                  accessibilityLabel={`Product ${idx + 1} name`}
                  style={styles.itemName}
                  value={item.name}
                  editable={phase !== "saving"}
                  onChangeText={(name) => setItems((current) => current.map((entry, i) =>
                    i === idx ? { ...entry, name } : entry
                  ))}
                />
                {item.brand ? (
                  <Text style={styles.itemBrand}>{item.brand}</Text>
                ) : null}
              </View>
              {item.price != null ? (
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              ) : null}
            </View>
          ))}
        </View>
        <Pressable
          style={styles.primaryBtn}
          onPress={saveProducts}
          disabled={phase === "saving" || items.some((item) => !item.name.trim())}
        >
          {phase === "saving" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Add to My Products</Text>
          )}
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => {
            setPhase("camera");
            setError(null);
          }}
        >
          <Text style={styles.secondaryBtnText}>Retake</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View style={styles.cameraWrap}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.overlay}>
        <Text style={styles.overlayHint}>
          Point at a grocery receipt so products can be identified.
        </Text>
        {error ? <Text style={styles.errorLight}>{error}</Text> : null}
        <Pressable
          style={styles.shutter}
          onPress={captureAndExtract}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </Pressable>
        <Pressable style={styles.demoLink} onPress={loadDemo} disabled={busy}>
          <Text style={styles.demoLinkText}>Use demo receipt</Text>
        </Pressable>
        <Pressable style={styles.demoLink} onPress={uploadReceipt} disabled={busy}>
          <Text style={styles.demoLinkText}>Upload receipt photo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.bg,
    gap: 12,
  },
  cameraWrap: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  overlayHint: {
    color: "#fff",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 21,
  },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fff",
  },
  demoLink: { paddingVertical: 6 },
  demoLinkText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  review: { padding: 24, gap: 12, backgroundColor: colors.bg },
  title: { fontSize: 26, fontWeight: "800", color: colors.ink },
  body: { fontSize: 15, lineHeight: 21, color: colors.inkMuted },
  error: { color: colors.danger, fontSize: 13 },
  errorLight: { color: "#FFD0D0", fontSize: 13, textAlign: "center" },
  itemList: { gap: 8, marginVertical: 8 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  itemName: { fontSize: 16, fontWeight: "700", color: colors.ink },
  itemBrand: { fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: "600", color: colors.ink },
  primaryBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: colors.ink, fontWeight: "600", fontSize: 15 },
});
