import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { colors, radius } from "@/constants/theme";
import { text } from "@/constants/type";

export function RecallPopup({
  productName,
  extraCount,
  onOpen,
  onDismiss,
}: {
  productName: string;
  extraCount: number;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onDismiss}>
      <View style={styles.scrim}>
        <View
          accessibilityRole="alert"
          style={styles.card}
        >
          <Text style={text.title}>Check a product</Text>
          <Text style={text.product}>{productName}</Text>
          <Text style={text.body}>
            This product may match a Canadian recall. Open the package before treating it as affected.
          </Text>
          {extraCount > 0 ? (
            <Text style={text.muted}>
              {extraCount} other product{extraCount === 1 ? "" : "s"} also need a look.
            </Text>
          ) : null}
          <Button label="Check this product" onPress={onOpen} />
          <Pressable
            accessibilityRole="button"
            onPress={onDismiss}
            style={({ pressed }) => [styles.dismiss, pressed && styles.pressed]}
          >
            <Text style={text.muted}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(28, 25, 21, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 12,
  },
  dismiss: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.92 },
});
