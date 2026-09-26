import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";

export default function DemoPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Demo controls — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, padding: 24 },
  text: { color: colors.inkMuted },
});
