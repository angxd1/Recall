import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius } from "@/constants/theme";

export function Card({
  children,
  tone = "default",
  style,
}: {
  children: React.ReactNode;
  tone?: "default" | "warn" | "danger";
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.card,
        tone === "warn" && styles.warn,
        tone === "danger" && styles.danger,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 8,
  },
  warn: {
    backgroundColor: colors.banner,
    borderColor: "#E4C98A",
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderColor: "#E7B4B0",
  },
});
