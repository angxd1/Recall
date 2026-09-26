export const colors = {
  bg: "#F4F7F5",
  surface: "#FFFFFF",
  ink: "#10241C",
  inkMuted: "#5A6F66",
  brand: "#0B3D2E",
  brandSoft: "#1A5C45",
  accent: "#C45C26",
  clear: "#1F7A4C",
  warn: "#C47A00",
  danger: "#B42318",
  info: "#1B4F72",
  border: "#D5E0DB",
  banner: "#FFF4E5",
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
