import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { colors } from "@/constants/theme";
import { InventoryProvider } from "@/lib/inventory";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <InventoryProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="receipt/scan" options={{ title: "Scan receipt" }} />
        <Stack.Screen name="barcode" options={{ title: "Scan barcode" }} />
        <Stack.Screen name="alerts/[matchId]" options={{ title: "Potential match" }} />
        <Stack.Screen name="verify/[matchId]" options={{ title: "Verify package" }} />
        <Stack.Screen name="action/[matchId]" options={{ title: "Recall confirmed" }} />
        <Stack.Screen name="demo" options={{ title: "Demo controls", presentation: "modal" }} />
      </Stack>
    </InventoryProvider>
  );
}
