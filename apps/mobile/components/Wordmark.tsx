import { Text } from "react-native";

import { colors } from "@/constants/theme";
import { text } from "@/constants/type";

export function Wordmark() {
  return (
    <Text style={text.wordmark} accessibilityRole="header">
      WeCan
      <Text style={{ color: colors.brand }}>Recall</Text>
    </Text>
  );
}
