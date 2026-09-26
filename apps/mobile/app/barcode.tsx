import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { useRouter } from "expo-router";
import type { Product } from "@recalllens/shared";

import { colors } from "@/constants/theme";
import { db, newId } from "@/lib/db";
import { useInventory } from "@/lib/inventory";

export default function BarcodeScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [upc, setUpc] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { refresh } = useInventory();

  const onBarcode = (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    setUpc(result.data);
    setName((prev) => prev || `Product ${result.data.slice(-4)}`);
  };

  const save = async () => {
    if (!name.trim() || !upc.trim()) return;
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const product: Product = {
        id: newId("prod"),
        name: name.trim(),
        upc: upc.trim(),
        purchasedAt: now,
        status: "clear",
        createdAt: now,
      };
      await db.insertProducts([product]);
      await refresh();
      router.replace("/(tabs)/products");
    } finally {
      setBusy(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.body}>Camera permission is required to scan barcodes.</Text>
        <Pressable style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"] }}
        onBarcodeScanned={scanned ? undefined : onBarcode}
      />
      <View style={styles.panel}>
        <Text style={styles.title}>Add product by barcode</Text>
        <Text style={styles.label}>UPC</Text>
        <TextInput
          style={styles.input}
          value={upc}
          onChangeText={setUpc}
          placeholder="Scan or type UPC"
          placeholderTextColor={colors.inkMuted}
          keyboardType="number-pad"
        />
        <Text style={styles.label}>Product name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. ABC Granola Bars"
          placeholderTextColor={colors.inkMuted}
        />
        <Pressable style={styles.primaryBtn} onPress={save} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Add to My Products</Text>
          )}
        </Pressable>
        {scanned ? (
          <Pressable onPress={() => setScanned(false)}>
            <Text style={styles.rescan}>Scan again</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: colors.bg,
  },
  camera: { height: 260 },
  panel: { padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: "800", color: colors.ink, marginBottom: 4 },
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
  primaryBtn: {
    marginTop: 8,
    backgroundColor: colors.brand,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  body: { color: colors.inkMuted, fontSize: 15, lineHeight: 21 },
  rescan: {
    textAlign: "center",
    color: colors.accent,
    fontWeight: "700",
    marginTop: 8,
  },
});
