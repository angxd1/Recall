import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme";
import { text } from "@/constants/type";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={styles.container}>
        <Text style={text.title}>This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={[text.body, { color: colors.brand }]}>Go to home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.bg,
    gap: 12,
  },
  link: { minHeight: 44, justifyContent: "center" },
});
