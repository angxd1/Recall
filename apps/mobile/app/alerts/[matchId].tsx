import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/theme";

export default function AlertPlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Alert detail — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  text: { color: colors.inkMuted },
});
