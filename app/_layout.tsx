import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { SessionProvider } from "@/lib/providers/AuthContext";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";


export default function RootLayout() {
  return (
    <SessionProvider>
      <GluestackUIProvider mode="light">
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen
              name="(protected)"
              options={{
                headerShown: false,
                animation: "none",
              }}
            />
            <Stack.Screen
              name="login"
              options={{
                animation: "none",
                presentation: "modal",
              }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
        </GestureHandlerRootView>
      </GluestackUIProvider>
    </SessionProvider>
  );
}
