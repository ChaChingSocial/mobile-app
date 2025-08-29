import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { SessionProvider, useSession } from "@/lib/providers/AuthContext";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Redirect, usePathname } from "expo-router";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

function RootLayoutNav() {
  const pathname = usePathname();
  const { session } = useSession();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      profileImageSize: 150,
    });
  }, []);

  // if the user is not logged in and the pathname starts with /(protected) redirect to /login
  if (!session && pathname.startsWith("/(protected)")) {
    return <Redirect href="/login" />;
  }

  console.log("session layout", session, pathname);

  return (
    <GluestackUIProvider mode="light">
      <GestureHandlerRootView style={{ flex: 1, color: "black" }}>
        <Stack>
          <Stack.Screen
            name="(protected)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="register"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
      </GestureHandlerRootView>
    </GluestackUIProvider>
  );
}

export default function RootLayout() {
  return (
    <>
      <SessionProvider>
        <RootLayoutNav />
      </SessionProvider>
      <Toast />
    </>
  );
}
