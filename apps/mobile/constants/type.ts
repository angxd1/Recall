import { StyleSheet } from "react-native";

import { colors, fonts } from "@/constants/theme";

export const text = StyleSheet.create({
  wordmark: {
    fontFamily: fonts.serifBold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  hero: {
    fontFamily: fonts.serif,
    fontSize: 40,
    lineHeight: 46,
    color: colors.ink,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 38,
    color: colors.ink,
  },
  product: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 26,
    color: colors.ink,
  },
  muted: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.inkMuted,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.inkMuted,
  },
  button: {
    fontFamily: fonts.sansBold,
    fontSize: 17,
    lineHeight: 22,
  },
});
