import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces/600SemiBold";
import { Fraunces_700Bold } from "@expo-google-fonts/fraunces/700Bold";
import { SourceSans3_400Regular } from "@expo-google-fonts/source-sans-3/400Regular";
import { SourceSans3_600SemiBold } from "@expo-google-fonts/source-sans-3/600SemiBold";
import { SourceSans3_700Bold } from "@expo-google-fonts/source-sans-3/700Bold";
import "react-native-reanimated";

import { colors, fonts } from "@/constants/theme";
import { InventoryProvider } from "@/lib/inventory";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <InventoryProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: fonts.serif, fontWeight: "600" },
          headerShadowVisible: false,
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
