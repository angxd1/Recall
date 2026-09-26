import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>RecallLens</Text>
      <Text style={styles.tagline}>
        If something you own becomes unsafe, you should know about it.
      </Text>

      <Link href="/receipt/scan" asChild>
        <Pressable style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Scan receipt</Text>
        </Pressable>
      </Link>

      <Link href="/demo" asChild>
        <Pressable style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>Demo controls</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: colors.bg,
    gap: 16,
  },
  brand: {
    fontSize: 40,
    fontWeight: "800",
    color: colors.brand,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.inkMuted,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "600",
  },
});
