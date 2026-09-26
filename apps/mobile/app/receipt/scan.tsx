import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme";

export default function ReceiptScanPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Receipt scanner — coming next</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  text: { color: colors.inkMuted },
});
