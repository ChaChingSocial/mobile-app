import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { SessionProvider, useSession } from "@/lib/providers/AuthContext";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Redirect, usePathname } from "expo-router";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
  if (
    session === null &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/register")
  ) {
    return <Redirect href="/login" />;
  }

  console.log("session layout", session, pathname);

  return (
    <GluestackUIProvider mode="light">
      <GestureHandlerRootView>
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
        <StatusBar style="dark" backgroundColor="transparent" />
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
