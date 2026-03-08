import { DrawerProvider } from "@/lib/providers/DrawerContext";
import { BlockedUsersProvider } from "@/lib/providers/BlockedUsersContext";
import { PhantomProvider } from "@/lib/wallet/PhantomContext";
import {
  getAuth,
  onAuthStateChanged,
  FirebaseAuthTypes,
} from "@react-native-firebase/auth";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";

export default function ProtectedLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>();

  // Handle user state changes
  function handleAuthStateChanged(user: FirebaseAuthTypes.User | null) {
    setUser(user);

    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), handleAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null;

  return (
    <PhantomProvider>
    <DrawerProvider>
      <BlockedUsersProvider>
        <Stack
          initialRouteName="(home)"
          screenOptions={() => ({
            headerShown: false,
          })}
        >
        <Stack.Screen name="(home)" />
        <Stack.Screen
          name="notifications"
          options={{
            title: "Notifications",
            headerBackTitle: "Back",
            headerShown: true,
          }}
        />
        <Stack.Screen name="create-post" />
        <Stack.Screen
          name="search-community"
          options={{
            title: "",
            headerBackTitle: "Back",
            headerShown: true,
            headerLargeTitle: true,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="report"
          options={{
            title: "Report Content",
            // headerBackTitle: "Back",
            headerShown: true,
            // headerLargeTitle: true,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="communities"
          options={{
            title: "Community",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="blog"
          options={{
            title: "Blog",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: "About",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: "Settings",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="user-profile"
          options={{
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="blocked-users"
          options={{
            title: "Blocked Users",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="webview"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        </Stack>
      </BlockedUsersProvider>
    </DrawerProvider>
    </PhantomProvider>
  );
}
