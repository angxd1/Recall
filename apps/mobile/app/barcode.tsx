import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { useRouter } from "expo-router";
import type { Product } from "@recalllens/shared";
import { barcodeKey, expandUpce } from "@recalllens/shared";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Screen } from "@/components/ui/Screen";
import { colors } from "@/constants/theme";
import { text } from "@/constants/type";
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
  const { monitor } = useInventory();

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
      await monitor();
      router.replace("/(tabs)/products");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this product. Please try again.");
    } finally {
      saveLocked.current = false;
      setBusy(false);
    }
  };

  const canSave = !duplicate && !lookingUp && !!name.trim() && !!barcodeKey(upc);

  return (
    <View style={styles.root}>
      {permission?.granted ? (
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"] }}
          onBarcodeScanned={scanned ? undefined : onBarcode}
        />
      ) : permission ? (
        <View style={styles.permission}>
          <Text style={text.body}>Allow camera access to scan, or type the barcode below.</Text>
          <Button label="Allow camera" onPress={requestPermission} />
        </View>
      ) : (
        <View style={styles.permission}>
          <ActivityIndicator color={colors.brand} />
        </View>
      )}
      <Screen
        footer={
          <Button
            label="Add to My Products"
            busy={busy}
            disabled={!canSave}
            onPress={save}
          />
        }
      >
        <Text style={text.title}>Add a barcode</Text>
        <Field
          label="UPC"
          value={upc}
          onChangeText={changeCode}
          editable={!busy}
          placeholder="Scan or type UPC"
          keyboardType="number-pad"
        />
        <Button
          label={lookingUp ? "Looking up…" : "Look up product"}
          variant="quiet"
          busy={lookingUp}
          disabled={busy || !upc.trim()}
          onPress={() => { void lookup(upc); }}
        />
        {message ? <Text accessibilityLiveRegion="polite" style={text.body}>{message}</Text> : null}
        {source ? (
          <Text
            style={[text.muted, styles.link]}
            accessibilityRole="link"
            onPress={() => { void Linking.openURL("https://world.openfoodfacts.org").catch(() => {}); }}
          >
            Product data: Open Food Facts (ODbL)
          </Text>
        ) : null}
        <Field
          label="Product name"
          value={name}
          onChangeText={setName}
          editable={!busy && !lookingUp && !duplicate}
          placeholder="e.g. ABC Granola Bars"
        />
        {scanned ? (
          <Button
            label="Scan again"
            variant="text"
            disabled={busy}
            onPress={() => {
              changeCode("");
              scanLocked.current = false;
              setScanned(false);
            }}
          />
        ) : null}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  camera: { height: 220 },
  permission: { padding: 24, gap: 12 },
  link: { textDecorationLine: "underline" },
});
