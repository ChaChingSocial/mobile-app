import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { DrawerContext } from "@/lib/Context";
import { FontAwesome } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [open, setOpen] = useState(false);

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GluestackUIProvider mode="light">
      <DrawerContext.Provider value={{ open, setOpen }}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack
            screenOptions={() => ({
              headerShown: false,
            })}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="notifications"
              options={{
                title: "Notifications",
                headerBackTitle: "Back",
                headerShown: true,
              }}
            />
            <Stack.Screen name="(profile)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar />
        </GestureHandlerRootView>
      </DrawerContext.Provider>
    </GluestackUIProvider>
  );
}
