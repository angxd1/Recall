import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { colors, fonts, radius } from "@/constants/theme";
import { text } from "@/constants/type";

export function Field({
  label,
  style,
  ...inputProps
}: { label: string } & TextInputProps) {
  return (
    <View style={styles.wrap}>
      <Text style={text.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.inkMuted}
        {...inputProps}
        accessibilityLabel={inputProps.accessibilityLabel ?? label}
        style={[styles.input, inputProps.multiline && styles.multiline, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 17,
    color: colors.ink,
  },
  multiline: { minHeight: 88, textAlignVertical: "top" },
});
