import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme";

export default function ProductsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Products</Text>
      <Text style={styles.empty}>
        No products yet. Scan a receipt to start monitoring.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink, marginBottom: 12 },
  empty: { fontSize: 16, color: colors.inkMuted, lineHeight: 22 },
});
