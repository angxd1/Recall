import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radius } from "@/constants/theme";
import { text } from "@/constants/type";

type Variant = "primary" | "quiet" | "text";

export function Button({
  label,
  variant = "primary",
  busy,
  disabled,
  onPress,
  style,
  accessibilityLabel,
}: {
  label: string;
  variant?: Variant;
  busy?: boolean;
  disabled?: boolean;
  onPress?: PressableProps["onPress"];
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const blocked = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!blocked, busy: !!busy }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "quiet" && styles.quiet,
        variant === "text" && styles.textBtn,
        blocked && styles.disabled,
        pressed && !blocked && styles.pressed,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={variant === "primary" ? colors.onBrand : colors.brand} />
      ) : (
        <Text
          style={[
            text.button,
            variant === "primary" && styles.primaryLabel,
            variant === "quiet" && styles.quietLabel,
            variant === "text" && styles.textLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.brand },
  quiet: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textBtn: { backgroundColor: "transparent" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.92 },
  primaryLabel: { color: colors.onBrand },
  quietLabel: { color: colors.ink },
  textLabel: { color: colors.inkMuted },
});
