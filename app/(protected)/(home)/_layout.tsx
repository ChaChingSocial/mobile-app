import { Tabs, useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { Image, Platform, TouchableOpacity } from "react-native";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/lib/constants/Colors";
import { useSession } from "@/lib/providers/AuthContext";
import { DrawerContext } from "@/lib/providers/DrawerContext";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { notificationApi } from "@/config/backend";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";

export default function TabLayout() {
  const { open, setOpen } = useContext(DrawerContext);
  const { session } = useSession();
  const router = useRouter();
  const [totalUnreadNotifications, setTotalUnreadNotifications] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session?.uid) return;
      const count = await notificationApi.getUnreadNotificationsCount({
        userId: session.uid,
      });
      setTotalUnreadNotifications(count);
    };
    fetchNotifications();
  }, [session]);

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
              <Box className="relative">
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color="black"
                />
                {/* {totalUnreadNotifications > 0 && ( */}
                  <Box className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                    <Text className="text-white text-xs font-bold px-1">
                      {totalUnreadNotifications > 9
                        ? "9+"
                        : totalUnreadNotifications}
                    </Text>
                  </Box>
                {/* )} */}
              </Box>
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
          headerRight: () => (
            <TouchableOpacity
              onPressOut={() => router.push("/(protected)/search-community")}
              className="mr-5"
            >
              <Ionicons name="search-outline" size={24} color={"black"} />
            </TouchableOpacity>
          ),
          headerTitleAlign: "left",
          headerTitle: "Communities",
          headerLeft: () => (
            <TouchableOpacity
              onPressOut={() => setOpen(!open)}
              className="ml-4 mr-2"
            >
              <Ionicons name="menu" size={24} color="black" />
            </TouchableOpacity>
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
