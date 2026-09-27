export const colors = {
  bg: "#F6F3EC",
  surface: "#FFFCF7",
  ink: "#1C1915",
  inkMuted: "#5C564C",
  brand: "#143D32",
  brandSoft: "#1F5A48",
  accent: "#8A5A00",
  clear: "#143D32",
  warn: "#8A5A00",
  danger: "#9B2C2C",
  info: "#1B4F72",
  border: "#E4DDD0",
  banner: "#F8EFD9",
  onBrand: "#F6F3EC",
  clearSoft: "#E4EFE8",
  warnSoft: "#F8EFD9",
  dangerSoft: "#F8E6E4",
  track: "#E7E1D6",
};

export const fonts = {
  serif: "Fraunces_600SemiBold",
  serifBold: "Fraunces_700Bold",
  sans: "SourceSans3_400Regular",
  sansMedium: "SourceSans3_600SemiBold",
  sansBold: "SourceSans3_700Bold",
};

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  card: 20,
  button: 14,
  input: 12,
  chip: 8,
};

export const layout = {
  maxWidth: 560,
};

export const severityLabel: Record<string, string> = {
  stop_using: "Stop using immediately",
  action_required: "Action required",
  check_product: "Check your product",
  safety_info: "Safety information",
};

export const statusLabel: Record<string, string> = {
  clear: "No known recall",
  needs_verification: "Check package",
  confirmed_match: "Recall match",
  dismissed: "Dismissed",
};
