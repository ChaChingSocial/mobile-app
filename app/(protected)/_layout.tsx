import { useSession } from "@/lib/providers/AuthContext";
import { DrawerProvider } from "@/lib/providers/DrawerContext";
import { S } from "@expo/html-elements";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function ProtectedLayout() {
  const { session } = useSession();

  // if session is null, redirect to login
  if (!session) {
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
