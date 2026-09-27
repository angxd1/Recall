import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, fonts } from "@/constants/theme";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 8,
          paddingBottom: bottom,
          height: 64 + bottom,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: 13,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              color={color}
              size={size}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarLabel: "Products",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="cube-outline"
              color={color}
              size={size}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          ),
        }}
      />
    </Tabs>
  );
}
