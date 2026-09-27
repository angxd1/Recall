import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  Linking,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { useRouter } from "expo-router";
import type { Product } from "@recalllens/shared";
import { barcodeKey, expandUpce } from "@recalllens/shared";

import { colors } from "@/constants/theme";
import { db, newId } from "@/lib/db";
import { useInventory } from "@/lib/inventory";
import { api } from "@/lib/api";

export default function BarcodeScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [upc, setUpc] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [message, setMessage] = useState("");
  const [duplicate, setDuplicate] = useState(false);
  const [brand, setBrand] = useState<string | undefined>();
  const [source, setSource] = useState(false);
  const generation = useRef(0);
  const scanLocked = useRef(false);
  const saveLocked = useRef(false);
  const router = useRouter();
  const { refresh } = useInventory();

  useEffect(() => () => { generation.current++; }, []);

  const changeCode = (value: string) => {
    generation.current++;
    scanLocked.current = true;
    setScanned(true);
    setUpc(value);
    setName("");
    setBrand(undefined);
    setMessage("");
    setSource(false);
    setDuplicate(false);
    setLookingUp(false);
  };

  const lookup = async (value: string) => {
    const request = ++generation.current;
    const key = barcodeKey(value);
    setDuplicate(false);
    setSource(false);
    setName("");
    setBrand(undefined);
    if (!key) {
      setMessage("Enter a valid UPC or EAN barcode, including its check digit.");
      return;
    }
    setLookingUp(true);
    setMessage("Looking up product…");
    try {
      const existing = (await db.listProducts()).find((p) => barcodeKey(p.upc ?? "") === key);
      if (request !== generation.current) return;
      if (existing) {
        setName(existing.name);
        setDuplicate(true);
        setMessage(`You already have this product in your list: ${existing.name}.`);
        return;
      }
      const result = await api.lookupBarcode(value.replace(/[\s-]/g, ""));
      if (request !== generation.current) return;
      if (result.product) {
        setName(result.product.name);
        setBrand(result.product.brand);
        setSource(true);
        setMessage("Product found. Check the name before adding.");
      } else {
        setMessage("No product found. Enter the name from the package.");
      }
    } catch (error) {
      if (request === generation.current) {
        setMessage(error instanceof Error ? error.message : "Lookup failed. Enter the name manually.");
      }
    } finally {
      if (request === generation.current) setLookingUp(false);
    }
  };

  const onBarcode = (result: BarcodeScanningResult) => {
    if (scanLocked.current || saveLocked.current) return;
    scanLocked.current = true;
    const code = result.type === "upc_e" ? expandUpce(result.data) : result.data;
    changeCode(code ?? "");
    if (code) void lookup(code);
    else setMessage("Could not read this UPC-E. Enter the full UPC-A from the package.");
  };

  const save = async () => {
    if (saveLocked.current || lookingUp || duplicate || !name.trim() || !barcodeKey(upc)) return;
    saveLocked.current = true;
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const product: Product = {
        id: newId("prod"),
        name: name.trim(),
        upc: upc.replace(/[\s-]/g, ""),
        brand,
        purchasedAt: now,
        status: "clear",
        createdAt: now,
      };
      const existing = await db.insertBarcodeProduct(product);
      if (existing) {
        setDuplicate(true);
        setMessage(`You already have this product in your list: ${existing.name}.`);
        return;
      }
      await refresh();
      router.replace("/(tabs)/products");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this product. Please try again.");
    } finally {
      saveLocked.current = false;
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {permission?.granted ? <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"] }}
        onBarcodeScanned={scanned ? undefined : onBarcode}
      /> : <View style={{ padding: 16 }}>
        <Text style={styles.body}>Allow camera access to scan, or type the barcode below.</Text>
        <Pressable style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Allow camera</Text>
        </Pressable>
      </View>}
      <View style={styles.panel}>
        <Text style={styles.title}>Add product by barcode</Text>
        <Text style={styles.label}>UPC</Text>
        <TextInput
          style={styles.input}
          value={upc}
          onChangeText={changeCode}
          editable={!busy}
          accessibilityLabel="UPC"
          placeholder="Scan or type UPC"
          placeholderTextColor={colors.inkMuted}
          keyboardType="number-pad"
        />
        <Pressable style={styles.primaryBtn} onPress={() => { void lookup(upc); }} disabled={busy || lookingUp || !upc.trim()}>
          <Text style={styles.primaryBtnText}>{lookingUp ? "Looking up…" : "Look up product"}</Text>
        </Pressable>
        {message ? <Text accessibilityLiveRegion="polite" style={styles.body}>{message}</Text> : null}
        {source ? <Text style={styles.rescan} accessibilityRole="link"
          onPress={() => { void Linking.openURL("https://world.openfoodfacts.org").catch(() => {}); }}>
          Product data: Open Food Facts (ODbL)
        </Text> : null}
        <Text style={styles.label}>Product name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          editable={!busy && !lookingUp && !duplicate}
          accessibilityLabel="Product name"
          placeholder="e.g. ABC Granola Bars"
          placeholderTextColor={colors.inkMuted}
        />
        <Pressable style={[styles.primaryBtn, (duplicate || lookingUp || !name.trim() || !barcodeKey(upc)) && { opacity: 0.5 }]}
          onPress={save} disabled={busy || lookingUp || duplicate || !name.trim() || !barcodeKey(upc)}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Add to My Products</Text>
          )}
        </Pressable>
        {scanned ? (
          <Pressable disabled={busy} onPress={() => {
            changeCode("");
            scanLocked.current = false;
            setScanned(false);
          }}>
            <Text style={styles.rescan}>Scan again</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
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
