import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, layout } from "@/constants/theme";

export function Screen({
  children,
  footer,
  topInset = false,
  scroll = true,
  style,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  topInset?: boolean;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const padTop = topInset ? insets.top + 28 : 16;

  const column = (
    <View style={[styles.column, style]}>
      {children}
    </View>
  );

  return (
    <View style={styles.root}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: padTop, paddingBottom: 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {column}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, styles.fill, { paddingTop: padTop }]}>{column}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.column}>{footer}</View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  fill: { flex: 1 },
  column: {
    width: "100%",
    maxWidth: layout.maxWidth,
    alignSelf: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    paddingTop: 12,
  },
});
