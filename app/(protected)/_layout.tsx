import { Text } from "@/components/ui/text";
import { useSession } from "@/lib/providers/AuthContext";
import { DrawerProvider } from "@/lib/providers/DrawerContext";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function ProtectedLayout() {
  const { session, isLoading } = useSession();

  // You can keep the splash screen open, or render a loading screen like we do here.
  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  // Only require authentication within the (app) group's layout as users
  // need to be able to access the (auth) group and sign in again.
  if (!session) {
    // On web, static rendering will stop here as the user is not authenticated
    // in the headless Node process that the pages are rendered in.
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
