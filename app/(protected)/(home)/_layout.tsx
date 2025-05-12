import { Tabs } from "expo-router";
import { useContext } from "react";
import { Image, Platform, TouchableOpacity } from "react-native";

import { HapticTab } from "@/components/HapticTab";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/lib/constants/Colors";
import { DrawerContext } from "@/lib/providers/DrawerContext";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useSession } from "@/lib/providers/AuthContext";

export default function TabLayout() {
  const { open, setOpen } = useContext(DrawerContext);
  const { session } = useSession();

  return (
    <Tabs
      screenOptions={({ navigation }) => {
        return {
          headerShadowVisible: true,
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTitle: () => (
            <TouchableOpacity onPressOut={() => navigation.navigate("index")}>
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
              <Ionicons
                name="notifications-outline"
                size={24}
                color={"black"}
              />
            </TouchableOpacity>
          ),

          headerLeft: () => (
            <TouchableOpacity
              onPressOut={() => setOpen(!open)}
              className="ml-5"
            >
              <Avatar size="md">
                <AvatarFallbackText>{session?.displayName}</AvatarFallbackText>
                <AvatarImage
                  source={{
                    uri: session?.profilePic || "",
                  }}
                />
              </Avatar>
            </TouchableOpacity>
          ),
          headerTitleAlign: "center",

          tabBarActiveTintColor: Colors["light"].tint,
          // tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: "absolute",
            },
            default: {},
          }),
        };
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: "Communities",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={22} name="users" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="growth-tools"
        options={{
          title: "Growth Tools",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={22} name="wrench" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "About",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={22} name="info-circle" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="blog"
        options={{
          title: "Blog",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={22} name="book" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
