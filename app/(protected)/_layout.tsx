import { useSession } from "@/lib/providers/AuthContext";
import { DrawerProvider } from "@/lib/providers/DrawerContext";
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
        <Stack.Screen name="(profile)" />
      </Stack>
      <StatusBar />
    </DrawerProvider>
  );
}
