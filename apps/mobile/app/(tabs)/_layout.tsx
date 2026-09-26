import { Tabs } from "expo-router";
import { Text } from "react-native";

import { colors } from "@/constants/theme";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: focused ? "700" : "500", color: focused ? colors.brand : colors.inkMuted }}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.inkMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon label="⌂" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "My Products",
          tabBarIcon: ({ focused }) => <TabIcon label="▣" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
