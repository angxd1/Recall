import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";

export default function ActionPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Action screen — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  text: { color: colors.inkMuted },
});
