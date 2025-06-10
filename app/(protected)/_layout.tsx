import { useSession } from "@/lib/providers/AuthContext";
import { DrawerProvider } from "@/lib/providers/DrawerContext";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import { useState, useEffect } from "react";
import { View } from "react-native";

export default function ProtectedLayout() {
  // const { session } = useSession();

  // // if session is null, redirect to login
  // if (!session) {
  //   return <Redirect href="/login" />;
  // }

  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  function handleAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), handleAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null;

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <DrawerProvider>
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
          name="communities"
          options={{
            title: "Community",
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar />
    </DrawerProvider>
  );
}
