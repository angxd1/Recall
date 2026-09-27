import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import type { Product, ReceiptLineItem } from "@recalllens/shared";

import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { colors, fonts, radius } from "@/constants/theme";
import { text } from "@/constants/type";
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
      upc: item.upc,
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
      <Screen>
        <Text style={text.title}>Add a receipt</Text>
        <Text style={text.body}>
          WeCanRecall photographs receipts to build your product inventory.
        </Text>
        <Button label="Allow camera" onPress={requestPermission} />
        <Button
          label={busy ? "Reading receipt…" : "Upload receipt photo"}
          variant="quiet"
          busy={busy}
          onPress={uploadReceipt}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="Use demo receipt instead" variant="text" disabled={busy} onPress={loadDemo} />
      </Screen>
    );
  }

  if (phase === "review" || phase === "saving") {
    return (
      <Screen
        footer={
          <>
            <Button
              label="Add to My Products"
              busy={phase === "saving"}
              disabled={items.some((item) => !item.name.trim())}
              onPress={saveProducts}
            />
            <Button
              label="Retake"
              variant="text"
              disabled={phase === "saving"}
              onPress={() => {
                setPhase("camera");
                setError(null);
              }}
            />
          </>
        }
      >
        <Text style={text.title}>
          {items.length} product{items.length === 1 ? "" : "s"} identified
        </Text>
        <Text style={text.body}>
          {retailer ? `${retailer} · ` : ""}
          Check and correct product names before adding them to My Products.
          {" "}Product names found by barcode come from Open Food Facts. Compare them with your receipt.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.itemList}>
          {items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={text.label}>Name</Text>
              <TextInput
                accessibilityLabel={`Product ${idx + 1} name`}
                style={styles.itemName}
                value={item.name}
                editable={phase !== "saving"}
                onChangeText={(name) => setItems((current) => current.map((entry, i) =>
                  i === idx ? { ...entry, name } : entry
                ))}
              />
              {item.brand ? <Text style={text.muted}>{item.brand}</Text> : null}
              {item.receiptName ? <Text style={text.muted}>Receipt: {item.receiptName}</Text> : null}
              {item.upc ? <Text style={text.muted}>UPC/EAN: {item.upc}</Text> : null}
              {item.lookupStatus === "found" ? <Text style={text.muted}>Product found in Open Food Facts</Text> : null}
              {item.lookupStatus === "not_found" ? <Text style={text.muted}>No catalog match. Using the receipt name.</Text> : null}
              {item.lookupStatus === "unavailable" ? <Text style={text.muted}>Product lookup unavailable. Using the receipt name.</Text> : null}
              {item.lookupStatus === "invalid_code" ? <Text style={text.muted}>Could not validate the printed code. Using the receipt name.</Text> : null}
              {item.lookupStatus === "retailer_code" ? <Text style={text.muted}>Store item number detected. Using the receipt name.</Text> : null}
              {item.upc ? (
                <Button
                  label={item.lookupStatus === "found" ? "Use receipt name instead" : "Remove barcode"}
                  variant="text"
                  disabled={phase === "saving"}
                  onPress={() => setItems((current) => current.map((entry, i) => i === idx
                    ? { ...entry, name: entry.receiptName ?? entry.name, brand: undefined, upc: undefined, receiptName: undefined, lookupStatus: undefined }
                    : entry))}
                />
              ) : null}
              {item.price != null ? (
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              ) : null}
            </View>
          ))}
        </View>
      </Screen>
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
          accessibilityRole="button"
          accessibilityLabel="Capture receipt"
          style={({ pressed }) => [styles.shutter, pressed && { opacity: 0.92 }]}
          onPress={captureAndExtract}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.demoLink} onPress={loadDemo} disabled={busy}>
          <Text style={styles.demoLinkText}>Use demo receipt</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.demoLink} onPress={uploadReceipt} disabled={busy}>
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
    alignItems: "center",
    backgroundColor: colors.bg,
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
    backgroundColor: "rgba(28,25,21,0.55)",
  },
  overlayHint: {
    fontFamily: fonts.sans,
    color: colors.onBrand,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  shutter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: colors.onBrand,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.onBrand,
  },
  demoLink: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12 },
  demoLinkText: { fontFamily: fonts.sansBold, color: colors.onBrand, fontSize: 16 },
  error: { fontFamily: fonts.sans, color: colors.danger, fontSize: 16, lineHeight: 22 },
  errorLight: {
    fontFamily: fonts.sans,
    color: "#F8E6E4",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  itemList: { gap: 12 },
  itemRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
  },
  itemName: {
    fontFamily: fonts.sansBold,
    fontSize: 17,
    color: colors.ink,
    minHeight: 44,
  },
  itemPrice: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.ink },
});
