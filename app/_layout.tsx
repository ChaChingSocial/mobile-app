import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { useFonts } from "expo-font";
import { Link, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Image, TouchableOpacity, View } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
      <Stack
        screenOptions={({ navigation, route }) => ({
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTitle: () => (
            <Image
              source={require("@/assets/images/logo.png")}
              style={{ height: 40, resizeMode: "contain", marginLeft: -140 }}
            />
          ),
          headerRight: () => (
            <Link href="/blog">
              {/* <TouchableOpacity
                // onPress={() => navigation.navigate("notifications")}
                onPress={() => navigation.goBack()}
                // style={{ marginRight: 15 }}
              > */}
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={"black"}
                />
              {/* </TouchableOpacity> */}
            </Link>
          ),
          headerTitleAlign: "center",
        })}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: true }} />
        <Stack.Screen
          name="notifications"
          options={{ title: "Notifications", headerBackTitle: "Back" }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar />
    </GluestackUIProvider>
  );
}
