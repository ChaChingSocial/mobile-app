import { Stack } from "expo-router";

export default function ProtectedLayout() {
  return (
    <Stack
      screenOptions={() => ({
        headerShown: false,
      })}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="new-image-post" />
      <Stack.Screen name="new-link-post" />
      <Stack.Screen name="new-article-post" />
      <Stack.Screen name="new-podcast-post" />
      <Stack.Screen name="new-event-post" />
    </Stack>
  );
}
