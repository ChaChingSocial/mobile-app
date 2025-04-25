import SideBar from "@/components/profile/SideBar";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import "@/global.css";
import { DrawerContext } from "@/lib/providers/DrawerContext";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useContext } from "react";
import { Image } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import "react-native-reanimated";

export default function ProfileLayout() {
  const { open, setOpen } = useContext(DrawerContext);

  return (
    <Stack
      screenOptions={({ navigation }) => ({
        headerShown: false,
        headerShadowVisible: true,
        headerStyle: {
          backgroundColor: "#fff",
        },
        headerTitle: () => (
          <TouchableOpacity onPressOut={() => navigation.navigate("(home)")}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={{ height: 40, resizeMode: "contain", width: 140 }}
            />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPressOut={() => navigation.navigate("notifications")}
            className="mr-5"
          >
            <Ionicons name="notifications-outline" size={24} color={"black"} />
          </TouchableOpacity>
        ),

        headerLeft: () => (
          <>
            <TouchableOpacity
              onPressOut={() => setOpen(!open)}
              className="ml-5"
            >
              <Avatar size="md">
                <AvatarFallbackText>Jane Doe</AvatarFallbackText>
                <AvatarImage
                  source={{
                    uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
                  }}
                />
              </Avatar>
            </TouchableOpacity>
            <SideBar open={open} onOpenChange={setOpen} />
          </>
        ),
        headerTitleAlign: "center",
        headerBackButtonMenuEnabled: true,
      })}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Profile",
          headerBackVisible: false,
          headerBackTitle: "Back",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
          headerBackVisible: false,
          headerShown: true,
        }}
      />
    </Stack>
  );
}
